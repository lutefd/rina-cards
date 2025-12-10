import { Navbar } from "@/components/navbar";
import { redirect, notFound } from "next/navigation";
import { EditarWishlistForm } from "@/components/editar-wishlist-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { wishlists } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export default async function EditarWishlistPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	// Get session from Better Auth
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/auth/login");
	}

	// Get wishlist data
	const [wishlist] = await db
		.select()
		.from(wishlists)
		.where(and(eq(wishlists.id, id), eq(wishlists.userId, session.user.id)))
		.limit(1);

	if (!wishlist) {
		notFound();
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />

			<div className="container mx-auto px-4 py-8 max-w-2xl">
				<h1 className="text-3xl font-bold mb-8">Editar Wishlist</h1>
				<EditarWishlistForm wishlist={wishlist} />
			</div>
		</div>
	);
}
