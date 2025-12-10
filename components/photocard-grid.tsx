"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PhotocardWithPricing {
	id: string;
	title?: string;
	titulo?: string;
	idol?: string | null;
	group?: string | null;
	grupo?: string | null;
	version?: string | null;
	colecao?: string | null;
	price?: number | null;
	preco?: number | null;
	lowestPrice?: number;
	highestPrice?: number;
	cegCount?: number;
	imageUrl?: string | null;
	imagem_url?: string | null;
	saleType?: string | null;
	tipo_venda?: string | null;
}

interface PhotocardGridProps {
	photocards: PhotocardWithPricing[];
}

export function PhotocardGrid({ photocards }: PhotocardGridProps) {
	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<p className="text-sm text-muted-foreground">
					{photocards.length} photocards encontrados
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{photocards.map((pc) => {
					const hasMultiplePrices = pc.lowestPrice !== pc.highestPrice;
					const cegCount = pc.cegCount || 1;

					return (
						<Link
							key={pc.id}
							href={`/photocard/${pc.id}`}
							className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow block"
						>
							<div className="relative aspect-[3/4] bg-gray-100">
								<Image
									src={
										pc.imageUrl ||
										pc.imagem_url ||
										`/placeholder.svg?height=400&width=300&query=${
											pc.idol || pc.title
										} photocard`
									}
									alt={pc.title || pc.titulo || ""}
									fill
									className="object-cover"
								/>
								<button
									className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
									onClick={(e) => e.preventDefault()}
								>
									<Heart className="w-4 h-4 text-gray-600" />
								</button>
								{cegCount > 1 && (
									<div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
										<Store className="w-3 h-3" />
										{cegCount} CEGs
									</div>
								)}
							</div>

							<div className="p-4 space-y-3">
								<div>
									<h3 className="font-semibold text-lg mb-1 line-clamp-1">
										{pc.title || pc.titulo}
									</h3>
									<p className="text-sm text-muted-foreground">
										{pc.idol}{" "}
										{pc.group || pc.grupo ? `• ${pc.group || pc.grupo}` : ""}
									</p>
								</div>

								<div className="flex items-center gap-2 flex-wrap">
									{(pc.version || pc.colecao) && (
										<Badge variant="secondary" className="text-xs">
											{pc.version || pc.colecao}
										</Badge>
									)}
									{(pc.saleType === "ceg_nacional" ||
										pc.tipo_venda === "ceg_nacional") && (
										<Badge
											variant="outline"
											className="text-xs border-blue-200 text-blue-700"
										>
											Nacional
										</Badge>
									)}
									{(pc.saleType === "ceg_internacional" ||
										pc.tipo_venda === "ceg_internacional") && (
										<Badge
											variant="outline"
											className="text-xs border-purple-200 text-purple-700"
										>
											Internacional
										</Badge>
									)}
								</div>

								<div className="flex items-center justify-between pt-2">
									<div>
										{hasMultiplePrices ? (
											<>
												<span className="text-xs text-muted-foreground">
													a partir de
												</span>
												<span className="text-2xl font-bold text-pink-600 block">
													R$ {pc.lowestPrice?.toFixed(2)}
												</span>
											</>
										) : (
											<span className="text-2xl font-bold text-pink-600">
												R${" "}
												{(pc.lowestPrice || pc.price || pc.preco)?.toFixed(2) ||
													"0.00"}
											</span>
										)}
									</div>
									<Button size="sm" className="bg-pink-600 hover:bg-pink-700">
										Ver CEGs
									</Button>
								</div>
							</div>
						</Link>
					);
				})}
			</div>

			{photocards.length === 0 && (
				<div className="text-center py-12">
					<p className="text-muted-foreground">Nenhum photocard encontrado</p>
				</div>
			)}
		</div>
	);
}
