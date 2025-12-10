import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { groupPurchasePhotocards, groupPurchases } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const status = searchParams.get("status");

		// Get all approved photocards from group purchases that are open
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
				status: groupPurchasePhotocards.status,
				groupPurchaseId: groupPurchasePhotocards.groupPurchaseId,
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
						? eq(groupPurchasePhotocards.available, true)
						: undefined
				)
			)
			.orderBy(desc(groupPurchasePhotocards.createdAt));

		// Format to match expected structure
		const formattedPhotocards = photocards.map((pc) => ({
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
			price: pc.price,
			preco: pc.price,
			imageUrl: pc.imageUrl,
			imagem_url: pc.imageUrl,
			available: pc.available,
			saleType: "ceg_nacional", // Default for now
			tipo_venda: "ceg_nacional",
		}));

		return NextResponse.json(formattedPhotocards);
	} catch (error) {
		console.error("Error fetching photocards:", error);
		return NextResponse.json(
			{ error: "Failed to fetch photocards" },
			{ status: 500 }
		);
	}
}
