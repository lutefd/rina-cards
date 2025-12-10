// NOTE: Run `npm install ioredis` to install the Redis client
import Redis from "ioredis";

const getRedisUrl = (): string | null => {
	const url = process.env.REDIS_URL;
	if (!url) {
		return null;
	}
	return url;
};

// Create a singleton Redis client
let redis: Redis | null = null;
let redisAvailable = true;

export const getRedisClient = (): Redis | null => {
	const redisUrl = getRedisUrl();

	// If no Redis URL configured, skip Redis
	if (!redisUrl) {
		return null;
	}

	// If Redis was previously unavailable, don't retry on every request
	if (!redisAvailable) {
		return null;
	}

	if (!redis) {
		try {
			redis = new Redis(redisUrl, {
				maxRetriesPerRequest: 1,
				retryStrategy: (times: number) => {
					if (times > 1) {
						redisAvailable = false;
						return null; // Stop retrying
					}
					return Math.min(times * 100, 1000);
				},
				connectTimeout: 5000,
				lazyConnect: true,
			});

			redis.on("error", (error: Error) => {
				console.error("Redis connection error:", error.message);
				redisAvailable = false;
			});

			redis.on("connect", () => {
				console.log("Connected to Redis");
				redisAvailable = true;
			});
		} catch (error) {
			console.error("Failed to create Redis client:", error);
			redisAvailable = false;
			return null;
		}
	}
	return redis;
};

// Notification types
export type NotificationType =
	| "new_order"
	| "order_canceled"
	| "photocard_removed"
	| "order_status_changed"
	| "general";

export interface Notification {
	id: string;
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	relatedOrderId?: string;
	relatedCegId?: string;
	read: boolean;
	emailSent: boolean;
	createdAt: string;
}

// Notification keys
const getUserNotificationsKey = (userId: string) =>
	`notifications:user:${userId}`;
const getNotificationKey = (notificationId: string) =>
	`notification:${notificationId}`;

// Create a notification
export async function createNotification(
	notification: Omit<Notification, "id" | "createdAt" | "read" | "emailSent">
): Promise<Notification | null> {
	const redis = getRedisClient();
	if (!redis) {
		console.warn("Redis not available, skipping notification creation");
		return null;
	}

	const id = `notif_${Date.now()}_${Math.random()
		.toString(36)
		.substring(2, 9)}`;

	const fullNotification: Notification = {
		...notification,
		id,
		read: false,
		emailSent: false,
		createdAt: new Date().toISOString(),
	};

	try {
		// Store the notification
		await redis.set(
			getNotificationKey(id),
			JSON.stringify(fullNotification),
			"EX",
			60 * 60 * 24 * 30 // Expire after 30 days
		);

		// Add to user's notification list (sorted by timestamp, newest first)
		await redis.zadd(
			getUserNotificationsKey(notification.userId),
			Date.now(),
			id
		);

		// Keep only the last 100 notifications per user
		await redis.zremrangebyrank(
			getUserNotificationsKey(notification.userId),
			0,
			-101
		);

		return fullNotification;
	} catch (error) {
		console.error("Failed to create notification:", error);
		return null;
	}
}

// Get user notifications
export async function getUserNotifications(
	userId: string,
	limit: number = 50,
	offset: number = 0
): Promise<Notification[]> {
	const redis = getRedisClient();
	if (!redis) {
		return [];
	}

	try {
		// Get notification IDs (newest first)
		const notificationIds = await redis.zrevrange(
			getUserNotificationsKey(userId),
			offset,
			offset + limit - 1
		);

		if (notificationIds.length === 0) {
			return [];
		}

		// Get notification details
		const pipeline = redis.pipeline();
		for (const id of notificationIds) {
			pipeline.get(getNotificationKey(id));
		}
		const results = await pipeline.exec();

		const notifications: Notification[] = [];
		if (results) {
			for (const [err, result] of results) {
				if (!err && result) {
					try {
						notifications.push(JSON.parse(result as string));
					} catch (e) {
						// Skip invalid notifications
					}
				}
			}
		}

		return notifications;
	} catch (error) {
		console.error("Failed to get notifications:", error);
		return [];
	}
}

// Mark notification as read
export async function markNotificationAsRead(
	notificationId: string
): Promise<boolean> {
	const redis = getRedisClient();
	if (!redis) {
		return false;
	}

	try {
		const key = getNotificationKey(notificationId);
		const data = await redis.get(key);
		if (!data) return false;

		const notification: Notification = JSON.parse(data);
		notification.read = true;

		await redis.set(key, JSON.stringify(notification), "KEEPTTL");
		return true;
	} catch (error) {
		console.error("Failed to mark notification as read:", error);
		return false;
	}
}

// Mark all user notifications as read
export async function markAllNotificationsAsRead(
	userId: string
): Promise<number> {
	const redis = getRedisClient();
	if (!redis) {
		return 0;
	}

	try {
		const notificationIds = await redis.zrange(
			getUserNotificationsKey(userId),
			0,
			-1
		);

		let count = 0;
		for (const id of notificationIds) {
			const success = await markNotificationAsRead(id);
			if (success) count++;
		}

		return count;
	} catch (error) {
		console.error("Failed to mark all notifications as read:", error);
		return 0;
	}
}

// Get unread notification count
export async function getUnreadNotificationCount(
	userId: string
): Promise<number> {
	const notifications = await getUserNotifications(userId, 100);
	return notifications.filter((n) => !n.read).length;
}

// Delete a notification
export async function deleteNotification(
	notificationId: string,
	userId: string
): Promise<boolean> {
	const redis = getRedisClient();
	if (!redis) {
		return false;
	}

	try {
		await redis.del(getNotificationKey(notificationId));
		await redis.zrem(getUserNotificationsKey(userId), notificationId);
		return true;
	} catch (error) {
		console.error("Failed to delete notification:", error);
		return false;
	}
}

// Bulk create notifications for multiple users
export async function createBulkNotifications(
	userIds: string[],
	notification: Omit<
		Notification,
		"id" | "userId" | "createdAt" | "read" | "emailSent"
	>
): Promise<Notification[]> {
	const notifications: Notification[] = [];

	for (const userId of userIds) {
		const created = await createNotification({
			...notification,
			userId,
		});
		if (created) {
			notifications.push(created);
		}
	}

	return notifications;
}
