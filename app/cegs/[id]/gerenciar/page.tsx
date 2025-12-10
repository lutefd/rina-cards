import { Navbar } from "@/components/navbar";
import { redirect, notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GerenciadorPedidos } from "@/components/gerenciador-pedidos";
import { GerenciadorPhotocardsCEG } from "@/components/gerenciador-photocards-ceg";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
	groupPurchases,
	orders,
	orderItems,
	user,
	groupPurchasePhotocards,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function GerenciarCEGPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/auth/login");
	}

	// Get the group purchase
	const [ceg] = await db
		.select()
		.from(groupPurchases)
		.where(eq(groupPurchases.id, id))
		.limit(1);

	if (!ceg) {
		notFound();
	}

	// Verify if the user is the seller of the group purchase
	if (ceg.sellerId !== session.user.id) {
		redirect("/cegs");
	}

	// Fetch orders for this group purchase
	const ordersList = await db
		.select({
			id: orders.id,
			userId: orders.userId,
			groupPurchaseId: orders.groupPurchaseId,
			productId: orders.productId,
			quantity: orders.quantity,
			unitPrice: orders.unitPrice,
			status: orders.status,
			totalAmount: orders.totalAmount,
			contactInfo: orders.contactInfo,
			notes: orders.notes,
			createdAt: orders.createdAt,
			updatedAt: orders.updatedAt,
			userName: user.name,
			userEmail: user.email,
		})
		.from(orders)
		.leftJoin(user, eq(orders.userId, user.id))
		.where(eq(orders.groupPurchaseId, id))
		.orderBy(desc(orders.createdAt));

	// For each order, get photocard details (first item only for table display)
	const ordersWithProducts = await Promise.all(
		ordersList.map(async (order) => {
			let photocardName: string | null = null;
			let photocardIdol: string | null = null;
			let photocardGroup: string | null = null;
			let itemCount = 0;

			// If order has direct productId, get photocard from there
			if (order.productId) {
				const [photocard] = await db
					.select({
						photocard: groupPurchasePhotocards.photocard,
						idol: groupPurchasePhotocards.idol,
						group: groupPurchasePhotocards.group,
					})
					.from(groupPurchasePhotocards)
					.where(eq(groupPurchasePhotocards.id, order.productId))
					.limit(1);

				if (photocard) {
					photocardName = photocard.photocard;
					photocardIdol = photocard.idol;
					photocardGroup = photocard.group;
				}
				itemCount = 1;
			} else {
				// Get first item and count from orderItems
				const firstItem = await db
					.select({
						photocard: groupPurchasePhotocards.photocard,
						idol: groupPurchasePhotocards.idol,
						group: groupPurchasePhotocards.group,
					})
					.from(orderItems)
					.leftJoin(
						groupPurchasePhotocards,
						eq(orderItems.productId, groupPurchasePhotocards.id)
					)
					.where(eq(orderItems.orderId, order.id))
					.limit(1);

				if (firstItem.length > 0 && firstItem[0].photocard) {
					photocardName = firstItem[0].photocard;
					photocardIdol = firstItem[0].idol;
					photocardGroup = firstItem[0].group;
				}

				// Get total item count
				const countResult = await db
					.select({ count: orderItems.id })
					.from(orderItems)
					.where(eq(orderItems.orderId, order.id));
				itemCount = countResult.length;
			}

			return {
				...order,
				photocardName,
				photocardIdol,
				photocardGroup,
				itemCount,
			};
		})
	);

	// Map orders to match the expected Pedido type in the component
	const mappedOrders = ordersWithProducts.map(
		(order: (typeof ordersWithProducts)[number]) => {
			const contactInfo = order.contactInfo as Record<string, any> | null;
			return {
				id: order.id,
				quantity: order.quantity,
				unitPrice: order.unitPrice,
				totalAmount: order.totalAmount,
				status: order.status,
				contactInfo: contactInfo,
				notes: order.notes,
				user: {
					name: order.userName,
					email: order.userEmail,
					phone: contactInfo?.telefone || null,
				},
				product: {
					name: order.photocardName || "Photocard",
					idol: order.photocardIdol,
					group: order.photocardGroup,
				},
				itemCount: order.itemCount,
			};
		}
	);

	// Fetch photocards for this group purchase
	const photocardsData = await db
		.select({
			id: groupPurchasePhotocards.id,
			groupPurchaseId: groupPurchasePhotocards.groupPurchaseId,
			photocard: groupPurchasePhotocards.photocard,
			idol: groupPurchasePhotocards.idol,
			group: groupPurchasePhotocards.group,
			imageUrl: groupPurchasePhotocards.imageUrl,
			price: groupPurchasePhotocards.price,
			quantity: groupPurchasePhotocards.quantity,
			status: groupPurchasePhotocards.status,
			requesterId: groupPurchasePhotocards.requesterId,
			requesterName: user.name,
			requesterEmail: user.email,
		})
		.from(groupPurchasePhotocards)
		.leftJoin(user, eq(groupPurchasePhotocards.requesterId, user.id))
		.where(eq(groupPurchasePhotocards.groupPurchaseId, id))
		.orderBy(desc(groupPurchasePhotocards.createdAt));

	// Format photocards to match the expected structure in the component
	const cegPhotocards = photocardsData.map((pc) => ({
		id: pc.id,
		photocard: pc.photocard,
		idol: pc.idol,
		group: pc.group,
		era: null, // Placeholder
		collection: null, // Placeholder
		imageUrl: pc.imageUrl,
		price: pc.price,
		quantity: pc.quantity,
		status: pc.status,
		requesterId: pc.requesterId,
		requestNotes: null, // Placeholder
		requester: pc.requesterId
			? {
					name: pc.requesterName,
					email: pc.requesterEmail,
			  }
			: undefined,
	}));

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />

			<div className="container mx-auto px-4 py-8">
				<div className="mb-6">
					<Button asChild variant="ghost" size="sm">
						<Link href="/cegs">
							<ArrowLeft className="w-4 h-4 mr-2" />
							Voltar para CEGs
						</Link>
					</Button>
				</div>

				<div className="bg-white rounded-lg p-6 mb-6">
					<div className="flex items-start justify-between mb-4">
						<div className="flex-1">
							<h1 className="text-3xl font-bold mb-2">{ceg.title}</h1>
							{ceg.description && (
								<p className="text-muted-foreground">{ceg.description}</p>
							)}
						</div>
						<div className="flex gap-2">
							<Badge
								className={
									ceg.status === "open"
										? "bg-green-100 text-green-700"
										: ceg.status === "closed"
										? "bg-yellow-100 text-yellow-700"
										: ceg.status === "processing"
										? "bg-blue-100 text-blue-700"
										: ceg.status === "finished"
										? "bg-gray-100 text-gray-700"
										: "bg-red-100 text-red-700"
								}
							>
								{ceg.status === "open"
									? "Aberto"
									: ceg.status === "closed"
									? "Fechado"
									: ceg.status === "processing"
									? "Processando"
									: ceg.status === "finished"
									? "Finalizado"
									: "Cancelado"}
							</Badge>
							<Button asChild size="sm" variant="outline">
								<Link href={`/cegs/${id}/editar`}>
									<Edit className="w-4 h-4 mr-2" />
									Editar
								</Link>
							</Button>
						</div>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div>
							<p className="text-sm text-muted-foreground">Tipo</p>
							<p className="font-medium">
								{ceg.type === "national" ? "Nacional" : "Internacional"}
							</p>
						</div>
						{ceg.marketplaceSource && (
							<div>
								<p className="text-sm text-muted-foreground">Marketplace</p>
								<p className="font-medium">{ceg.marketplaceSource}</p>
							</div>
						)}
						{ceg.closingDate && (
							<div>
								<p className="text-sm text-muted-foreground">
									Data de Fechamento
								</p>
								<p className="font-medium">
									{new Date(ceg.closingDate).toLocaleDateString("pt-BR")}
								</p>
							</div>
						)}
						<div>
							<p className="text-sm text-muted-foreground">Total de Pedidos</p>
							<p className="font-medium">{mappedOrders?.length || 0}</p>
						</div>
					</div>
				</div>

				<GerenciadorPhotocardsCEG cegId={id} photocards={cegPhotocards || []} />

				<GerenciadorPedidos cegId={id} pedidos={mappedOrders || []} />
			</div>
		</div>
	);
}
