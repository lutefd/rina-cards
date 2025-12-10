import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { orders, orderItems, groupPurchasePhotocards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;

		// Get the order to verify access
		const [order] = await db
			.select()
			.from(orders)
			.where(eq(orders.id, id))
			.limit(1);

		if (!order) {
			return NextResponse.json({ message: "Order not found" }, { status: 404 });
		}

		// Get order items with photocard details
		const items = await db
			.select({
				id: orderItems.id,
				productId: orderItems.productId,
				quantity: orderItems.quantity,
				unitPrice: orderItems.unitPrice,
				photocard: groupPurchasePhotocards.photocard,
				idol: groupPurchasePhotocards.idol,
				group: groupPurchasePhotocards.group,
			})
			.from(orderItems)
			.leftJoin(
				groupPurchasePhotocards,
				eq(orderItems.productId, groupPurchasePhotocards.id)
			)
			.where(eq(orderItems.orderId, id));

		return NextResponse.json({ items });
	} catch (error) {
		console.error("Error fetching order items:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}
