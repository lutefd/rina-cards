import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, products, groupPurchases, groupPurchasePhotocards } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, desc, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
	try {
		// Verify authentication
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		// Get query parameters
		const url = new URL(request.url);
		const groupPurchaseId = url.searchParams.get("groupPurchaseId");

		// Build where conditions
		const whereConditions = [];

		// By default, only show the user's orders
		whereConditions.push(eq(orders.userId, session.user.id));

		if (groupPurchaseId) {
			whereConditions.push(eq(orders.groupPurchaseId, groupPurchaseId));
		}

		// Get orders
		const userOrders = await db
			.select()
			.from(orders)
			.where(and(...whereConditions))
			.orderBy(desc(orders.createdAt));

		// Get order items for each order
		const ordersWithItems = await Promise.all(
			userOrders.map(async (order) => {
				const items = await db
					.select({
						id: orderItems.id,
						orderId: orderItems.orderId,
						productId: orderItems.productId,
						quantity: orderItems.quantity,
						unitPrice: orderItems.unitPrice,
						productName: products.name,
						productDescription: products.description,
					})
					.from(orderItems)
					.leftJoin(products, eq(orderItems.productId, products.id))
					.where(eq(orderItems.orderId, order.id));

				return {
					...order,
					items,
				};
			})
		);

		return NextResponse.json(ordersWithItems);
	} catch (error) {
		console.error("Error fetching orders:", error);
		return NextResponse.json(
			{ message: "Failed to fetch orders" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		// Verify authentication
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		// Parse request body
		const body = await request.json();

		// Validate required fields
		if (!body.groupPurchaseId) {
			return NextResponse.json(
				{ message: "Missing required field: groupPurchaseId" },
				{ status: 400 }
			);
		}

		// Check if we have either items array or direct product info
		if ((!body.items || !body.items.length) && !body.productId) {
			return NextResponse.json(
				{
					message:
						"Missing required fields: either items array or productId must be provided",
				},
				{ status: 400 }
			);
		}

		// Check if the group purchase exists and is open
		const [groupPurchase] = await db
			.select()
			.from(groupPurchases)
			.where(eq(groupPurchases.id, body.groupPurchaseId))
			.limit(1);

		if (!groupPurchase) {
			return NextResponse.json(
				{ message: "Group purchase not found" },
				{ status: 404 }
			);
		}

		if (groupPurchase.status !== "open" && groupPurchase.status !== "aberto") {
			return NextResponse.json(
				{ message: "This group purchase is not open for orders" },
				{ status: 400 }
			);
		}

		// Check if the photocards exist and are available
		const productIds = body.items.map(
			(item: { productId: string; quantity: number }) => item.productId
		);
		const availablePhotocards = await db
			.select()
			.from(groupPurchasePhotocards)
			.where(
				and(
					eq(groupPurchasePhotocards.groupPurchaseId, body.groupPurchaseId),
					eq(groupPurchasePhotocards.available, true),
					eq(groupPurchasePhotocards.status, "approved"),
					inArray(groupPurchasePhotocards.id, productIds)
				)
			);

		const availablePhotocardIds = availablePhotocards.map((photocard) => photocard.id);
		const invalidProductIds = productIds.filter(
			(id: string) => !availablePhotocardIds.includes(id)
		);

		if (invalidProductIds.length > 0) {
			return NextResponse.json(
				{
					message: `Some photocards are not available: ${invalidProductIds.join(
						", "
					)}`,
				},
				{ status: 400 }
			);
		}

		let totalAmount = 0;
		let orderItemsData = [];
		let unitPrice = 0;

		// Handle direct photocard order
		if (body.productId) {
			// Find the photocard
			const photocard = await db
				.select()
				.from(groupPurchasePhotocards)
				.where(
					and(
						eq(groupPurchasePhotocards.id, body.productId),
						eq(groupPurchasePhotocards.groupPurchaseId, body.groupPurchaseId),
						eq(groupPurchasePhotocards.available, true),
						eq(groupPurchasePhotocards.status, "approved")
					)
				)
				.limit(1);

			if (!photocard.length) {
				return NextResponse.json(
					{ message: `Photocard ${body.productId} not found or not available` },
					{ status: 400 }
				);
			}

			// Calculate total amount
			const quantity = body.quantity || 1;
			unitPrice = body.unitPrice || photocard[0].price;
			totalAmount = unitPrice * quantity;

			// Add additional fee if any
			if (groupPurchase.additionalFee) {
				totalAmount += groupPurchase.additionalFee;
			}

			// Create order
			const [newOrder] = await db
				.insert(orders)
				.values({
					userId: session.user.id,
					groupPurchaseId: body.groupPurchaseId,
					productId: body.productId,
					quantity: quantity,
					unitPrice: unitPrice,
					status: "pending",
					totalAmount,
					contactInfo: body.contactInfo || null,
					notes: body.notes || null,
				})
				.returning();

			return NextResponse.json(newOrder, { status: 201 });
		}
		// Handle items array
		else if (body.items && body.items.length) {
			// Calculate total amount
			orderItemsData = body.items.map(
				(item: { productId: string; quantity: number }) => {
					const photocard = availablePhotocards.find(
						(p) => p.id === item.productId
					);
					if (!photocard) {
						throw new Error(`Photocard ${item.productId} not found`);
					}

					const itemTotal = photocard.price * item.quantity;
					totalAmount += itemTotal;

					return {
						productId: item.productId,
						quantity: item.quantity,
						unitPrice: photocard.price,
					};
				}
			);

			// Add additional fee if any
			if (groupPurchase.additionalFee) {
				totalAmount += groupPurchase.additionalFee;
			}

			// Create order
			const [newOrder] = await db
				.insert(orders)
				.values({
					userId: session.user.id,
					groupPurchaseId: body.groupPurchaseId,
					productId: null,
					quantity: 1,
					unitPrice: totalAmount,
					status: "pending",
					totalAmount,
					contactInfo: body.contactInfo || null,
					notes: body.notes || null,
				})
				.returning();

			// Create order items
			const orderItemsWithOrderId = orderItemsData.map((item: any) => ({
				...item,
				orderId: newOrder.id,
			}));

			const createdOrderItems = await db
				.insert(orderItems)
				.values(orderItemsWithOrderId)
				.returning();

			// Return the order with items
			return NextResponse.json(
				{
					...newOrder,
					items: createdOrderItems,
				},
				{ status: 201 }
			);
		}

		// If we reach here, it means neither productId nor items were provided
		return NextResponse.json(
			{ message: "No products specified for the order" },
			{ status: 400 }
		);
	} catch (error) {
		console.error("Error creating order:", error);
		return NextResponse.json(
			{ message: "Failed to create order" },
			{ status: 500 }
		);
	}
}
