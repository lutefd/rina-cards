import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		// Parse request body
		const body = await request.json();
		const { userType } = body;

		if (!userType) {
			return NextResponse.json(
				{ message: "User type is required" },
				{ status: 400 }
			);
		}

		// Update user type
		await db.update(user).set({ userType }).where(eq(user.id, session.user.id));

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error("Error updating user type:", error);
		return NextResponse.json(
			{ message: "Failed to update user type" },
			{ status: 500 }
		);
	}
}
