import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, password } = body;

		if (!email || !password) {
			return NextResponse.json(
				{ message: "Email and password are required" },
				{ status: 400 }
			);
		}

		try {
			await auth.api.signInEmail({
				body: {
					email,
					password,
				},
				headers: await headers(),
			});
		} catch (authError: any) {
			return NextResponse.json(
				{ message: authError.message || "Invalid email or password" },
				{ status: 401 }
			);
		}

		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json(
				{ message: "Failed to create session" },
				{ status: 500 }
			);
		}

		// Get additional user info from the database
		const [userData] = await db
			.select()
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);

		return NextResponse.json({
			success: true,
			user: {
				id: session.user.id,
				email: session.user.email,
				name: session.user.name,
				userType: userData?.userType || "user",
			},
		});
	} catch (error) {
		console.error("Error signing in:", error);
		return NextResponse.json(
			{ message: "An error occurred during sign in" },
			{ status: 500 }
		);
	}
}
