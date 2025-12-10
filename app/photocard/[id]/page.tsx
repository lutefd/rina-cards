import { Navbar } from "@/components/navbar";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
	groupPurchasePhotocards,
	groupPurchases,
	photocards,
	user,
} from "@/lib/db/schema";
import { eq, and, or, gt, asc } from "drizzle-orm";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
	Calendar,
	Users,
	Package,
	MapPin,
	Globe,
	AlertCircle,
} from "lucide-react";

export default async function PhotocardDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	// First try to find in the general photocards catalog
	const [catalogPhotocard] = await db
		.select()
		.from(photocards)
		.where(eq(photocards.id, id))
		.limit(1);

	// Also try to find in group purchase photocards
	const [gpPhotocard] = await db
		.select()
		.from(groupPurchasePhotocards)
		.where(eq(groupPurchasePhotocards.id, id))
		.limit(1);

	// Use catalog photocard if found, otherwise use group purchase photocard
	const photocard = catalogPhotocard || gpPhotocard;

	if (!photocard) {
		notFound();
	}

	// Determine the photocard details based on source
	const photocardTitle =
		catalogPhotocard?.title || (gpPhotocard as any)?.photocard;
	const photocardIdol = catalogPhotocard?.idol || gpPhotocard?.idol;
	const photocardGroup = catalogPhotocard?.group || gpPhotocard?.group;
	const photocardEra = catalogPhotocard?.album || gpPhotocard?.era;
	const photocardCollection =
		catalogPhotocard?.version || gpPhotocard?.collection;
	const photocardImageUrl = catalogPhotocard?.imageUrl || gpPhotocard?.imageUrl;

	// Get all CEGs that have this photocard
	// Match by photocardsId (if linked to catalog) OR by title+idol combination
	const cegsWithPhotocard = await db
		.select({
			photocard: groupPurchasePhotocards,
			ceg: groupPurchases,
			sellerName: user.name,
		})
		.from(groupPurchasePhotocards)
		.innerJoin(
			groupPurchases,
			eq(groupPurchasePhotocards.groupPurchaseId, groupPurchases.id)
		)
		.innerJoin(user, eq(groupPurchases.sellerId, user.id))
		.where(
			and(
				or(
					// Match by catalog ID reference
					catalogPhotocard
						? eq(groupPurchasePhotocards.photocardsId, id)
						: undefined,
					// Or match by title + idol
					and(
						eq(groupPurchasePhotocards.photocard, photocardTitle || ""),
						photocardIdol
							? eq(groupPurchasePhotocards.idol, photocardIdol)
							: undefined
					)
				),
				eq(groupPurchasePhotocards.status, "approved"),
				eq(groupPurchases.status, "open"),
				gt(groupPurchasePhotocards.quantity, 0) // Only show CEGs with stock
			)
		)
		.orderBy(asc(groupPurchasePhotocards.price)); // Sort by price, lowest first

	// Calculate price range
	const prices = cegsWithPhotocard.map((c) => c.photocard.price);
	const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
	const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />

			<div className="container mx-auto px-4 py-8">
				<div className="max-w-6xl mx-auto">
					{/* Back button */}
					<div className="mb-6">
						<Button asChild variant="ghost" size="sm">
							<Link href="/marketplace">← Voltar para Busca</Link>
						</Button>
					</div>

					{/* Photocard Header */}
					<div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
						<div className="flex flex-col md:flex-row gap-8">
							{/* Image */}
							<div className="w-full md:w-80 shrink-0">
								<div className="aspect-[3/4] relative bg-gray-100 rounded-lg overflow-hidden">
									<Image
										src={
											photocardImageUrl ||
											`/placeholder.svg?height=400&width=300&query=${photocardIdol} photocard`
										}
										alt={photocardTitle || "Photocard"}
										fill
										className="object-cover"
									/>
								</div>
							</div>

							{/* Details */}
							<div className="flex-1">
								<h1 className="text-3xl font-bold mb-2">{photocardTitle}</h1>
								<p className="text-xl text-muted-foreground mb-4">
									{photocardIdol}
								</p>

								<div className="space-y-3 mb-6">
									{photocardGroup && (
										<div className="flex items-center gap-2">
											<span className="text-sm font-semibold">Grupo:</span>
											<Badge variant="secondary">{photocardGroup}</Badge>
										</div>
									)}
									{photocardEra && (
										<div className="flex items-center gap-2">
											<span className="text-sm font-semibold">Era/Álbum:</span>
											<Badge variant="outline">{photocardEra}</Badge>
										</div>
									)}
									{photocardCollection && (
										<div className="flex items-center gap-2">
											<span className="text-sm font-semibold">Coleção:</span>
											<Badge variant="outline">{photocardCollection}</Badge>
										</div>
									)}
								</div>

								{cegsWithPhotocard.length > 0 ? (
									<div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
										{lowestPrice !== highestPrice ? (
											<>
												<p className="text-sm text-muted-foreground mb-1">
													Faixa de preço
												</p>
												<p className="text-3xl font-bold text-pink-600">
													R$ {lowestPrice.toFixed(2)} - R${" "}
													{highestPrice.toFixed(2)}
												</p>
											</>
										) : (
											<>
												<p className="text-sm text-muted-foreground mb-1">
													Preço
												</p>
												<p className="text-3xl font-bold text-pink-600">
													R$ {lowestPrice.toFixed(2)}
												</p>
											</>
										)}
										<p className="text-sm text-muted-foreground mt-2">
											Disponível em {cegsWithPhotocard.length} CEG
											{cegsWithPhotocard.length > 1 ? "s" : ""}
										</p>
									</div>
								) : (
									<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3">
										<AlertCircle className="w-5 h-5 text-muted-foreground" />
										<p className="text-sm text-muted-foreground">
											Nenhum CEG disponível no momento
										</p>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Available CEGs */}
					<div className="bg-white rounded-lg p-6 shadow-sm">
						<h2 className="text-2xl font-bold mb-6">
							CEGs Disponíveis ({cegsWithPhotocard.length})
						</h2>

						{cegsWithPhotocard.length === 0 ? (
							<div className="text-center py-12">
								<Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
								<p className="text-muted-foreground mb-4">
									Nenhum CEG disponível no momento
								</p>
								<Button asChild variant="outline">
									<Link href="/cegs">Explorar CEGs</Link>
								</Button>
							</div>
						) : (
							<div className="space-y-4">
								{cegsWithPhotocard.map(
									({ photocard: pc, ceg, sellerName }, index) => (
										<div
											key={pc.id}
											className={`border rounded-lg p-4 hover:border-pink-300 hover:shadow-md transition-all ${
												index === 0 ? "border-pink-200 bg-pink-50/30" : ""
											}`}
										>
											{index === 0 && (
												<div className="mb-3">
													<Badge className="bg-pink-600 text-white">
														Menor Preço
													</Badge>
												</div>
											)}
											<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
												<div className="flex-1">
													<h3 className="font-semibold text-lg mb-1">
														{ceg.title}
													</h3>
													<p className="text-sm text-muted-foreground mb-3">
														por {sellerName || "Vendedor"}
													</p>
													<div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
														<div className="flex items-center gap-1">
															{ceg.type === "national" ? (
																<MapPin className="w-4 h-4" />
															) : (
																<Globe className="w-4 h-4" />
															)}
															<span>
																{ceg.type === "national"
																	? "Nacional"
																	: "Internacional"}
															</span>
														</div>
														{ceg.closingDate && (
															<div className="flex items-center gap-1">
																<Calendar className="w-4 h-4" />
																<span>
																	Fecha em{" "}
																	{new Date(ceg.closingDate).toLocaleDateString(
																		"pt-BR"
																	)}
																</span>
															</div>
														)}
														<div className="flex items-center gap-1">
															<Package className="w-4 h-4" />
															<span>{pc.quantity} em estoque</span>
														</div>
													</div>
												</div>

												<div className="flex flex-col items-end gap-3">
													<div className="text-right">
														<p className="text-sm text-muted-foreground">
															Preço
														</p>
														<p className="text-2xl font-bold text-pink-600">
															R$ {pc.price?.toFixed(2) || "0.00"}
														</p>
													</div>
													<Button
														asChild
														className="bg-pink-600 hover:bg-pink-700"
													>
														<Link href={`/cegs/${ceg.id}`}>Ver CEG</Link>
													</Button>
												</div>
											</div>
										</div>
									)
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
