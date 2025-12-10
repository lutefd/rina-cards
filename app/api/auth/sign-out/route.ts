import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
	try {
		await auth.api.signOut({
			headers: await headers(),
		});

		const response = NextResponse.json({ success: true }, { status: 200 });

		return response;
	} catch (error) {
		console.error("Error signing out:", error);
		return NextResponse.json(
			{ message: "An error occurred during sign out" },
			{ status: 500 }
		);
	}
}
