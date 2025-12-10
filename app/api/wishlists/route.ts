import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { wishlists, wishlistItems } from "@/lib/db/schema";
import { and, eq, desc, or, isNull, isNotNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
	try {
		// Get query parameters
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");
		const isPublic = searchParams.get("isPublic");

		// Build where conditions
		const whereConditions = [];

		// Filter by user ID if provided
		if (userId) {
			whereConditions.push(eq(wishlists.userId, userId));
		}

		// Filter by public/private status if provided
		if (isPublic !== null) {
			whereConditions.push(eq(wishlists.isPublic, isPublic === "true"));
		}

		// If no user ID is provided, only return public wishlists
		// unless the user is authenticated and requesting their own wishlists
		if (!userId) {
			const session = await auth.api.getSession({
				headers: await headers(),
			});

			if (session) {
				// If authenticated, return public wishlists or the user's own wishlists
				whereConditions.push(
					or(
						eq(wishlists.isPublic, true),
						eq(wishlists.userId, session.user.id)
					)
				);
			} else {
				// If not authenticated, only return public wishlists
				whereConditions.push(eq(wishlists.isPublic, true));
			}
		}

		// Execute the query with all conditions
		const wishlistsData = await db
			.select()
			.from(wishlists)
			.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
			.orderBy(desc(wishlists.updatedAt));

		return NextResponse.json(wishlistsData);
	} catch (error) {
		console.error("Error fetching wishlists:", error);
		return NextResponse.json(
			{ message: "Failed to fetch wishlists" },
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
		const { title, description, isPublic = true } = body;

		if (!title) {
			return NextResponse.json(
				{ message: "Title is required" },
				{ status: 400 }
			);
		}

		// Create wishlist
		const [newWishlist] = await db
			.insert(wishlists)
			.values({
				userId: session.user.id,
				title,
				description,
				isPublic,
			})
			.returning();

		return NextResponse.json(newWishlist, { status: 201 });
	} catch (error) {
		console.error("Error creating wishlist:", error);
		return NextResponse.json(
			{ message: "Failed to create wishlist" },
			{ status: 500 }
		);
	}
}
