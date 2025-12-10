import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
	orders,
	groupPurchases,
	orderItems,
	groupPurchasePhotocards,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { createNotification } from "@/lib/redis";

const statusLabels: Record<string, string> = {
	pending: "Pendente",
	confirmed: "Confirmado",
	paid: "Pago",
	shipped: "Enviado",
	delivered: "Entregue",
	canceled: "Cancelado",
};

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

		// Handle Promise or direct params
		const id = params instanceof Promise ? (await params).id : params.id;
		const orderId = id;

		// Get the order and its group purchase
		const [order] = await db
			.select({
				id: orders.id,
				userId: orders.userId,
				groupPurchaseId: orders.groupPurchaseId,
				status: orders.status,
				totalAmount: orders.totalAmount,
				sellerId: groupPurchases.sellerId,
				cegTitle: groupPurchases.title,
			})
			.from(orders)
			.innerJoin(groupPurchases, eq(orders.groupPurchaseId, groupPurchases.id))
			.where(eq(orders.id, orderId))
			.limit(1);

		if (!order) {
			return NextResponse.json({ message: "Order not found" }, { status: 404 });
		}

		// Parse request body
		const body = await request.json();

		// Validate required fields
		if (!body.status) {
			return NextResponse.json(
				{ message: "Missing status field" },
				{ status: 400 }
			);
		}

		// Check if the user is authorized to update the status
		// Only the seller can update the status to anything
		// The buyer can only cancel their own order
		if (
			order.sellerId !== session.user.id &&
			!(order.userId === session.user.id && body.status === "canceled")
		) {
			return NextResponse.json(
				{ message: "You are not authorized to update this order status" },
				{ status: 403 }
			);
		}

		// Validate status value
		const validStatuses = [
			"pending",
			"confirmed",
			"shipped",
			"delivered",
			"canceled",
		];
		if (!validStatuses.includes(body.status)) {
			return NextResponse.json(
				{ message: "Invalid status value" },
				{ status: 400 }
			);
		}

		// Update the order status
		const [updatedOrder] = await db
			.update(orders)
			.set({
				status: body.status,
				updatedAt: new Date(),
			})
			.where(eq(orders.id, orderId))
			.returning();

		// If canceling and restockItems is true (default), restore the stock
		if (body.status === "canceled" && order.status !== "canceled") {
			const shouldRestock = body.restockItems !== false; // Default to true

			if (shouldRestock) {
				// Get order items to restore stock
				const items = await db
					.select({
						productId: orderItems.productId,
						quantity: orderItems.quantity,
					})
					.from(orderItems)
					.where(eq(orderItems.orderId, orderId));

				// Restore stock for each item
				for (const item of items) {
					await db
						.update(groupPurchasePhotocards)
						.set({
							quantity: sql`${groupPurchasePhotocards.quantity} + ${item.quantity}`,
							updatedAt: new Date(),
						})
						.where(eq(groupPurchasePhotocards.id, item.productId));
				}
			}
		}

		// Notify buyer about status change (if status actually changed)
		if (order.status !== body.status) {
			try {
				const oldStatusLabel = statusLabels[order.status] || order.status;
				const newStatusLabel = statusLabels[body.status] || body.status;

				// Determine notification type based on new status
				const notifType =
					body.status === "canceled"
						? "order_canceled"
						: "order_status_changed";

				// Create appropriate message based on status
				let message = "";
				switch (body.status) {
					case "confirmed":
						message = `Seu pedido de R$ ${order.totalAmount.toFixed(
							2
						)} no CEG "${order.cegTitle}" foi confirmado pelo vendedor.`;
						break;
					case "paid":
						message = `O pagamento do seu pedido no CEG "${order.cegTitle}" foi confirmado.`;
						break;
					case "shipped":
						message = `Seu pedido do CEG "${order.cegTitle}" foi enviado! Em breve você receberá seus photocards.`;
						break;
					case "delivered":
						message = `Seu pedido do CEG "${order.cegTitle}" foi marcado como entregue. Aproveite seus photocards!`;
						break;
					case "canceled":
						message = `Seu pedido de R$ ${order.totalAmount.toFixed(
							2
						)} no CEG "${order.cegTitle}" foi cancelado.`;
						break;
					default:
						message = `O status do seu pedido no CEG "${order.cegTitle}" foi alterado de "${oldStatusLabel}" para "${newStatusLabel}".`;
				}

				await createNotification({
					userId: order.userId,
					type: notifType,
					title: `Pedido ${newStatusLabel}`,
					message,
					relatedOrderId: order.id,
					relatedCegId: order.groupPurchaseId,
				});
			} catch (notifError) {
				console.error("Failed to create notification for buyer:", notifError);
			}
		}

		return NextResponse.json(updatedOrder);
	} catch (error) {
		console.error("Error updating order status:", error);
		return NextResponse.json(
			{ message: "Failed to update order status" },
			{ status: 500 }
		);
	}
}
