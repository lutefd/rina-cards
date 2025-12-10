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
import { createWishlist } from "@/lib/api-client";
import { toast } from "sonner";

export function NovaWishlistForm() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [isPublic, setIsPublic] = useState(true);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const newWishlist = await createWishlist({
				title,
				description: description || undefined,
				isPublic,
			});

			toast.success("Wishlist criada com sucesso");
			router.push(`/wishlist/${newWishlist.id}`);
		} catch (error) {
			console.error("Error creating wishlist:", error);
			setError("Erro ao criar wishlist. Tente novamente.");
			toast.error("Erro ao criar wishlist");
		} finally {
			setIsLoading(false);
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
							placeholder="Ex: Minha wishlist do BTS"
							required
						/>
					</div>

					<div>
						<Label htmlFor="description">Descrição</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Descreva sua wishlist (opcional)"
							rows={3}
						/>
					</div>

					<div>
						<Label htmlFor="isPublic">Visibilidade</Label>
						<Select value={isPublic ? "public" : "private"} onValueChange={(value) => setIsPublic(value === "public")}>
							<SelectTrigger id="isPublic">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="public">
									Pública - Visível para todos
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
							{isLoading ? "Criando..." : "Criar Wishlist"}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
