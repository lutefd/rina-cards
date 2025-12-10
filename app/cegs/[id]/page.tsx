import { Navbar } from "@/components/navbar";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Globe, MapPin, Clock, ShoppingCart } from "lucide-react";
import { FazerPedidoDialog } from "@/components/fazer-pedido-dialog";
import { SolicitarPhotocardDialog } from "@/components/solicitar-photocard-dialog";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function CEGDetalhesPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	// Get session from Better Auth
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// Fetch data from our API
	const headersList = await headers();
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_BASE_URL}/api/group-purchases/${id}`,
		{
			headers: {
				cookie: headersList.get("cookie") || "",
			},
		}
	);

	if (!response.ok) {
		notFound();
	}

	const data = await response.json();
	const {
		groupPurchase: ceg,
		products: photocards,
		hasOrder: jaPediu,
		isOwner: isVendedor,
	} = data;

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

				{/* Cabeçalho do CEG */}
				<div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
					<div className="flex items-start justify-between mb-4">
						<div className="flex-1">
							<h1 className="text-3xl font-bold mb-2">{ceg.title}</h1>
							{ceg.description && (
								<p className="text-muted-foreground">{ceg.description}</p>
							)}
						</div>
						<Badge
							className={
								ceg.status === "open"
									? "bg-green-100 text-green-700"
									: ceg.status === "closed"
									? "bg-yellow-100 text-yellow-700"
									: "bg-gray-100 text-gray-700"
							}
						>
							{ceg.status === "open" ? "Aberto para Pedidos" : "Fechado"}
						</Badge>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
						<div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
							{ceg.type === "national" ? (
								<MapPin className="w-5 h-5 text-pink-600" />
							) : (
								<Globe className="w-5 h-5 text-pink-600" />
							)}
							<div>
								<p className="text-sm text-muted-foreground">Tipo</p>
								<p className="font-medium">
									{ceg.type === "national"
										? "CEG Nacional"
										: "CEG Internacional"}
								</p>
							</div>
						</div>

						{ceg.marketplaceSource && (
							<div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
								<ShoppingCart className="w-5 h-5 text-pink-600" />
								<div>
									<p className="text-sm text-muted-foreground">Marketplace</p>
									<p className="font-medium">{ceg.marketplaceSource}</p>
								</div>
							</div>
						)}

						{ceg.closingDate && (
							<div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
								<Clock className="w-5 h-5 text-pink-600" />
								<div>
									<p className="text-sm text-muted-foreground">Fecha em</p>
									<p className="font-medium">
										{new Date(ceg.closingDate).toLocaleDateString("pt-BR")}
									</p>
								</div>
							</div>
						)}
					</div>

					<div className="flex items-center gap-2 mb-4">
						<p className="text-sm text-muted-foreground">
							Gerenciado por:{" "}
							<span className="font-medium text-foreground">
								{ceg.sellerName}
							</span>
						</p>
					</div>

					{!session && (
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<p className="text-sm text-blue-800">
								<Link href="/auth/login" className="font-semibold underline">
									Faça login
								</Link>{" "}
								para fazer pedidos neste CEG
							</p>
						</div>
					)}

					{session && !isVendedor && ceg.status === "open" && (
						<div className="space-y-3">
							{jaPediu && (
								<div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
									<div>
										<p className="text-sm text-green-800 font-medium">
											Você já fez pedido(s) neste CEG!
										</p>
										<p className="text-xs text-green-700 mt-1">
											Acompanhe o status em "Meus Pedidos"
										</p>
									</div>
									<Button
										asChild
										variant="outline"
										size="sm"
										className="border-green-300 text-green-700 hover:bg-green-100"
									>
										<Link href="/meus-pedidos">Ver Pedidos</Link>
									</Button>
								</div>
							)}
							<FazerPedidoDialog cegId={id} photocards={photocards || []} />
						</div>
					)}

					{isVendedor && (
						<div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
							<p className="text-sm text-purple-800 font-medium">
								Você é o vendedor deste CEG
							</p>
							<Button asChild className="mt-2 bg-pink-600 hover:bg-pink-700">
								<Link href={`/cegs/${id}/gerenciar`}>Gerenciar Pedidos</Link>
							</Button>
						</div>
					)}
				</div>

				{/* Lista de Photocards Disponíveis */}
				<div className="bg-white rounded-lg p-4 md:p-6 shadow-sm">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
						<div>
							<h2 className="text-xl md:text-2xl font-bold">
								Photocards Disponíveis
							</h2>
							<p className="text-xs md:text-sm text-muted-foreground mt-1">
								{photocards && photocards.length > 0
									? `${photocards.length} photocard${
											photocards.length > 1 ? "s" : ""
									  } disponível${photocards.length > 1 ? "eis" : ""}`
									: "Nenhum photocard disponível"}
							</p>
						</div>
					</div>

					{photocards && photocards.length > 0 ? (
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
							{photocards.map((pc: any) => {
								const isOutOfStock = pc.estoque !== null && pc.estoque <= 0;
								return (
									<div
										key={pc.id}
										className={`border rounded-lg p-2 md:p-3 transition-all group ${
											isOutOfStock
												? "opacity-60 bg-gray-50"
												: "hover:border-pink-300 hover:shadow-md"
										}`}
									>
										<div className="aspect-3/4 bg-gray-100 rounded-lg mb-2 relative overflow-hidden">
											<img
												src={
													pc.imagem_url ||
													`/placeholder.svg?height=300&width=225&query=${pc.idol} photocard`
												}
												alt={pc.titulo}
												className={`w-full h-full object-cover ${
													isOutOfStock ? "grayscale" : "group-hover:scale-105"
												} transition-transform duration-200`}
											/>
											{isOutOfStock && (
												<div className="absolute inset-0 bg-black/40 flex items-center justify-center">
													<span className="bg-gray-800 text-white text-xs px-2 py-1 rounded font-medium">
														Esgotado
													</span>
												</div>
											)}
										</div>
										<h3 className="font-medium text-xs md:text-sm line-clamp-2">
											{pc.titulo}
										</h3>
										<p className="text-xs text-muted-foreground line-clamp-1">
											{pc.idol}
										</p>
										{pc.grupo && (
											<p className="text-xs text-muted-foreground line-clamp-1">
												{pc.grupo}
											</p>
										)}
										<div className="flex items-center justify-between mt-1">
											<p
												className={`text-sm md:text-base font-bold ${
													isOutOfStock ? "text-gray-400" : "text-pink-600"
												}`}
											>
												R$ {pc.preco?.toFixed(2)}
											</p>
											{pc.estoque !== null && pc.estoque > 0 && (
												<span className="text-[10px] text-muted-foreground">
													{pc.estoque} disp.
												</span>
											)}
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<div className="text-center py-12 text-muted-foreground">
							<p className="text-sm md:text-base">
								Nenhum photocard disponível no momento
							</p>
							<p className="text-xs md:text-sm mt-2">
								O vendedor ainda não adicionou photocards a este CEG
							</p>
						</div>
					)}

					{session && !isVendedor && ceg.status === "open" && (
						<div className="mt-6 pt-6 border-t">
							<p className="text-sm text-muted-foreground mb-3">
								Não encontrou o photocard que procura? Solicite ao vendedor!
							</p>
							<SolicitarPhotocardDialog cegId={id} />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
