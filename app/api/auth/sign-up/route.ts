import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import * as bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { name, email, password, userType = "customer" } = body;

		if (!email || !password || !name) {
			return NextResponse.json(
				{ message: "Name, email, and password are required" },
				{ status: 400 }
			);
		}

		// Check if user already exists
		const existingUser = await db
			.select()
			.from(user)
			.where(eq(user.email, email))
			.limit(1);

		if (existingUser.length > 0) {
			return NextResponse.json(
				{ message: "User with this email already exists" },
				{ status: 409 }
			);
		}

		// Hash password

		// Create user with Better Auth
		try {
			const result = await auth.api.signUpEmail({
				body: {
					name,
					email,
					password,
				},
			});

			// Update user type if different from default
			if (userType !== "customer" && result.user?.id) {
				await db
					.update(user)
					.set({ userType })
					.where(eq(user.id, result.user.id));
			}

			return NextResponse.json(
				{
					success: true,
					user: {
						id: result.user?.id,
						email: result.user?.email,
						name: result.user?.name,
					},
				},
				{ status: 201 }
			);
		} catch (authError: any) {
			console.error(authError);
			return NextResponse.json(
				{ message: authError.message || "Failed to create user" },
				{ status: 400 }
			);
		}

		// This code is unreachable due to the try/catch block above
	} catch (error) {
		console.error("Error signing up:", error);
		return NextResponse.json(
			{ message: "An error occurred during sign up" },
			{ status: 500 }
		);
	}
}
