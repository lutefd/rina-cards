import { Navbar } from "@/components/navbar";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { groupPurchasePhotocards, groupPurchases } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Users, Package } from "lucide-react";

export default async function PhotocardDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	// Get the photocard details
	const [photocard] = await db
		.select()
		.from(groupPurchasePhotocards)
		.where(eq(groupPurchasePhotocards.id, id))
		.limit(1);

	if (!photocard) {
		notFound();
	}

	// Get all CEGs that have this photocard (matching by title, idol, group)
	const cegsWithPhotocard = await db
		.select({
			photocard: groupPurchasePhotocards,
			ceg: groupPurchases,
		})
		.from(groupPurchasePhotocards)
		.innerJoin(
			groupPurchases,
			eq(groupPurchasePhotocards.groupPurchaseId, groupPurchases.id)
		)
		.where(
			and(
				photocard.photocard ? eq(groupPurchasePhotocards.photocard, photocard.photocard) : undefined,
				photocard.idol ? eq(groupPurchasePhotocards.idol, photocard.idol) : undefined,
				eq(groupPurchasePhotocards.status, "approved"),
				eq(groupPurchases.status, "open")
			)
		);

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />

			<div className="container mx-auto px-4 py-8">
				<div className="max-w-6xl mx-auto">
					{/* Photocard Header */}
					<div className="bg-white rounded-lg p-6 mb-8">
						<div className="flex flex-col md:flex-row gap-8">
							{/* Image */}
							<div className="w-full md:w-80 shrink-0">
								<div className="aspect-3/4 relative bg-gray-100 rounded-lg overflow-hidden">
									<Image
										src={
											photocard.imageUrl ||
											`/placeholder.svg?height=400&width=300&query=${photocard.idol} photocard`
										}
										alt={photocard.photocard}
										fill
										className="object-cover"
									/>
								</div>
							</div>

							{/* Details */}
							<div className="flex-1">
								<h1 className="text-3xl font-bold mb-2">{photocard.photocard}</h1>
								<p className="text-xl text-muted-foreground mb-4">
									{photocard.idol}
								</p>

								<div className="space-y-3 mb-6">
									{photocard.group && (
										<div className="flex items-center gap-2">
											<span className="text-sm font-semibold">Grupo:</span>
											<Badge variant="secondary">{photocard.group}</Badge>
										</div>
									)}
									{photocard.era && (
										<div className="flex items-center gap-2">
											<span className="text-sm font-semibold">Era:</span>
											<Badge variant="outline">{photocard.era}</Badge>
										</div>
									)}
									{photocard.collection && (
										<div className="flex items-center gap-2">
											<span className="text-sm font-semibold">Coleção:</span>
											<Badge variant="outline">{photocard.collection}</Badge>
										</div>
									)}
								</div>

								<div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
									<p className="text-sm text-muted-foreground mb-1">
										Preço médio
									</p>
									<p className="text-3xl font-bold text-pink-600">
										R$ {photocard.price?.toFixed(2) || "0.00"}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Available CEGs */}
					<div className="bg-white rounded-lg p-6">
						<h2 className="text-2xl font-bold mb-6">
							CEGs Disponíveis ({cegsWithPhotocard.length})
						</h2>

						{cegsWithPhotocard.length === 0 ? (
							<div className="text-center py-12">
								<Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
								<p className="text-muted-foreground">
									Nenhum CEG disponível no momento
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{cegsWithPhotocard.map(({ photocard: pc, ceg }) => (
									<div
										key={pc.id}
										className="border rounded-lg p-4 hover:border-pink-300 hover:shadow-md transition-all"
									>
										<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
											<div className="flex-1">
												<h3 className="font-semibold text-lg mb-2">
													{ceg.title}
												</h3>
												<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
													<div className="flex items-center gap-1">
														<Calendar className="w-4 h-4" />
														<span>
															Fecha em:{" "}
															{ceg.closingDate ? new Date(ceg.closingDate).toLocaleDateString(
																"pt-BR"
															) : "N/A"}
														</span>
													</div>
													<div className="flex items-center gap-1">
														<Users className="w-4 h-4" />
														<span>CEG Aberto</span>
													</div>
												</div>
												<div className="mt-2">
													<Badge
														variant={
															ceg.type === "national" ? "default" : "secondary"
														}
													>
														{ceg.type === "national"
															? "CEG Nacional"
															: "CEG Internacional"}
													</Badge>
												</div>
											</div>

											<div className="flex flex-col items-end gap-2">
												<div className="text-right">
													<p className="text-sm text-muted-foreground">
														Preço neste CEG
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
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
