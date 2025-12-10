"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2 } from "lucide-react";
import {
	createGroupPurchasePhotocard,
	GroupPurchasePhotocard,
	searchPhotocards as apiSearchPhotocards,
} from "@/lib/api-client";
import { toast } from "sonner";

interface AdicionarPhotocardCEGDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	cegId: string;
	onPhotocardAdded: (photocard: any) => void;
}

export function AdicionarPhotocardCEGDialog({
	open,
	onOpenChange,
	cegId,
	onPhotocardAdded,
}: AdicionarPhotocardCEGDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [photocards, setPhotocards] = useState<any[]>([]);
	const [selectedPhotocard, setSelectedPhotocard] = useState<any | null>(null);

	// Campos para criar novo photocard
	const [titulo, setTitulo] = useState("");
	const [idol, setIdol] = useState("");
	const [grupo, setGrupo] = useState("");
	const [era, setEra] = useState("");
	const [colecao, setColecao] = useState("");
	const [imagemUrl, setImagemUrl] = useState("");
	const [preco, setPreco] = useState("");
	const [estoque, setEstoque] = useState("1");
	const [estoqueExistente, setEstoqueExistente] = useState("1");
	const [precoExistente, setPrecoExistente] = useState("");

	// When a photocard is selected, pre-fill the price
	useEffect(() => {
		if (selectedPhotocard) {
			setPrecoExistente(selectedPhotocard.preco?.toString() || "0");
			setEstoqueExistente("1");
		}
	}, [selectedPhotocard]);

	useEffect(() => {
		if (open && searchQuery) {
			searchPhotocards();
		}
	}, [searchQuery, open]);

	const searchPhotocards = async () => {
		if (!searchQuery || searchQuery.length < 2) return;

		try {
			setIsLoading(true);
			const results = await apiSearchPhotocards(searchQuery);
			setPhotocards(results);

			if (results.length === 0) {
				toast.info("Nenhum photocard encontrado com esse termo");
			}
		} catch (error) {
			console.error("Error searching photocards:", error);
			toast.error("Falha ao buscar photocards");
		} finally {
			setIsLoading(false);
		}
	};

	const handleAdicionarExistente = async () => {
		if (!selectedPhotocard) return;

		setIsLoading(true);

		try {
			// Create a new photocard in the group purchase with custom price and stock
			const newPhotocard = await createGroupPurchasePhotocard({
				groupPurchaseId: cegId,
				photocard: selectedPhotocard.titulo,
				idol: selectedPhotocard.idol,
				group: selectedPhotocard.grupo,
				era: selectedPhotocard.era,
				collection: selectedPhotocard.colecao,
				price: precoExistente
					? Number.parseFloat(precoExistente)
					: selectedPhotocard.preco || 0,
				imageUrl: selectedPhotocard.imagem_url,
				quantity: estoqueExistente ? Number.parseInt(estoqueExistente) : 1,
				photocardsId: selectedPhotocard.id,
			});

			// Show success message
			toast.success("Photocard adicionado com sucesso");

			// Call the callback with the new photocard
			onPhotocardAdded(newPhotocard);

			// Close the dialog and reset state
			onOpenChange(false);
			setSelectedPhotocard(null);
			setSearchQuery("");
			setPrecoExistente("");
			setEstoqueExistente("1");
		} catch (error) {
			console.error("Error adding photocard:", error);
			toast.error("Erro ao adicionar photocard");
		} finally {
			setIsLoading(false);
		}
	};

	const handleCriarNovo = async () => {
		if (!titulo || !idol) return;

		setIsLoading(true);

		try {
			// Create a new photocard in the group purchase
			const newPhotocard = await createGroupPurchasePhotocard({
				groupPurchaseId: cegId,
				photocard: titulo,
				idol: idol,
				group: grupo || undefined,
				era: era || undefined,
				collection: colecao || undefined,
				price: preco ? Number.parseFloat(preco) : 0,
				imageUrl: imagemUrl || undefined,
				quantity: estoque ? Number.parseInt(estoque) : 1,
			});

			// Show success message
			toast.success("Photocard criado com sucesso");

			// Call the callback with the new photocard
			onPhotocardAdded(newPhotocard);

			// Close the dialog and reset state
			onOpenChange(false);

			// Clear fields
			setTitulo("");
			setIdol("");
			setGrupo("");
			setEra("");
			setColecao("");
			setImagemUrl("");
			setPreco("");
			setEstoque("1");
		} catch (error) {
			console.error("Error creating photocard:", error);
			toast.error("Erro ao criar photocard");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Adicionar Photocard ao CEG</DialogTitle>
					<DialogDescription>
						Adicione photocards existentes do catálogo ou crie novos
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="existente" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="existente">Do Catálogo</TabsTrigger>
						<TabsTrigger value="novo">Criar Novo</TabsTrigger>
					</TabsList>

					<TabsContent value="existente" className="space-y-4">
						<div>
							<Label htmlFor="search">Buscar Photocard</Label>
							<div className="relative">
								{isLoading ? (
									<Loader2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground animate-spin" />
								) : (
									<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								)}
								<Input
									id="search"
									placeholder="Nome do idol, grupo ou título..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-9"
								/>
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								Digite pelo menos 2 caracteres para buscar
							</p>
						</div>

						{photocards.length > 0 && (
							<div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
								{photocards.map((pc) => (
									<div
										key={pc.id}
										onClick={() => setSelectedPhotocard(pc)}
										className={`border rounded-lg p-2 cursor-pointer transition-all ${
											selectedPhotocard?.id === pc.id
												? "border-pink-500 ring-2 ring-pink-200"
												: "hover:border-pink-300"
										}`}
									>
										<div className="aspect-3/4 bg-gray-100 rounded mb-2 relative overflow-hidden">
											<img
												src={
													pc.imagem_url ||
													`/placeholder.svg?height=200&width=150&query=${pc.idol}`
												}
												alt={pc.titulo}
												className="w-full h-full object-cover"
											/>
										</div>
										<p className="text-xs font-medium line-clamp-1">
											{pc.titulo}
										</p>
										<p className="text-xs text-muted-foreground">{pc.idol}</p>
										<p className="text-xs font-bold text-pink-600">
											R$ {pc.preco?.toFixed(2)}
										</p>
									</div>
								))}
							</div>
						)}

						{searchQuery && photocards.length === 0 && (
							<p className="text-sm text-muted-foreground text-center py-4">
								Nenhum photocard encontrado
							</p>
						)}

						{selectedPhotocard && (
							<div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
								<div className="flex items-center gap-3">
									<div className="w-16 h-20 rounded overflow-hidden bg-gray-200 shrink-0">
										<img
											src={
												selectedPhotocard.imagem_url ||
												`/placeholder.svg?height=80&width=64`
											}
											alt={selectedPhotocard.titulo}
											className="w-full h-full object-cover"
										/>
									</div>
									<div className="flex-1 min-w-0">
										<p className="font-medium text-sm line-clamp-1">
											{selectedPhotocard.titulo}
										</p>
										<p className="text-xs text-muted-foreground">
											{selectedPhotocard.idol}
										</p>
										{selectedPhotocard.grupo && (
											<p className="text-xs text-muted-foreground">
												{selectedPhotocard.grupo}
											</p>
										)}
										<p className="text-xs text-muted-foreground mt-1">
											Preço de referência: R${" "}
											{selectedPhotocard.preco?.toFixed(2) || "0.00"}
										</p>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="precoExistente">
											Preço neste CEG (R$) *
										</Label>
										<Input
											id="precoExistente"
											type="number"
											step="0.01"
											min="0"
											value={precoExistente}
											onChange={(e) => setPrecoExistente(e.target.value)}
											placeholder="0.00"
										/>
									</div>
									<div>
										<Label htmlFor="estoqueExistente">Estoque *</Label>
										<Input
											id="estoqueExistente"
											type="number"
											min="1"
											value={estoqueExistente}
											onChange={(e) => setEstoqueExistente(e.target.value)}
											placeholder="1"
										/>
									</div>
								</div>
								<p className="text-xs text-muted-foreground">
									Defina o preço e quantidade disponível para venda neste CEG
								</p>
							</div>
						)}

						<Button
							onClick={handleAdicionarExistente}
							disabled={!selectedPhotocard || isLoading}
							className="w-full bg-pink-600 hover:bg-pink-700"
						>
							{isLoading ? "Adicionando..." : "Adicionar ao CEG"}
						</Button>
					</TabsContent>

					<TabsContent value="novo" className="space-y-4">
						<div>
							<Label htmlFor="titulo">Título *</Label>
							<Input
								id="titulo"
								value={titulo}
								onChange={(e) => setTitulo(e.target.value)}
								placeholder="Ex: Jisoo Photocard Born Pink"
								required
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="idol">Idol *</Label>
								<Input
									id="idol"
									value={idol}
									onChange={(e) => setIdol(e.target.value)}
									placeholder="Ex: Jisoo"
									required
								/>
							</div>

							<div>
								<Label htmlFor="grupo">Grupo</Label>
								<Input
									id="grupo"
									value={grupo}
									onChange={(e) => setGrupo(e.target.value)}
									placeholder="Ex: BLACKPINK"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="era">Era</Label>
								<Input
									id="era"
									value={era}
									onChange={(e) => setEra(e.target.value)}
									placeholder="Ex: Born Pink"
								/>
							</div>

							<div>
								<Label htmlFor="colecao">Coleção</Label>
								<Input
									id="colecao"
									value={colecao}
									onChange={(e) => setColecao(e.target.value)}
									placeholder="Ex: THE CHASE"
								/>
							</div>
						</div>

						<div>
							<Label htmlFor="imagemUrl">URL da Imagem</Label>
							<Input
								id="imagemUrl"
								value={imagemUrl}
								onChange={(e) => setImagemUrl(e.target.value)}
								placeholder="https://..."
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="preco">Preço (R$)</Label>
								<Input
									id="preco"
									type="number"
									step="0.01"
									value={preco}
									onChange={(e) => setPreco(e.target.value)}
									placeholder="0.00"
								/>
							</div>

							<div>
								<Label htmlFor="estoque">Estoque *</Label>
								<Input
									id="estoque"
									type="number"
									min="1"
									value={estoque}
									onChange={(e) => setEstoque(e.target.value)}
									placeholder="1"
								/>
							</div>
						</div>

						<Button
							onClick={handleCriarNovo}
							disabled={!titulo || !idol || isLoading}
							className="w-full bg-pink-600 hover:bg-pink-700"
						>
							{isLoading ? "Criando..." : "Criar e Adicionar ao CEG"}
						</Button>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
