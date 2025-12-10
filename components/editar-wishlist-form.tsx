"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { updateWishlist, deleteWishlist } from "@/lib/api-client";
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
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface EditarWishlistFormProps {
	wishlist: {
		id: string;
		title: string;
		description: string | null;
		isPublic: boolean | null;
	};
}

export function EditarWishlistForm({ wishlist }: EditarWishlistFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [title, setTitle] = useState(wishlist.title);
	const [description, setDescription] = useState(wishlist.description || "");
	const [isPublic, setIsPublic] = useState(wishlist.isPublic === true);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			await updateWishlist(wishlist.id, {
				title,
				description: description || null,
				isPublic,
			});

			toast.success("Wishlist atualizada com sucesso");
			router.push(`/wishlist/${wishlist.id}`);
			router.refresh();
		} catch (err) {
			console.error("Error updating wishlist:", err);
			setError("Erro ao atualizar wishlist. Tente novamente.");
			toast.error("Erro ao atualizar wishlist");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		setError(null);

		try {
			await deleteWishlist(wishlist.id);

			toast.success("Wishlist deletada com sucesso");
			router.push("/minhas-wishlists");
			router.refresh();
		} catch (err) {
			console.error("Error deleting wishlist:", err);
			setError("Erro ao deletar wishlist. Tente novamente.");
			toast.error("Erro ao deletar wishlist");
			setIsDeleting(false);
		}
	};

	return (
		<Card>
			<CardContent className="pt-6">
				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<Label htmlFor="title">Nome da Wishlist *</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Ex: Minha Coleção BLACKPINK"
							required
						/>
					</div>

					<div>
						<Label htmlFor="description">Descrição</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Descreva sua wishlist..."
							rows={4}
						/>
					</div>

					<div>
						<Label htmlFor="isPublic">Visibilidade *</Label>
						<Select value={isPublic ? "public" : "private"} onValueChange={(value) => setIsPublic(value === "public")}>
							<SelectTrigger id="isPublic">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="public">
									Pública - Qualquer um pode ver
								</SelectItem>
								<SelectItem value="private">Privada - Apenas você</SelectItem>
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
								Deletar Wishlist
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
								<AlertDialogDescription>
									Esta ação não pode ser desfeita. Isso irá deletar
									permanentemente sua wishlist e todos os itens nela.
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
