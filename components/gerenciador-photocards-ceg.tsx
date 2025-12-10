"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Check, X, AlertCircle } from "lucide-react";
import { AdicionarPhotocardCEGDialog } from "@/components/adicionar-photocard-ceg-dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	updateGroupPurchasePhotocard,
	deleteGroupPurchasePhotocard,
	GroupPurchasePhotocard,
} from "@/lib/api-client";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Photocard {
	id: string;
	photocard: string;
	idol: string | null;
	group: string | null;
	era: string | null;
	collection: string | null;
	imageUrl: string | null;
	price: number | null;
	status: string;
	requesterId: string | null;
	requestNotes: string | null;
	requester?: {
		name: string | null;
		email: string | null;
	};
}

interface GerenciadorPhotocardsCEGProps {
	cegId: string;
	photocards: Photocard[];
}

export function GerenciadorPhotocardsCEG({
	cegId,
	photocards,
}: GerenciadorPhotocardsCEGProps) {
	const [currentPhotocards, setCurrentPhotocards] = useState(photocards);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<string | null>(null);

	const disponiveisAprovados = currentPhotocards.filter(
		(p) => p.status === "available" || p.status === "approved"
	);
	const solicitacoes = currentPhotocards.filter((p) => p.status === "pending");

	const handleAprovar = async (photocardId: string) => {
		try {
			// Call the API to update the photocard status
			await updateGroupPurchasePhotocard(photocardId, { status: "approved" });

			// Update the local state
			setCurrentPhotocards(
				currentPhotocards.map((p) =>
					p.id === photocardId ? { ...p, status: "approved" } : p
				)
			);

			// Show success message
			toast.success("Photocard aprovado com sucesso");
		} catch (error) {
			console.error("Error approving photocard:", error);
			toast.error("Erro ao aprovar photocard");
		}
	};

	const handleRejeitar = async (photocardId: string) => {
		try {
			// Call the API to update the photocard status
			await updateGroupPurchasePhotocard(photocardId, { status: "rejected" });

			// Update the local state
			setCurrentPhotocards(
				currentPhotocards.filter((p) => p.id !== photocardId)
			);

			// Show success message
			toast.success("Photocard rejeitado com sucesso");
		} catch (error) {
			console.error("Error rejecting photocard:", error);
			toast.error("Erro ao rejeitar photocard");
		}
	};

	const handleDelete = async () => {
		if (!itemToDelete) return;

		try {
			// Call the API to delete the photocard
			await deleteGroupPurchasePhotocard(itemToDelete);

			// Update the local state
			setCurrentPhotocards(
				currentPhotocards.filter((p) => p.id !== itemToDelete)
			);

			// Show success message
			toast.success("Photocard removido com sucesso");
		} catch (error) {
			console.error("Error deleting photocard:", error);
			toast.error("Erro ao remover photocard");
		}

		setItemToDelete(null);
	};

	const handlePhotocardAdded = (newPhotocard: Photocard) => {
		setCurrentPhotocards([...currentPhotocards, newPhotocard]);
	};

	return (
		<div className="space-y-6 mb-6">
			{/* Photocards Disponíveis */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Photocards Disponíveis no CEG</CardTitle>
							<p className="text-sm text-muted-foreground mt-1">
								Photocards que os compradores podem encomendar através deste CEG
							</p>
						</div>
						<Button
							onClick={() => setShowAddDialog(true)}
							className="bg-pink-600 hover:bg-pink-700"
						>
							<Plus className="w-4 h-4 mr-2" />
							Adicionar Photocard
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{disponiveisAprovados.length > 0 ? (
						<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
							{disponiveisAprovados.map((photocard) => (
								<div
									key={photocard.id}
									className="border rounded-lg p-3 relative group"
								>
									<div className="aspect-3/4 bg-gray-100 rounded-lg mb-2 relative overflow-hidden">
										<img
											src={
												photocard.imageUrl ||
												`/placeholder.svg?height=300&width=225&query=${photocard.idol}`
											}
											alt={photocard.photocard}
											className="w-full h-full object-cover"
										/>
										<Button
											size="sm"
											variant="destructive"
											className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
											onClick={() => setItemToDelete(photocard.id)}
										>
											<X className="w-4 h-4" />
										</Button>
									</div>
									<h4 className="font-medium text-sm line-clamp-1">
										{photocard.photocard}
									</h4>
									<p className="text-xs text-muted-foreground">
										{photocard.idol || ""}
									</p>
									{photocard.price && (
										<p className="text-sm font-bold text-pink-600 mt-1">
											R$ {photocard.price.toFixed(2)}
										</p>
									)}
									{photocard.status === "approved" && (
										<Badge className="mt-2 bg-green-100 text-green-700 text-xs">
											<Check className="w-3 h-3 mr-1" />
											Solicitação Aprovada
										</Badge>
									)}
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8 text-muted-foreground">
							<p>Nenhum photocard adicionado ainda</p>
							<p className="text-sm mt-1">
								Adicione photocards para que os compradores possam fazer pedidos
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Solicitações Pendentes */}
			{solicitacoes.length > 0 && (
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<AlertCircle className="w-5 h-5 text-orange-500" />
							<CardTitle>Solicitações de Photocards</CardTitle>
							<Badge className="bg-orange-100 text-orange-700">
								{solicitacoes.length}
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground mt-1">
							Compradores solicitaram estes photocards. Aprove ou rejeite
							conforme disponibilidade.
						</p>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Photocard</TableHead>
									<TableHead>Solicitado por</TableHead>
									<TableHead>Notas</TableHead>
									<TableHead>Preço Sugerido</TableHead>
									<TableHead className="text-right">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{solicitacoes.map((photocard) => (
									<TableRow key={photocard.id}>
										<TableCell>
											<div>
												<p className="font-medium">{photocard.photocard}</p>
												<p className="text-sm text-muted-foreground">
													{photocard.idol || ""}
													{photocard.group && ` - ${photocard.group}`}
												</p>
											</div>
										</TableCell>
										<TableCell>
											<div>
												<p className="font-medium">
													{photocard.requester?.name}
												</p>
												<p className="text-sm text-muted-foreground">
													{photocard.requester?.email}
												</p>
											</div>
										</TableCell>
										<TableCell>
											<p className="text-sm">{photocard.requestNotes || "-"}</p>
										</TableCell>
										<TableCell>
											<p className="font-medium">
												{photocard.price
													? `R$ ${photocard.price.toFixed(2)}`
													: "-"}
											</p>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex gap-2 justify-end">
												<Button
													size="sm"
													onClick={() => handleAprovar(photocard.id)}
													className="bg-green-600 hover:bg-green-700"
												>
													<Check className="w-4 h-4 mr-1" />
													Aprovar
												</Button>
												<Button
													size="sm"
													variant="destructive"
													onClick={() => handleRejeitar(photocard.id)}
												>
													<X className="w-4 h-4 mr-1" />
													Rejeitar
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}

			<AdicionarPhotocardCEGDialog
				open={showAddDialog}
				onOpenChange={setShowAddDialog}
				cegId={cegId}
				onPhotocardAdded={handlePhotocardAdded}
			/>

			<AlertDialog
				open={!!itemToDelete}
				onOpenChange={() => setItemToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remover photocard?</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza que deseja remover este photocard do CEG? Ele não
							estará mais disponível para pedidos.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-red-600 hover:bg-red-700"
						>
							Remover
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
