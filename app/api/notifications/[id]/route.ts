import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { markNotificationAsRead, deleteNotification } from "@/lib/redis";

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

		// Mark notification as read
		const success = await markNotificationAsRead(id);

		if (!success) {
			return NextResponse.json(
				{ message: "Notification not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({ message: "Notification marked as read" });
	} catch (error) {
		console.error("Error marking notification as read:", error);
		return NextResponse.json(
			{ message: "Failed to mark notification as read" },
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

		const id = params instanceof Promise ? (await params).id : params.id;

		// Delete the notification
		await deleteNotification(id, session.user.id);

		return NextResponse.json({ message: "Notification deleted" });
	} catch (error) {
		console.error("Error deleting notification:", error);
		return NextResponse.json(
			{ message: "Failed to delete notification" },
			{ status: 500 }
		);
	}
}
