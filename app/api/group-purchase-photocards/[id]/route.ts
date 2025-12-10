import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { groupPurchases, groupPurchasePhotocards } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

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

		// Get the photocard and its group purchase
		const [photocard] = await db
			.select({
				id: groupPurchasePhotocards.id,
				groupPurchaseId: groupPurchasePhotocards.groupPurchaseId,
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

		// Delete the photocard
		await db
			.delete(groupPurchasePhotocards)
			.where(eq(groupPurchasePhotocards.id, photocardId));

		return NextResponse.json({ message: "Photocard deleted successfully" });
	} catch (error) {
		console.error("Error deleting photocard:", error);
		return NextResponse.json(
			{ message: "Failed to delete photocard" },
			{ status: 500 }
		);
	}
}
