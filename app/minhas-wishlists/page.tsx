import { Navbar } from "@/components/navbar";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { WishlistCard } from "@/components/wishlist-card";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { wishlists, wishlistItems } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export default async function MinhasWishlistsPage() {
	// Get session from Better Auth
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/auth/login");
	}

	// Get user's wishlists with item count
	const userWishlists = await db
		.select({
			id: wishlists.id,
			title: wishlists.title,
			description: wishlists.description,
			isPublic: wishlists.isPublic,
			createdAt: wishlists.createdAt,
			updatedAt: wishlists.updatedAt,
			itemCount: count(wishlistItems.id),
		})
		.from(wishlists)
		.leftJoin(wishlistItems, eq(wishlists.id, wishlistItems.wishlistId))
		.where(eq(wishlists.userId, session.user.id))
		.groupBy(wishlists.id)
		.orderBy(wishlists.createdAt);

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />

			<div className="container mx-auto px-4 py-8">
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold mb-2">Minhas Wishlists</h1>
						<p className="text-muted-foreground">
							Gerencie suas listas de desejos de photocards
						</p>
					</div>
					<Button asChild className="bg-pink-600 hover:bg-pink-700">
						<Link href="/minhas-wishlists/nova">
							<Plus className="w-4 h-4 mr-2" />
							Nova Wishlist
						</Link>
					</Button>
				</div>

				{userWishlists && userWishlists.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{userWishlists.map((wishlist) => (
							<WishlistCard
								key={wishlist.id}
								wishlist={{
									id: wishlist.id,
									title: wishlist.title,
									description: wishlist.description,
									isPublic: wishlist.isPublic || false,
									itemCount: wishlist.itemCount,
									createdAt: wishlist.createdAt,
								}}
							/>
						))}
					</div>
				) : (
					<div className="text-center py-12 bg-white rounded-lg">
						<p className="text-muted-foreground mb-4">
							Você ainda não criou nenhuma wishlist
						</p>
						<Button asChild className="bg-pink-600 hover:bg-pink-700">
							<Link href="/minhas-wishlists/nova">Criar Primeira Wishlist</Link>
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
