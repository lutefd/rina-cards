import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
	baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
	secret:
		process.env.BETTER_AUTH_SECRET ||
		"your-secret-key-change-this-in-production",
	cookieOptions: {
		secure: process.env.NODE_ENV === "production",
	},
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
		maxPasswordLength: 128,
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
			accessType: "offline",
			prompt: "select_account consent",
		},
	},
	user: {
		fields: {
			name: "name",
			email: "email",
			image: "image",
			emailVerified: "emailVerified", // Updated to match the field name in the schema
		},
	},
	experimental: {
		joins: true,
	},
	plugins: [nextCookies()],
});
