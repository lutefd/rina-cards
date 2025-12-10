import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { groupPurchasePhotocards, groupPurchases } from "@/lib/db/schema";
import { eq, and, desc, gt } from "drizzle-orm";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const status = searchParams.get("status");

		// Get all approved photocards from group purchases that are open and have stock
		const photocards = await db
			.select({
				id: groupPurchasePhotocards.id,
				photocard: groupPurchasePhotocards.photocard,
				idol: groupPurchasePhotocards.idol,
				group: groupPurchasePhotocards.group,
				era: groupPurchasePhotocards.era,
				collection: groupPurchasePhotocards.collection,
				price: groupPurchasePhotocards.price,
				imageUrl: groupPurchasePhotocards.imageUrl,
				available: groupPurchasePhotocards.available,
				quantity: groupPurchasePhotocards.quantity,
				status: groupPurchasePhotocards.status,
				groupPurchaseId: groupPurchasePhotocards.groupPurchaseId,
				photocardsId: groupPurchasePhotocards.photocardsId,
				groupPurchaseType: groupPurchases.type,
			})
			.from(groupPurchasePhotocards)
			.innerJoin(
				groupPurchases,
				eq(groupPurchasePhotocards.groupPurchaseId, groupPurchases.id)
			)
			.where(
				and(
					eq(groupPurchasePhotocards.status, "approved"),
					eq(groupPurchases.status, "open"),
					status === "available"
						? and(
								eq(groupPurchasePhotocards.available, true),
								gt(groupPurchasePhotocards.quantity, 0)
						  )
						: undefined
				)
			)
			.orderBy(desc(groupPurchasePhotocards.createdAt));

		// Aggregate photocards by title+idol to show lowest price and count of CEGs
		const aggregatedMap = new Map<
			string,
			{
				id: string;
				photocard: string;
				idol: string | null;
				group: string | null;
				era: string | null;
				collection: string | null;
				imageUrl: string | null;
				lowestPrice: number;
				highestPrice: number;
				cegCount: number;
				groupPurchaseType: string;
				photocardsId: string | null;
			}
		>();

		for (const pc of photocards) {
			// Use photocardsId if available, otherwise use title+idol as key
			const key = pc.photocardsId || `${pc.photocard}-${pc.idol}`;

			const existing = aggregatedMap.get(key);
			if (existing) {
				existing.lowestPrice = Math.min(existing.lowestPrice, pc.price);
				existing.highestPrice = Math.max(existing.highestPrice, pc.price);
				existing.cegCount += 1;
			} else {
				aggregatedMap.set(key, {
					id: pc.photocardsId || pc.id,
					photocard: pc.photocard,
					idol: pc.idol,
					group: pc.group,
					era: pc.era,
					collection: pc.collection,
					imageUrl: pc.imageUrl,
					lowestPrice: pc.price,
					highestPrice: pc.price,
					cegCount: 1,
					groupPurchaseType: pc.groupPurchaseType,
					photocardsId: pc.photocardsId,
				});
			}
		}

		// Format to match expected structure
		const formattedPhotocards = Array.from(aggregatedMap.values()).map(
			(pc) => ({
				id: pc.id,
				title: pc.photocard,
				titulo: pc.photocard,
				idol: pc.idol,
				group: pc.group,
				grupo: pc.group,
				album: pc.era,
				era: pc.era,
				version: pc.collection,
				colecao: pc.collection,
				price: pc.lowestPrice,
				preco: pc.lowestPrice,
				lowestPrice: pc.lowestPrice,
				highestPrice: pc.highestPrice,
				cegCount: pc.cegCount,
				imageUrl: pc.imageUrl,
				imagem_url: pc.imageUrl,
				available: true,
				saleType:
					pc.groupPurchaseType === "national"
						? "ceg_nacional"
						: "ceg_internacional",
				tipo_venda:
					pc.groupPurchaseType === "national"
						? "ceg_nacional"
						: "ceg_internacional",
			})
		);

		return NextResponse.json(formattedPhotocards);
	} catch (error) {
		console.error("Error fetching photocards:", error);
		return NextResponse.json(
			{ error: "Failed to fetch photocards" },
			{ status: 500 }
		);
	}
}
