import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
	groupPurchases,
	user,
	products,
	orders,
	groupPurchasePhotocards,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, or } from "drizzle-orm";
import { z } from "zod";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> | { id: string } }
) {
	try {
		const id = params instanceof Promise ? (await params).id : params.id;

		// Get the group purchase
		const [groupPurchase] = await db
			.select({
				id: groupPurchases.id,
				title: groupPurchases.title,
				description: groupPurchases.description,
				type: groupPurchases.type,
				marketplaceSource: groupPurchases.marketplaceSource,
				closingDate: groupPurchases.closingDate,
				additionalFee: groupPurchases.additionalFee,
				shippingInfo: groupPurchases.shippingInfo,
				status: groupPurchases.status,
				sellerId: groupPurchases.sellerId,
				sellerName: user.name,
				sellerEmail: user.email,
			})
			.from(groupPurchases)
			.innerJoin(user, eq(groupPurchases.sellerId, user.id))
			.where(eq(groupPurchases.id, id))
			.limit(1);

		if (!groupPurchase) {
			return NextResponse.json(
				{ message: "Group purchase not found" },
				{ status: 404 }
			);
		}

		const availablePhotocards = await db
			.select({
				id: groupPurchasePhotocards.id,
				photocard: groupPurchasePhotocards.photocard,
				idol: groupPurchasePhotocards.idol,
				group: groupPurchasePhotocards.group,
				era: groupPurchasePhotocards.era,
				collection: groupPurchasePhotocards.collection,
				price: groupPurchasePhotocards.price,
				imageUrl: groupPurchasePhotocards.imageUrl,
				available: groupPurchasePhotocards.available,
				status: groupPurchasePhotocards.status,
			})
			.from(groupPurchasePhotocards)
			.where(
				and(
					eq(groupPurchasePhotocards.groupPurchaseId, id),
					eq(groupPurchasePhotocards.status, "approved")
				)
			)
			.orderBy(groupPurchasePhotocards.createdAt);

		// Format photocards with legacy field names for backward compatibility
		const formattedPhotocards = availablePhotocards.map((pc) => ({
			id: pc.id,
			titulo: pc.photocard,
			idol: pc.idol,
			grupo: pc.group,
			era: pc.era,
			colecao: pc.collection,
			preco: pc.price,
			imagem_url: pc.imageUrl,
			disponivel: pc.available,
			status: pc.status,
		}));

		// Check if user has already placed an order
		let hasOrder = false;
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (session) {
			const userOrders = await db
				.select()
				.from(orders)
				.where(
					and(
						eq(orders.groupPurchaseId, id),
						eq(orders.userId, session.user.id)
					)
				)
				.limit(1);

			hasOrder = userOrders.length > 0;
		}

		return NextResponse.json({
			groupPurchase,
			products: formattedPhotocards,
			hasOrder,
			isOwner: session?.user.id === groupPurchase.sellerId,
		});
	} catch (error) {
		console.error("Error fetching group purchase:", error);
		return NextResponse.json(
			{ message: "Failed to fetch group purchase" },
			{ status: 500 }
		);
	}
}

// Schema for validating group purchase update data
const updateGroupPurchaseSchema = z.object({
	title: z.string().optional(),
	description: z.string().nullable().optional(),
	type: z
		.enum(["nacional", "internacional", "national", "international"])
		.optional(),
	marketplaceSource: z.string().nullable().optional(),
	closingDate: z.string().nullable().optional(),
	additionalFee: z.number().optional(),
	shippingInfo: z.string().nullable().optional(),
	status: z
		.enum([
			"aberto",
			"fechado",
			"finalizado",
			"cancelado",
			"open",
			"closed",
			"processing",
			"finished",
			"canceled",
		])
		.optional(),
});

type UpdateGroupPurchaseInput = z.infer<typeof updateGroupPurchaseSchema>;

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> | { id: string } }
) {
	try {
		const id = params instanceof Promise ? (await params).id : params.id;

		// Get session to check authorization
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		// Get the group purchase to check ownership
		const [existingGroupPurchase] = await db
			.select()
			.from(groupPurchases)
			.where(eq(groupPurchases.id, id))
			.limit(1);

		if (!existingGroupPurchase) {
			return NextResponse.json(
				{ message: "Group purchase not found" },
				{ status: 404 }
			);
		}

		// Check if the user is the owner of the group purchase
		if (existingGroupPurchase.sellerId !== session.user.id) {
			return NextResponse.json(
				{ message: "You are not authorized to update this group purchase" },
				{ status: 403 }
			);
		}

		// Parse and validate the request body
		const body = await request.json();
		const validatedData = updateGroupPurchaseSchema.safeParse(body);

		if (!validatedData.success) {
			return NextResponse.json(
				{ message: "Invalid data", errors: validatedData.error.errors },
				{ status: 400 }
			);
		}

		const { closingDate, type, status, ...otherData } =
			validatedData.data as UpdateGroupPurchaseInput;

		const updateData: Partial<typeof groupPurchases.$inferInsert> = {
			...otherData,
			updatedAt: new Date(),
		};

		if (type) {
			const typeMap: Record<string, string> = {
				nacional: "national",
				internacional: "international",
				national: "national",
				international: "international",
			};
			updateData.type = typeMap[type] || type;
		}

		if (status) {
			const statusMap: Record<string, string> = {
				aberto: "open",
				fechado: "closed",
				finalizado: "finished",
				cancelado: "canceled",
				open: "open",
				closed: "closed",
				processing: "processing",
				finished: "finished",
				canceled: "canceled",
			};
			updateData.status = statusMap[status] || status;
		}

		// Convert string date to Date object if provided
		if (closingDate) {
			updateData.closingDate = new Date(closingDate);
		}

		const updatedGroupPurchase = await db
			.update(groupPurchases)
			.set(updateData)
			.where(eq(groupPurchases.id, id))
			.returning();

		return NextResponse.json({
			message: "Group purchase updated successfully",
			groupPurchase: updatedGroupPurchase[0],
		});
	} catch (error) {
		console.error("Error updating group purchase:", error);
		return NextResponse.json(
			{ message: "Failed to update group purchase" },
			{ status: 500 }
		);
	}
}
