import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
	groupPurchases,
	groupPurchasePhotocards,
	orderItems,
	orders,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, inArray } from "drizzle-orm";
import { createNotification } from "@/lib/redis";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> | { id: string } }
) {
	try {
		// Handle Promise or direct params
		const id = params instanceof Promise ? (await params).id : params.id;
		const photocardId = id;

		// Get the photocard
		const [photocard] = await db
			.select()
			.from(groupPurchasePhotocards)
			.where(eq(groupPurchasePhotocards.id, photocardId))
			.limit(1);

		if (!photocard) {
			return NextResponse.json(
				{ message: "Photocard not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(photocard);
	} catch (error) {
		console.error("Error fetching photocard:", error);
		return NextResponse.json(
			{ message: "Failed to fetch photocard" },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> | { id: string } }
) {
	try {
		// Verify authentication
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const id = params instanceof Promise ? (await params).id : params.id;
		const photocardId = id;

		// Get the photocard and its group purchase
		const [photocard] = await db
			.select({
				id: groupPurchasePhotocards.id,
				groupPurchaseId: groupPurchasePhotocards.groupPurchaseId,
				sellerId: groupPurchases.sellerId,
			})
			.from(groupPurchasePhotocards)
			.innerJoin(
				groupPurchases,
				eq(groupPurchasePhotocards.groupPurchaseId, groupPurchases.id)
			)
			.where(eq(groupPurchasePhotocards.id, photocardId))
			.limit(1);

		if (!photocard) {
			return NextResponse.json(
				{ message: "Photocard not found" },
				{ status: 404 }
			);
		}

		// Check if the user is the seller of the group purchase
		if (photocard.sellerId !== session.user.id) {
			return NextResponse.json(
				{ message: "You are not authorized to update this photocard" },
				{ status: 403 }
			);
		}

		// Parse request body
		const body = await request.json();

		// Update the photocard
		const [updatedPhotocard] = await db
			.update(groupPurchasePhotocards)
			.set({
				photocard: body.photocard ?? undefined,
				idol: body.idol ?? undefined,
				group: body.group ?? undefined,
				price: body.price ?? undefined,
				imageUrl: body.imageUrl ?? undefined,
				available: body.available ?? undefined,
				quantity: body.quantity ?? undefined,
				status: body.status ?? undefined,
				updatedAt: new Date(),
			})
			.where(eq(groupPurchasePhotocards.id, photocardId))
			.returning();

		return NextResponse.json(updatedPhotocard);
	} catch (error) {
		console.error("Error updating photocard:", error);
		return NextResponse.json(
			{ message: "Failed to update photocard" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> | { id: string } }
) {
	try {
		// Verify authentication
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		// Handle Promise or direct params
		const id = params instanceof Promise ? (await params).id : params.id;
		const photocardId = id;

		// Get the photocard and its group purchase with more details
		const [photocard] = await db
			.select({
				id: groupPurchasePhotocards.id,
				name: groupPurchasePhotocards.photocard,
				idol: groupPurchasePhotocards.idol,
				groupPurchaseId: groupPurchasePhotocards.groupPurchaseId,
				groupPurchaseTitle: groupPurchases.title,
				sellerId: groupPurchases.sellerId,
				requesterId: groupPurchasePhotocards.requesterId,
			})
			.from(groupPurchasePhotocards)
			.innerJoin(
				groupPurchases,
				eq(groupPurchasePhotocards.groupPurchaseId, groupPurchases.id)
			)
			.where(eq(groupPurchasePhotocards.id, photocardId))
			.limit(1);

		if (!photocard) {
			return NextResponse.json(
				{ message: "Photocard not found" },
				{ status: 404 }
			);
		}

		// Check if the user is the seller of the group purchase or the requester
		if (
			photocard.sellerId !== session.user.id &&
			photocard.requesterId !== session.user.id
		) {
			return NextResponse.json(
				{ message: "You are not authorized to delete this photocard" },
				{ status: 403 }
			);
		}

		// Find all order items that reference this photocard
		const affectedOrderItems = await db
			.select({
				orderItemId: orderItems.id,
				orderId: orderItems.orderId,
				quantity: orderItems.quantity,
				unitPrice: orderItems.unitPrice,
			})
			.from(orderItems)
			.where(eq(orderItems.productId, photocardId));

		// Get unique order IDs
		const affectedOrderIds = [
			...new Set(affectedOrderItems.map((item) => item.orderId)),
		];

		// Get affected orders with user info
		const affectedOrders =
			affectedOrderIds.length > 0
				? await db
						.select({
							id: orders.id,
							userId: orders.userId,
							status: orders.status,
							totalAmount: orders.totalAmount,
						})
						.from(orders)
						.where(
							and(
								inArray(orders.id, affectedOrderIds)
								// Only cancel orders that are not already delivered or canceled
								// We'll handle this in the loop below
							)
						)
				: [];

		// Cancel affected orders and notify users
		const canceledOrderIds: string[] = [];
		const notifiedUserIds: string[] = [];

		for (const order of affectedOrders) {
			// Skip already canceled or delivered orders
			if (order.status === "canceled" || order.status === "delivered") {
				continue;
			}

			// Cancel the order
			await db
				.update(orders)
				.set({
					status: "canceled",
					updatedAt: new Date(),
				})
				.where(eq(orders.id, order.id));

			canceledOrderIds.push(order.id);

			// Create notification for the user (if not already notified)
			if (!notifiedUserIds.includes(order.userId)) {
				try {
					await createNotification({
						userId: order.userId,
						type: "photocard_removed",
						title: "Photocard removido do CEG",
						message: `O photocard "${photocard.name}" (${
							photocard.idol || "N/A"
						}) foi removido do CEG "${
							photocard.groupPurchaseTitle
						}". Seu pedido foi cancelado automaticamente.`,
						relatedOrderId: order.id,
						relatedCegId: photocard.groupPurchaseId,
					});
					notifiedUserIds.push(order.userId);
				} catch (notifError) {
					// Log but don't fail the deletion if notification fails
					console.error("Failed to create notification:", notifError);
				}
			}
		}

		// Delete the order items referencing this photocard
		if (affectedOrderItems.length > 0) {
			await db.delete(orderItems).where(eq(orderItems.productId, photocardId));
		}

		// Delete the photocard
		await db
			.delete(groupPurchasePhotocards)
			.where(eq(groupPurchasePhotocards.id, photocardId));

		return NextResponse.json({
			message: "Photocard deleted successfully",
			canceledOrders: canceledOrderIds.length,
			notifiedUsers: notifiedUserIds.length,
		});
	} catch (error) {
		console.error("Error deleting photocard:", error);
		return NextResponse.json(
			{ message: "Failed to delete photocard" },
			{ status: 500 }
		);
	}
}
