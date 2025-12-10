import {
	pgTable,
	text,
	timestamp,
	uuid,
	integer,
	boolean,
	doublePrecision,
	jsonb,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import crypto from "crypto";

// User table
export const user = pgTable("user", {
	id: text("id").primaryKey(), // Better Auth generates its own string IDs
	name: text("name"),
	email: text("email").notNull().unique(),
	image: text("image"),
	emailVerified: boolean("emailVerified"), // Changed field name to match Better Auth's expectations
	userType: text("user_type").default("customer").notNull(), // Custom field: 'customer', 'seller', 'admin'
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Account table for OAuth providers and email/password
export const account = pgTable("account", {
	id: text("id").primaryKey(), // Better Auth generates its own string IDs
	userId: text("user_id")
		.notNull()
		.references(() => user.id), // References user.id which is now text
	accountId: text("account_id").notNull(), // Added as required by Better Auth
	providerId: text("provider_id").notNull(), // Renamed from provider to providerId
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"), // Renamed from expiresAt
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at").defaultNow(), // Added default value
	scope: text("scope"),
	idToken: text("id_token"),
	password: text("password").default(""), // Added default value
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Account relations
export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

// Session table
export const session = pgTable("session", {
	id: text("id").primaryKey(), // Better Auth generates its own string IDs
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }), // References user.id which is now text
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Session relations
export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

// Verification tokens for email verification and password reset
export const verification = pgTable("verification", {
	id: text("id").primaryKey(), // Better Auth generates its own string IDs
	identifier: text("identifier").notNull(), // Usually the user's email
	value: text("value").notNull(), // This was missing - Better Auth requires this field
	expiresAt: timestamp("expires_at").notNull(), // Changed from 'expires' to 'expiresAt'
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(), // Added updatedAt field
});

// Group Purchases table (previously "cegs" - Compras Em Grupo)
export const groupPurchases = pgTable("group_purchases", {
	id: uuid("id").primaryKey().defaultRandom(),
	sellerId: text("seller_id")
		.notNull()
		.references(() => user.id), // References user.id which is now text
	title: text("title").notNull(),
	description: text("description"),
	type: text("type").notNull(), // 'national', 'international'
	marketplaceSource: text("marketplace_source"),
	closingDate: timestamp("closing_date"),
	additionalFee: doublePrecision("additional_fee").default(0),
	shippingInfo: text("shipping_info"),
	status: text("status").default("open").notNull(), // 'open', 'closed', 'processing', 'finished', 'canceled'
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Photocards table (replaces the old 'photocards' table)
export const photocards = pgTable("photocards", {
	id: uuid("id").primaryKey().defaultRandom(),
	title: text("title").notNull(),
	idol: text("idol"),
	group: text("group"),
	album: text("album"),
	version: text("version"),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Group Purchase Photocards table (replaces the old 'ceg_photocards' table)
export const groupPurchasePhotocards = pgTable("group_purchase_photocards", {
	id: uuid("id").primaryKey().defaultRandom(),
	groupPurchaseId: uuid("group_purchase_id")
		.notNull()
		.references(() => groupPurchases.id, { onDelete: "cascade" }),
	photocard: text("photocard").notNull(), // Title of the photocard
	idol: text("idol"),
	group: text("group"),
	era: text("era"), // Era/album version
	collection: text("collection"), // Collection name
	price: doublePrecision("price").notNull(),
	imageUrl: text("image_url"),
	available: boolean("available").default(true),
	quantity: integer("quantity").default(0),
	requesterId: text("requester_id").references(() => user.id), // User who requested this photocard
	requestNotes: text("request_notes"), // Notes from the requester
	photocardsId: uuid("photocards_id").references(() => photocards.id), // Reference to the photocards table
	status: text("status").default("pending").notNull(), // 'pending', 'approved', 'rejected'
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Products table (for items in group purchases)
export const products = pgTable("products", {
	id: uuid("id").primaryKey().defaultRandom(),
	groupPurchaseId: uuid("group_purchase_id")
		.notNull()
		.references(() => groupPurchases.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	description: text("description"),
	price: doublePrecision("price").notNull(),
	imageUrl: text("image_url"),
	available: boolean("available").default(true),
	quantity: integer("quantity").default(0),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product relations will be defined after all tables are created

// Orders table
export const orders = pgTable("orders", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	groupPurchaseId: uuid("group_purchase_id")
		.notNull()
		.references(() => groupPurchases.id),
	productId: uuid("product_id").references(() => products.id),
	quantity: integer("quantity").default(1).notNull(),
	unitPrice: doublePrecision("unit_price").notNull(),
	status: text("status").default("pending").notNull(), // 'pending', 'confirmed', 'paid', 'shipped', 'delivered', 'canceled'
	totalAmount: doublePrecision("total_amount").notNull(),
	contactInfo: jsonb("contact_info"), // Additional contact information
	notes: text("notes"), // Order notes
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Order relations will be defined after all tables are created

// Order Items table
export const orderItems = pgTable("order_items", {
	id: uuid("id").primaryKey().defaultRandom(),
	orderId: uuid("order_id")
		.notNull()
		.references(() => orders.id, { onDelete: "cascade" }),
	productId: uuid("product_id")
		.notNull()
		.references(() => products.id),
	quantity: integer("quantity").notNull(),
	unitPrice: doublePrecision("unit_price").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Wishlists table
export const wishlists = pgTable("wishlists", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	description: text("description"),
	isPublic: boolean("is_public").default(true),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Wishlist Items table
export const wishlistItems = pgTable("wishlist_items", {
	id: uuid("id").primaryKey().defaultRandom(),
	wishlistId: uuid("wishlist_id")
		.notNull()
		.references(() => wishlists.id, { onDelete: "cascade" }),
	photocard: text("photocard").notNull(),
	idol: text("idol"),
	group: text("group"),
	album: text("album"),
	version: text("version"),
	imageUrl: text("image_url"),
	priority: integer("priority").default(0), // 0 = normal, 1 = high, 2 = very high
	status: text("status").default("wanted").notNull(), // 'wanted', 'pending', 'acquired'
	notes: text("notes"),
	photocardsId: uuid("photocards_id").references(() => photocards.id, {
		onDelete: "set null",
	}),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define all relations after all tables are created

// User relations
export const userRelations = relations(user, ({ many }) => ({
	accounts: many(account),
	sessions: many(session),
	groupPurchases: many(groupPurchases),
	orders: many(orders),
	wishlists: many(wishlists),
	groupPurchaseRequests: many(groupPurchasePhotocards, {
		relationName: "requester",
	}),
}));

// Group Purchase relations
export const groupPurchasesRelations = relations(
	groupPurchases,
	({ one, many }) => ({
		seller: one(user, {
			fields: [groupPurchases.sellerId],
			references: [user.id],
		}),
		products: many(products),
		orders: many(orders),
		photocards: many(groupPurchasePhotocards),
	})
);

// Photocards relations
export const photocardsRelations = relations(photocards, ({ many }) => ({
	groupPurchasePhotocards: many(groupPurchasePhotocards),
}));

// Group Purchase Photocards relations
export const groupPurchasePhotocardsRelations = relations(
	groupPurchasePhotocards,
	({ one }) => ({
		groupPurchase: one(groupPurchases, {
			fields: [groupPurchasePhotocards.groupPurchaseId],
			references: [groupPurchases.id],
		}),
		requester: one(user, {
			fields: [groupPurchasePhotocards.requesterId],
			references: [user.id],
		}),
		photocard: one(photocards, {
			fields: [groupPurchasePhotocards.photocardsId],
			references: [photocards.id],
		}),
	})
);

// Wishlists relations
export const wishlistsRelations = relations(wishlists, ({ one, many }) => ({
	user: one(user, {
		fields: [wishlists.userId],
		references: [user.id],
	}),
	items: many(wishlistItems),
}));

// Wishlist Items relations
export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
	wishlist: one(wishlists, {
		fields: [wishlistItems.wishlistId],
		references: [wishlists.id],
	}),
	photocard: one(photocards, {
		fields: [wishlistItems.photocardsId],
		references: [photocards.id],
	}),
}));

// Product relations
export const productsRelations = relations(products, ({ one, many }) => ({
	groupPurchase: one(groupPurchases, {
		fields: [products.groupPurchaseId],
		references: [groupPurchases.id],
	}),
	orderItems: many(orderItems),
}));

// Order relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
	user: one(user, {
		fields: [orders.userId],
		references: [user.id],
	}),
	groupPurchase: one(groupPurchases, {
		fields: [orders.groupPurchaseId],
		references: [groupPurchases.id],
	}),
	orderItems: many(orderItems),
}));

// Order Item relations
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id],
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id],
	}),
}));
