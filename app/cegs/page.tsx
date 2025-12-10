import { Navbar } from "@/components/navbar";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { CEGCard } from "@/components/ceg-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { groupPurchases, user } from "@/lib/db/schema";

export default async function CEGsPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/auth/login");
	}

	// Get user profile
	const [userProfile] = await db
		.select()
		.from(user)
		.where(eq(user.id, session.user.id))
		.limit(1);

	if (!userProfile) {
		redirect("/auth/login");
	}

	// Map user types from the old system to the new one
	const isVendedorCEG =
		userProfile.userType === "seller" ||
		userProfile.userType === "admin" ||
		userProfile.userType === "vendedor_ceg";

	// Get seller's group purchases
	const meusCEGs = isVendedorCEG
		? await db
				.select()
				.from(groupPurchases)
				.where(eq(groupPurchases.sellerId, session.user.id))
				.orderBy(groupPurchases.createdAt)
		: null;

	// Get open group purchases
	const cegsAbertos = await db
		.select({
			id: groupPurchases.id,
			title: groupPurchases.title,
			description: groupPurchases.description,
			type: groupPurchases.type,
			marketplaceSource: groupPurchases.marketplaceSource,
			closingDate: groupPurchases.closingDate,
			status: groupPurchases.status,
			sellerName: user.name,
		})
		.from(groupPurchases)
		.innerJoin(user, eq(groupPurchases.sellerId, user.id))
		.where(eq(groupPurchases.status, "open"))
		.orderBy(groupPurchases.createdAt);

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />

			<div className="container mx-auto px-4 py-8">
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold mb-2">CEGs - Compras em Grupo</h1>
						<p className="text-muted-foreground">
							Gerencie e participe de compras em grupo de photocards
						</p>
					</div>
					{isVendedorCEG && (
						<Button asChild className="bg-pink-600 hover:bg-pink-700">
							<Link href="/cegs/novo">
								<Plus className="w-4 h-4 mr-2" />
								Novo CEG
							</Link>
						</Button>
					)}
				</div>

				<Tabs defaultValue={isVendedorCEG ? "meus-cegs" : "participar"}>
					<TabsList>
						{isVendedorCEG && (
							<TabsTrigger value="meus-cegs">Meus CEGs</TabsTrigger>
						)}
						<TabsTrigger value="participar">CEGs Disponíveis</TabsTrigger>
						<TabsTrigger value="meus-pedidos">Meus Pedidos</TabsTrigger>
					</TabsList>

					{isVendedorCEG && (
						<TabsContent value="meus-cegs">
							{meusCEGs && meusCEGs.length > 0 ? (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									{meusCEGs.map((ceg: any) => (
										<CEGCard key={ceg.id} ceg={ceg} isOwner={true} />
									))}
								</div>
							) : (
								<div className="text-center py-12 bg-white rounded-lg">
									<p className="text-muted-foreground mb-4">
										Você ainda não criou nenhum CEG
									</p>
									<Button asChild className="bg-pink-600 hover:bg-pink-700">
										<Link href="/cegs/novo">Criar Primeiro CEG</Link>
									</Button>
								</div>
							)}
						</TabsContent>
					)}

					<TabsContent value="participar">
						{cegsAbertos && cegsAbertos.length > 0 ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{cegsAbertos.map((ceg: any) => (
									<CEGCard key={ceg.id} ceg={ceg} isOwner={false} />
								))}
							</div>
						) : (
							<div className="text-center py-12 bg-white rounded-lg">
								<p className="text-muted-foreground">
									Nenhum CEG aberto no momento
								</p>
							</div>
						)}
					</TabsContent>

					<TabsContent value="meus-pedidos">
						<div className="bg-white rounded-lg p-6">
							<p className="text-muted-foreground">
								Seus pedidos em CEGs aparecerão aqui
							</p>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
