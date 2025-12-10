import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
	getUserNotifications,
	getUnreadNotificationCount,
	markAllNotificationsAsRead,
} from "@/lib/redis";

export async function GET(request: NextRequest) {
	try {
		// Verify authentication
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const limit = parseInt(searchParams.get("limit") || "50");
		const offset = parseInt(searchParams.get("offset") || "0");
		const countOnly = searchParams.get("countOnly") === "true";

		if (countOnly) {
			const count = await getUnreadNotificationCount(session.user.id);
			return NextResponse.json({ unreadCount: count });
		}

		const notifications = await getUserNotifications(
			session.user.id,
			limit,
			offset
		);
		const unreadCount = await getUnreadNotificationCount(session.user.id);

		return NextResponse.json({
			notifications,
			unreadCount,
		});
	} catch (error) {
		console.error("Error fetching notifications:", error);
		return NextResponse.json(
			{ message: "Failed to fetch notifications" },
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

		// Mark all notifications as read
		const count = await markAllNotificationsAsRead(session.user.id);

		return NextResponse.json({
			message: "All notifications marked as read",
			count,
		});
	} catch (error) {
		console.error("Error marking notifications as read:", error);
		return NextResponse.json(
			{ message: "Failed to mark notifications as read" },
			{ status: 500 }
		);
	}
}
