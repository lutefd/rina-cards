import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	// User type changes are disabled - users cannot change their type to seller
	return NextResponse.json(
		{ message: "User type changes are not allowed" },
		{ status: 403 }
	);
}
