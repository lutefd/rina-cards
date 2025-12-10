/**
 * Client-side API wrapper for Better Auth and Drizzle
 */

// Types
export interface UserProfile {
	id: string;
	name: string | null;
	email: string;
	image: string | null;
	emailVerified: boolean | null;
	userType: string;
	createdAt: string;
	updatedAt: string;
}

export interface GroupPurchase {
	id: string;
	sellerId: string;
	title: string;
	description: string | null;
	type: string;
	marketplaceSource: string | null;
	closingDate: string | null;
	additionalFee: number | null;
	shippingInfo: string | null;
	status: string;
	createdAt: string;
	updatedAt: string;
	sellerName?: string;
	sellerEmail?: string;
}

export interface GroupPurchasePhotocard {
	id: string;
	groupPurchaseId: string;
	photocard: string;
	idol: string | null;
	group: string | null;
	era: string | null;
	collection: string | null;
	price: number;
	imageUrl: string | null;
	available: boolean;
	quantity: number;
	requesterId: string | null;
	requestNotes: string | null;
	photocardsId: string | null;
	status: string;
	createdAt: string;
	updatedAt: string;
	requester?: {
		name: string;
		email: string;
	};
}

export interface Order {
	id: string;
	userId: string;
	groupPurchaseId: string;
	productId: string | null;
	quantity: number;
	unitPrice: number;
	status: string;
	totalAmount: number;
	contactInfo: Record<string, any> | null;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
	user?: {
		name: string;
		email: string;
	};
	items?: OrderItem[];
}

export interface OrderItem {
	id: string;
	orderId: string;
	productId: string;
	quantity: number;
	unitPrice: number;
	createdAt: string;
	updatedAt: string;
	product?: {
		name: string;
		description: string | null;
	};
}

export interface Wishlist {
	id: string;
	userId: string;
	title: string;
	description: string | null;
	isPublic: boolean;
	createdAt: string;
	updatedAt: string;
	items?: WishlistItem[];
}

export interface WishlistItem {
	id: string;
	wishlistId: string;
	photocard: string;
	idol: string | null;
	group: string | null;
	album: string | null;
	version: string | null;
	imageUrl: string | null;
	priority: number;
	status: string;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
	photocardsId?: string | null; // Reference to the photocards table if it exists
}

// User API
export async function getUserProfile(): Promise<UserProfile> {
	const res = await fetch("/api/user/profile");
	if (!res.ok) {
		throw new Error("Failed to fetch user profile");
	}
	return res.json();
}

export async function updateUserProfile(data: {
	name?: string;
	userType?: string;
}): Promise<UserProfile> {
	const res = await fetch("/api/user/profile", {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!res.ok) {
		throw new Error("Failed to update user profile");
	}

	return res.json();
}

// Group Purchases (CEGs) API
export async function getGroupPurchases(options?: {
	status?: string;
	sellerId?: string;
}): Promise<GroupPurchase[]> {
	let url = "/api/group-purchases";
	const params = new URLSearchParams();

	if (options?.status) {
		params.append("status", options.status);
	}

	if (options?.sellerId) {
		params.append("sellerId", options.sellerId);
	}

	if (params.toString()) {
		url += `?${params.toString()}`;
	}

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error("Failed to fetch group purchases");
	}
	return res.json();
}

export async function getGroupPurchase(id: string): Promise<{
	groupPurchase: GroupPurchase;
	photocards: GroupPurchasePhotocard[];
	hasOrder: boolean;
	isOwner: boolean;
}> {
	const res = await fetch(`/api/group-purchases/${id}`);
	if (!res.ok) {
		throw new Error("Failed to fetch group purchase");
	}
	return res.json();
}

export async function createGroupPurchase(data: {
	title: string;
	description?: string;
	type: string;
	marketplaceSource?: string;
	closingDate?: string;
	additionalFee?: number;
	shippingInfo?: string;
}): Promise<GroupPurchase> {
	const res = await fetch("/api/group-purchases", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!res.ok) {
		throw new Error("Failed to create group purchase");
	}

	return res.json();
}

export async function updateGroupPurchase(
	id: string,
	data: {
		title?: string;
		description?: string | null;
		type?: string;
		marketplaceSource?: string | null;
		closingDate?: string | null;
		additionalFee?: number;
		shippingInfo?: string | null;
		status?: string;
	}
): Promise<GroupPurchase> {
	const res = await fetch(`/api/group-purchases/${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!res.ok) {
		throw new Error("Failed to update group purchase");
	}

	return res.json();
}

export async function deleteGroupPurchase(
	id: string
): Promise<{ message: string }> {
	const res = await fetch(`/api/group-purchases/${id}`, {
		method: "DELETE",
	});

	if (!res.ok) {
		throw new Error("Failed to delete group purchase");
	}

	return res.json();
}

export async function getGroupPurchasePhotocards(
	groupPurchaseId: string
): Promise<GroupPurchasePhotocard[]> {
	const res = await fetch(`/api/group-purchases/${groupPurchaseId}/photocards`);
	if (!res.ok) {
		throw new Error("Failed to fetch group purchase photocards");
	}
	return res.json();
}

export async function createGroupPurchasePhotocard(data: {
	groupPurchaseId: string;
	photocard: string;
	idol?: string;
	group?: string;
	era?: string;
	collection?: string;
	price: number;
	imageUrl?: string;
	quantity?: number;
	requestNotes?: string;
	photocardsId?: string;
}): Promise<GroupPurchasePhotocard> {
	const res = await fetch(
		`/api/group-purchases/${data.groupPurchaseId}/photocards`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		}
	);

	if (!res.ok) {
		throw new Error("Failed to create group purchase photocard");
	}

	return res.json();
}

export async function updateGroupPurchasePhotocard(
	id: string,
	data: {
		photocard?: string;
		idol?: string | null;
		group?: string | null;
		era?: string | null;
		collection?: string | null;
		price?: number;
		imageUrl?: string | null;
		available?: boolean;
		quantity?: number;
		requestNotes?: string | null;
		photocardsId?: string | null;
		status?: string;
	}
): Promise<GroupPurchasePhotocard> {
	const res = await fetch(`/api/group-purchase-photocards/${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!res.ok) {
		throw new Error("Failed to update group purchase photocard");
	}

	return res.json();
}

export async function deleteGroupPurchasePhotocard(
	id: string
): Promise<{ message: string }> {
	const res = await fetch(`/api/group-purchase-photocards/${id}`, {
		method: "DELETE",
	});

	if (!res.ok) {
		throw new Error("Failed to delete group purchase photocard");
	}

	return res.json();
}

// Request a photocard for a group purchase
export async function requestPhotocard(data: {
	groupPurchaseId: string;
	photocard: string;
	idol?: string;
	group?: string;
	era?: string;
	collection?: string;
	imageUrl?: string;
	requestNotes?: string;
	photocardsId?: string;
}): Promise<GroupPurchasePhotocard> {
	const res = await fetch(
		`/api/group-purchases/${data.groupPurchaseId}/request-photocard`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		}
	);

	if (!res.ok) {
		throw new Error("Failed to request photocard");
	}

	return res.json();
}

// Orders API
export async function getOrders(options?: {
	groupPurchaseId?: string;
}): Promise<Order[]> {
	let url = "/api/orders";
	const params = new URLSearchParams();

	if (options?.groupPurchaseId) {
		params.append("groupPurchaseId", options.groupPurchaseId);
	}

	if (params.toString()) {
		url += `?${params.toString()}`;
	}

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error("Failed to fetch orders");
	}
	return res.json();
}

export async function getOrder(id: string): Promise<Order> {
	const res = await fetch(`/api/orders/${id}`);
	if (!res.ok) {
		throw new Error("Failed to fetch order");
	}
	return res.json();
}

export async function createOrder(data: {
	groupPurchaseId: string;
	productId?: string;
	quantity?: number;
	unitPrice?: number;
	contactInfo?: Record<string, any>;
	notes?: string;
	items?: Array<{
		productId: string;
		quantity: number;
	}>;
}): Promise<Order> {
	const res = await fetch("/api/orders", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!res.ok) {
		throw new Error("Failed to create order");
	}

	return res.json();
}

export async function updateOrderStatus(
	id: string,
	status: string,
	options?: { restockItems?: boolean }
): Promise<Order> {
	const res = await fetch(`/api/orders/${id}/status`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			status,
			restockItems: options?.restockItems,
		}),
	});

	if (!res.ok) {
		throw new Error("Failed to update order status");
	}

	return res.json();
}

// Wishlists API
export async function getWishlists(options?: {
	userId?: string;
	isPublic?: boolean;
}): Promise<Wishlist[]> {
	let url = "/api/wishlists";
	const params = new URLSearchParams();

	if (options?.userId) {
		params.append("userId", options.userId);
	}

	if (options?.isPublic !== undefined) {
		params.append("isPublic", options.isPublic.toString());
	}

	if (params.toString()) {
		url += `?${params.toString()}`;
	}

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error("Failed to fetch wishlists");
	}
	return res.json();
}

export async function getWishlist(id: string): Promise<Wishlist> {
	const res = await fetch(`/api/wishlists/${id}`);
	if (!res.ok) {
		throw new Error("Failed to fetch wishlist");
	}
	return res.json();
}

export async function createWishlist(data: {
	title: string;
	description?: string;
	isPublic?: boolean;
}): Promise<Wishlist> {
	const res = await fetch("/api/wishlists", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!res.ok) {
		throw new Error("Failed to create wishlist");
	}

	return res.json();
}

export async function updateWishlist(
	id: string,
	data: {
		title?: string;
		description?: string | null;
		isPublic?: boolean;
	}
): Promise<Wishlist> {
	const res = await fetch(`/api/wishlists/${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!res.ok) {
		throw new Error("Failed to update wishlist");
	}

	return res.json();
}

export async function deleteWishlist(id: string): Promise<{ message: string }> {
	const res = await fetch(`/api/wishlists/${id}`, {
		method: "DELETE",
	});

	if (!res.ok) {
		throw new Error("Failed to delete wishlist");
	}

	return res.json();
}

// Wishlist Items API
export async function addWishlistItem(data: {
	wishlistId: string;
	photocard: string;
	idol?: string;
	group?: string;
	album?: string;
	version?: string;
	imageUrl?: string;
	priority?: number;
	status?: string;
	notes?: string;
	photocardsId?: string; // If selecting an existing photocard
}): Promise<WishlistItem> {
	const res = await fetch(`/api/wishlists/${data.wishlistId}/items`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!res.ok) {
		throw new Error("Failed to add wishlist item");
	}

	return res.json();
}

export async function updateWishlistItem(
	id: string,
	data: {
		photocard?: string;
		idol?: string | null;
		group?: string | null;
		album?: string | null;
		version?: string | null;
		imageUrl?: string | null;
		priority?: number;
		status?: string;
		notes?: string | null;
	}
): Promise<WishlistItem> {
	const res = await fetch(`/api/wishlist-items/${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!res.ok) {
		throw new Error("Failed to update wishlist item");
	}

	return res.json();
}

export async function deleteWishlistItem(
	id: string
): Promise<{ message: string }> {
	const res = await fetch(`/api/wishlist-items/${id}`, {
		method: "DELETE",
	});

	if (!res.ok) {
		throw new Error("Failed to delete wishlist item");
	}

	return res.json();
}

// Authentication helpers
export async function isAuthenticated(): Promise<boolean> {
	try {
		const res = await fetch("/api/auth/get-session");
		if (!res.ok) return false;
		const data = await res.json();
		return !!data.session;
	} catch (error) {
		return false;
	}
}

export async function logout(): Promise<{ success: boolean }> {
	const res = await fetch("/api/auth/sign-out", { method: "POST" });
	if (!res.ok) {
		throw new Error("Failed to sign out");
	}
	return res.json();
}

// Photocard API
export interface Photocard {
	id: string;
	title: string;
	description: string | null;
	idol: string;
	group: string;
	album: string;
	version: string;
	imageUrl: string | null;
	price: number | null;
	saleType: string | null;
	status: string;
	// Legacy fields
	titulo?: string;
	descricao?: string | null;
	grupo?: string;
	era?: string;
	colecao?: string;
	imagem_url?: string | null;
	preco?: number | null;
	tipo_venda?: string | null;
}

export async function getAvailablePhotocards(): Promise<Photocard[]> {
	const res = await fetch("/api/photocards?status=available");
	if (!res.ok) {
		throw new Error("Failed to fetch photocards");
	}
	return res.json();
}

// Photocards search API
export async function searchPhotocards(query: string): Promise<
	Array<{
		id: string;
		titulo: string;
		idol: string | null;
		grupo: string | null;
		era: string | null;
		colecao: string | null;
		imagem_url: string | null;
		preco: number;
		source: "catalog" | "group_purchase";
	}>
> {
	if (!query || query.length < 2) {
		return [];
	}

	const res = await fetch(
		`/api/photocards/search?q=${encodeURIComponent(query)}`
	);
	if (!res.ok) {
		throw new Error("Failed to search photocards");
	}

	const data = await res.json();
	return data.photocards;
}
