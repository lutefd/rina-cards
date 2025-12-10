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
			status: orders.status,
			totalAmount: orders.totalAmount,
			createdAt: orders.createdAt,
			updatedAt: orders.updatedAt,
			userName: user.name,
			userEmail: user.email,
		})
		.from(orders)
		.leftJoin(user, eq(orders.userId, user.id))
		.where(eq(orders.groupPurchaseId, id))
		.orderBy(desc(orders.createdAt));

	// Map orders to match the expected Pedido type in the component
	const orderItems = ordersList.map((order) => ({
		id: order.id,
		quantity: 1,
		unitPrice: order.totalAmount,
		totalAmount: order.totalAmount,
		status: order.status,
		contactInfo: {},
		notes: null,
		user: {
			name: order.userName,
			email: order.userEmail,
			phone: null,
		},
		product: {
			name: "Photocard",
			idol: "Idol" as string | null,
			group: "Group" as string | null,
		},
	}));

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
		status: pc.status,
		requesterId: pc.requesterId,
		requestNotes: null, // Placeholder
		requester: pc.requesterId ? {
			name: pc.requesterName,
			email: pc.requesterEmail
		} : undefined
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
							<p className="font-medium">{orderItems?.length || 0}</p>
						</div>
					</div>
				</div>

				<GerenciadorPhotocardsCEG cegId={id} photocards={cegPhotocards || []} />

				<GerenciadorPedidos cegId={id} pedidos={orderItems || []} />
			</div>
		</div>
	);
}
