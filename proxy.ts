import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
	// Update session
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// Public routes that don't require authentication
	const publicRoutes = [
		"/",
		"/auth/login",
		"/auth/cadastro",
		"/auth/cadastro-sucesso",
		"/auth/erro",
	];
	const url = new URL(request.url);

	if (publicRoutes.some((route) => url.pathname.startsWith(route))) {
		return NextResponse.next();
	}

	// For API routes, allow the auth handler to manage authentication
	if (url.pathname.startsWith("/api/auth")) {
		return NextResponse.next();
	}

	// For protected routes, redirect to login if no session
	if (!session) {
		return NextResponse.redirect(new URL("/auth/login", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
		"/api/((?!auth).*)",
	],
};
