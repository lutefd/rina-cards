import { Navbar } from "@/components/navbar";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { WishlistBuilder } from "@/components/wishlist-builder";
import { ShareWishlistButton } from "@/components/share-wishlist-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Lock, Edit } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { wishlists, wishlistItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function WishlistPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	const [wishlist] = await db
		.select()
		.from(wishlists)
		.where(eq(wishlists.id, id))
		.limit(1);

	if (!wishlist) {
		notFound();
	}

	if (!wishlist.isPublic && wishlist.userId !== session?.user.id) {
		redirect("/minhas-wishlists");
	}

	// Get wishlist items
	const dbItems = await db
		.select()
		.from(wishlistItems)
		.where(eq(wishlistItems.wishlistId, id))
		.orderBy(wishlistItems.priority);

	const items = dbItems.map((item) => ({
		id: item.id,
		wishlistId: item.wishlistId,
		photocard: item.photocard,
		idol: item.idol,
		group: item.group,
		album: item.album,
		version: item.version,
		imageUrl: item.imageUrl,
		priority: item.priority || 0,
		status: item.status || "desejado",
		notes: item.notes,
		createdAt: item.createdAt?.toISOString() || new Date().toISOString(),
		updatedAt: item.updatedAt?.toISOString() || new Date().toISOString(),
		photocardsId: item.photocardsId,
		// Legacy fields for compatibility
		grupo: item.group,
		era: item.album,
		colecao: item.version,
		imagem_url: item.imageUrl,
		notas: item.notes,
		posicao: item.priority || 0,
	}));

	const isOwner = session?.user.id === wishlist.userId;

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />

			<div className="container mx-auto px-4 py-8">
				<div className="mb-8">
					<div className="flex items-start justify-between mb-4">
						<div>
							<h1 className="text-3xl font-bold mb-2">{wishlist.title}</h1>
							{wishlist.description && (
								<p className="text-muted-foreground">{wishlist.description}</p>
							)}
						</div>
						<div className="flex gap-2">
							<Badge variant={wishlist.isPublic ? "default" : "secondary"}>
								{wishlist.isPublic ? (
									<>
										<Eye className="w-3 h-3 mr-1" /> Pública
									</>
								) : (
									<>
										<Lock className="w-3 h-3 mr-1" /> Privada
									</>
								)}
							</Badge>
						</div>
					</div>

					{isOwner && (
						<div className="flex gap-2">
							<Button asChild variant="outline">
								<Link href={`/wishlist/${id}/editar`}>
									<Edit className="w-4 h-4 mr-2" />
									Editar Info
								</Link>
							</Button>
							{wishlist.isPublic && <ShareWishlistButton wishlistId={id} />}
						</div>
					)}
				</div>

				<WishlistBuilder
					wishlistId={id}
					items={items || []}
					isOwner={isOwner}
					wishlistTitle={wishlist.title}
				/>
			</div>
		</div>
	);
}
