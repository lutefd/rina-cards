import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { groupPurchases, groupPurchasePhotocards, photocards, user } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> | { id: string } }
) {
	try {
		// Handle Promise or direct params
		const id = params instanceof Promise ? (await params).id : params.id;
		const groupPurchaseId = id;

		// Check if the group purchase exists
		const [groupPurchase] = await db
			.select()
			.from(groupPurchases)
			.where(eq(groupPurchases.id, groupPurchaseId))
			.limit(1);

		if (!groupPurchase) {
			return NextResponse.json(
				{ message: "Group purchase not found" },
				{ status: 404 }
			);
		}

		const photocardsData = await db
			.select({
				id: groupPurchasePhotocards.id,
				groupPurchaseId: groupPurchasePhotocards.groupPurchaseId,
				photocard: groupPurchasePhotocards.photocard,
				idol: groupPurchasePhotocards.idol,
				group: groupPurchasePhotocards.group,
				era: groupPurchasePhotocards.era,
				collection: groupPurchasePhotocards.collection,
				price: groupPurchasePhotocards.price,
				imageUrl: groupPurchasePhotocards.imageUrl,
				available: groupPurchasePhotocards.available,
				quantity: groupPurchasePhotocards.quantity,
				requesterId: groupPurchasePhotocards.requesterId,
				status: groupPurchasePhotocards.status,
				createdAt: groupPurchasePhotocards.createdAt,
				updatedAt: groupPurchasePhotocards.updatedAt,
				requesterName: user.name,
				requesterEmail: user.email,
			})
			.from(groupPurchasePhotocards)
			.leftJoin(
				user,
				groupPurchasePhotocards.requesterId
					? eq(groupPurchasePhotocards.requesterId, user.id)
					: undefined
			)
			.where(eq(groupPurchasePhotocards.groupPurchaseId, groupPurchaseId))
			.orderBy(desc(groupPurchasePhotocards.createdAt));

		return NextResponse.json(photocardsData);
	} catch (error) {
		console.error("Error fetching group purchase photocards:", error);
		return NextResponse.json(
			{ message: "Failed to fetch group purchase photocards" },
			{ status: 500 }
		);
	}
}

export async function POST(
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
		const groupPurchaseId = id;

		// Check if the group purchase exists and the user is the owner
		const [groupPurchase] = await db
			.select()
			.from(groupPurchases)
			.where(
				and(
					eq(groupPurchases.id, groupPurchaseId),
					eq(groupPurchases.sellerId, session.user.id)
				)
			)
			.limit(1);

		if (!groupPurchase) {
			return NextResponse.json(
				{ message: "Group purchase not found or you are not the owner" },
				{ status: 404 }
			);
		}

		// Parse request body
		const body = await request.json();

		// Validate required fields
		if (!body.photocard || !body.price) {
			return NextResponse.json(
				{ message: "Missing required fields" },
				{ status: 400 }
			);
		}

		// First, insert into the general photocards table
		const [generalPhotocard] = await db
			.insert(photocards)
			.values({
				title: body.photocard,
				idol: body.idol,
				group: body.group,
				album: body.era || null,
				version: body.collection || null,
				imageUrl: body.imageUrl,
			})
			.returning();

		// Then insert into group purchase photocards table with reference
		const [newPhotocard] = await db
			.insert(groupPurchasePhotocards)
			.values({
				groupPurchaseId,
				photocard: body.photocard,
				idol: body.idol,
				group: body.group,
				era: body.era,
				collection: body.collection,
				price: body.price,
				imageUrl: body.imageUrl,
				available: body.available ?? true,
				quantity: body.quantity ?? 0,
				photocardsId: generalPhotocard.id,
				status: "approved", // Since the seller is adding it directly
			})
			.returning();

		return NextResponse.json(newPhotocard, { status: 201 });
	} catch (error) {
		console.error("Error creating group purchase photocard:", error);
		return NextResponse.json(
			{ message: "Failed to create group purchase photocard" },
			{ status: 500 }
		);
	}
}
