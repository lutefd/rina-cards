import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
	try {
		// Verify authentication
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		// Get user profile
		const [userProfile] = await db
			.select()
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);

		if (!userProfile) {
			return NextResponse.json({ message: "User not found" }, { status: 404 });
		}

		return NextResponse.json({
			id: userProfile.id,
			email: userProfile.email,
			name: userProfile.name,
			image: userProfile.image,
			userType: userProfile.userType,
			emailVerified: userProfile.emailVerified,
			createdAt: userProfile.createdAt,
			updatedAt: userProfile.updatedAt,
		});
	} catch (error) {
		console.error("Error fetching user profile:", error);
		return NextResponse.json(
			{ message: "Failed to fetch user profile" },
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
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
		const { name } = body;

		// Validate input - userType changes are not allowed
		if (!name) {
			return NextResponse.json(
				{ message: "No fields to update" },
				{ status: 400 }
			);
		}

		// Prepare update data - only name can be updated
		const updateData: { name?: string } = {};
		if (name) updateData.name = name;

		// Update user profile
		await db.update(user).set(updateData).where(eq(user.id, session.user.id));

		// Get updated user profile
		const [updatedProfile] = await db
			.select()
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);

		return NextResponse.json({
			id: updatedProfile.id,
			email: updatedProfile.email,
			name: updatedProfile.name,
			image: updatedProfile.image,
			userType: updatedProfile.userType,
			emailVerified: updatedProfile.emailVerified,
			createdAt: updatedProfile.createdAt,
			updatedAt: updatedProfile.updatedAt,
		});
	} catch (error) {
		console.error("Error updating user profile:", error);
		return NextResponse.json(
			{ message: "Failed to update user profile" },
			{ status: 500 }
		);
	}
}
