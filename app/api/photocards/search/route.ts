import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photocards, groupPurchasePhotocards } from "@/lib/db/schema";
import { and, ilike, or, isNotNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const query = searchParams.get("q") || "";

		if (!query || query.length < 2) {
			return NextResponse.json({ photocards: [] });
		}

		// First search in the photocards table
		const catalogPhotocards = await db
			.select()
			.from(photocards)
			.where(
				or(
					ilike(photocards.title, `%${query}%`),
					ilike(photocards.idol, `%${query}%`),
					ilike(photocards.group, `%${query}%`),
					ilike(photocards.album, `%${query}%`),
					ilike(photocards.version, `%${query}%`)
				)
			)
			.limit(20);

		// Then search in group purchase photocards for more results
		// Only include those that have a reference to the general photocards table
		const gpPhotocards = await db
			.select()
			.from(groupPurchasePhotocards)
			.where(
				and(
					isNotNull(groupPurchasePhotocards.photocardsId), // Only include if linked to general catalog
					or(
						ilike(groupPurchasePhotocards.photocard, `%${query}%`),
						ilike(groupPurchasePhotocards.idol, `%${query}%`),
						ilike(groupPurchasePhotocards.group, `%${query}%`),
						ilike(groupPurchasePhotocards.era, `%${query}%`),
						ilike(groupPurchasePhotocards.collection, `%${query}%`)
					)
				)
			)
			.limit(20);

		const formattedCatalogPhotocards = catalogPhotocards.map((pc) => ({
			id: pc.id,
			titulo: pc.title,
			idol: pc.idol,
			grupo: pc.group,
			era: pc.album,
			colecao: pc.version,
			imagem_url: pc.imageUrl,
			preco: 0, // Default price since catalog doesn't have prices
			source: "catalog",
		}));

		const formattedGpPhotocards = gpPhotocards.map((pc) => ({
			id: pc.photocardsId || pc.id,
			titulo: pc.photocard,
			idol: pc.idol,
			grupo: pc.group,
			era: pc.era,
			colecao: pc.collection,
			imagem_url: pc.imageUrl,
			preco: pc.price,
			source: "group_purchase",
		}));

		// Combine and deduplicate results
		const allResults = [
			...formattedCatalogPhotocards,
			...formattedGpPhotocards,
		];

		// Remove duplicates based on title + idol combination
		const seenKeys = new Set();
		const uniqueResults = allResults.filter((item) => {
			const key = `${item.titulo}-${item.idol}`;
			if (seenKeys.has(key)) return false;
			seenKeys.add(key);
			return true;
		});

		return NextResponse.json({ photocards: uniqueResults });
	} catch (error) {
		console.error("Error searching photocards:", error);
		return NextResponse.json(
			{ error: "Failed to search photocards" },
			{ status: 500 }
		);
	}
}
