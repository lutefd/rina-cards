"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	updateGroupPurchase,
	deleteGroupPurchase,
	GroupPurchase,
} from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

// Legacy interface for backward compatibility
interface LegacyCEG {
	id: string;
	titulo: string;
	descricao: string | null;
	tipo: string;
	marketplace_origem: string | null;
	data_fechamento: string | null;
	taxa_adicional: number;
	informacoes_envio: string | null;
	status: string;
	vendedor_id?: string;
}

interface EditarCEGFormProps {
	ceg: LegacyCEG | GroupPurchase;
}

// Helper function to determine if the object is a legacy CEG
function isLegacyCEG(obj: any): obj is LegacyCEG {
	return "titulo" in obj && "tipo" in obj;
}

export function EditarCEGForm({ ceg }: EditarCEGFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const convertTypeToPortuguese = (type: string) => {
		const typeMap: Record<string, string> = {
			national: "nacional",
			international: "internacional",
			nacional: "nacional",
			internacional: "internacional",
		};
		return typeMap[type] || type;
	};

	const convertStatusToPortuguese = (status: string) => {
		const statusMap: Record<string, string> = {
			open: "aberto",
			closed: "fechado",
			finished: "finalizado",
			canceled: "cancelado",
			aberto: "aberto",
			fechado: "fechado",
			finalizado: "finalizado",
			cancelado: "cancelado",
		};
		return statusMap[status] || status;
	};

	// Initialize state based on the type of object we received
	const [titulo, setTitulo] = useState(
		isLegacyCEG(ceg) ? ceg.titulo : ceg.title
	);
	const [descricao, setDescricao] = useState(
		isLegacyCEG(ceg) ? ceg.descricao || "" : ceg.description || ""
	);
	const [tipo, setTipo] = useState(
		convertTypeToPortuguese(isLegacyCEG(ceg) ? ceg.tipo : ceg.type)
	);
	const [marketplaceOrigem, setMarketplaceOrigem] = useState(
		isLegacyCEG(ceg)
			? ceg.marketplace_origem || ""
			: ceg.marketplaceSource || ""
	);
	const [dataFechamento, setDataFechamento] = useState(
		isLegacyCEG(ceg)
			? ceg.data_fechamento
				? ceg.data_fechamento.split("T")[0]
				: ""
			: ceg.closingDate
			? new Date(ceg.closingDate).toISOString().split("T")[0]
			: ""
	);
	const [taxaAdicional, setTaxaAdicional] = useState(
		isLegacyCEG(ceg)
			? ceg.taxa_adicional.toString()
			: (ceg.additionalFee || 0).toString()
	);
	const [informacoesEnvio, setInformacoesEnvio] = useState(
		isLegacyCEG(ceg) ? ceg.informacoes_envio || "" : ceg.shippingInfo || ""
	);
	const [status, setStatus] = useState(convertStatusToPortuguese(ceg.status));

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			await updateGroupPurchase(ceg.id, {
				title: titulo,
				description: descricao || null,
				type: tipo,
				marketplaceSource: marketplaceOrigem || null,
				closingDate: dataFechamento || null,
				additionalFee: Number.parseFloat(taxaAdicional) || 0,
				shippingInfo: informacoesEnvio || null,
				status,
			});

			router.push(`/cegs/${ceg.id}/gerenciar`);
			router.refresh();
		} catch (error) {
			console.error("Error updating group purchase:", error);
			setError("Erro ao atualizar CEG. Tente novamente.");
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		setError(null);

		try {
			await deleteGroupPurchase(ceg.id);
			router.push("/cegs");
			router.refresh();
		} catch (error) {
			console.error("Error deleting group purchase:", error);
			setError("Erro ao deletar CEG. Tente novamente.");
			setIsDeleting(false);
		}
	};

	return (
		<Card>
			<CardContent className="pt-6">
				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<Label htmlFor="titulo">Título do CEG *</Label>
						<Input
							id="titulo"
							value={titulo}
							onChange={(e) => setTitulo(e.target.value)}
							placeholder="Ex: CEG BLACKPINK Born Pink - Dezembro 2024"
							required
						/>
					</div>

					<div>
						<Label htmlFor="descricao">Descrição</Label>
						<Textarea
							id="descricao"
							value={descricao}
							onChange={(e) => setDescricao(e.target.value)}
							placeholder="Detalhes sobre o CEG, photocards disponíveis, etc."
							rows={4}
						/>
					</div>

					<div>
						<Label htmlFor="tipo">Tipo de CEG *</Label>
						<Select value={tipo} onValueChange={setTipo}>
							<SelectTrigger id="tipo">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="nacional">Nacional</SelectItem>
								<SelectItem value="internacional">Internacional</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label htmlFor="marketplace">Marketplace de Origem</Label>
						<Input
							id="marketplace"
							value={marketplaceOrigem}
							onChange={(e) => setMarketplaceOrigem(e.target.value)}
							placeholder="Ex: Mercado Livre, Shopee, AliExpress"
						/>
					</div>

					<div>
						<Label htmlFor="data-fechamento">Data de Fechamento</Label>
						<Input
							id="data-fechamento"
							type="date"
							value={dataFechamento}
							onChange={(e) => setDataFechamento(e.target.value)}
						/>
					</div>

					<div>
						<Label htmlFor="taxa">Taxa Adicional (R$)</Label>
						<Input
							id="taxa"
							type="number"
							step="0.01"
							value={taxaAdicional}
							onChange={(e) => setTaxaAdicional(e.target.value)}
							placeholder="0.00"
						/>
					</div>

					<div>
						<Label htmlFor="envio">Informações de Envio</Label>
						<Textarea
							id="envio"
							value={informacoesEnvio}
							onChange={(e) => setInformacoesEnvio(e.target.value)}
							placeholder="Como será feita a entrega, locais de encontro, etc."
							rows={3}
						/>
					</div>

					<div>
						<Label htmlFor="status">Status do CEG *</Label>
						<Select value={status} onValueChange={setStatus}>
							<SelectTrigger id="status">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="aberto">Aberto</SelectItem>
								<SelectItem value="fechado">Fechado</SelectItem>
								<SelectItem value="finalizado">Finalizado</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{error && <p className="text-sm text-red-500">{error}</p>}

					<div className="flex gap-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
							className="flex-1"
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							disabled={isLoading}
							className="flex-1 bg-pink-600 hover:bg-pink-700"
						>
							{isLoading ? "Salvando..." : "Salvar Alterações"}
						</Button>
					</div>
				</form>

				<div className="mt-8 pt-6 border-t">
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant="destructive"
								className="w-full"
								disabled={isDeleting}
							>
								<Trash2 className="w-4 h-4 mr-2" />
								Deletar CEG
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
								<AlertDialogDescription>
									Esta ação não pode ser desfeita. Isso irá deletar
									permanentemente este CEG e todos os pedidos associados.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancelar</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDelete}
									className="bg-red-600 hover:bg-red-700"
								>
									Deletar
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</CardContent>
		</Card>
	);
}
