"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2 } from "lucide-react";
import { PhotocardDetailModal } from "@/components/photocard-detail-modal";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import {
	WishlistItem as ApiWishlistItem,
	updateWishlistItem,
	deleteWishlistItem,
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

// E	d WishlistItem to handle both new and legacy fields
interface WishlistItem extends ApiWishlistItem {
	// Legacy fields for backward compatibility
	grupo?: string | null;
	era?: string | null;
	colecao?: string | null;
	imagem_url?: string | null;
	notas?: string | null;
}

interface WishlistListViewProps {
	items: WishlistItem[];
	isOwner: boolean;
	onItemUpdated?: (item: WishlistItem) => void;
	onItemDeleted?: (itemId: string) => void;
}

export function WishlistListView({
	items,
	isOwner,
	onItemUpdated,
	onItemDeleted,
}: WishlistListViewProps) {
	const [currentItems, setCurrentItems] = useState(items);
	const [draggedItem, setDraggedItem] = useState<number | null>(null);
	const [itemToDelete, setItemToDelete] = useState<string | null>(null);
	const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [isDragging, setIsDragging] = useState(false);

	// Sync internal state with props when items change
	useEffect(() => {
		setCurrentItems(items);
	}, [items]);

	const handleItemClick = (item: WishlistItem) => {
		if (!isDragging) {
			setSelectedItem(item);
			setShowDetailModal(true);
		}
	};

	const handleItemUpdated = (updatedItem: WishlistItem) => {
		setCurrentItems(
			currentItems.map((item) =>
				item.id === updatedItem.id ? updatedItem : item
			)
		);
		onItemUpdated?.(updatedItem);
	};

	const handleDeleteItem = async (itemId: string) => {
		try {
			await deleteWishlistItem(itemId);
			setCurrentItems(currentItems.filter((item) => item.id !== itemId));
			// Notify parent component about the deletion
			onItemDeleted?.(itemId);
			toast.success("Item removido com sucesso");
		} catch (error) {
			console.error("Error deleting wishlist item:", error);
			toast.error("Erro ao remover item");
		} finally {
			setItemToDelete(null);
		}
	};

	const handleDragStart = (index: number) => {
		setDraggedItem(index);
		setIsDragging(true);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	const handleDragEnd = () => {
		setTimeout(() => {
			setIsDragging(false);
		}, 100);
	};

	const handleDrop = async (targetIndex: number) => {
		if (draggedItem === null || draggedItem === targetIndex) {
			setDraggedItem(null);
			handleDragEnd();
			return;
		}

		const newItems = [...currentItems];
		const [draggedItemData] = newItems.splice(draggedItem, 1);
		newItems.splice(targetIndex, 0, draggedItemData);

		try {
			for (let i = 0; i < newItems.length; i++) {
				const item = newItems[i];
				await updateWishlistItem(item.id, { priority: i });
			}

			setCurrentItems(newItems);
			toast.success("Posição atualizada com sucesso");
		} catch (error) {
			console.error("Error updating item positions:", error);
			toast.error("Erro ao atualizar posições");
		} finally {
			setDraggedItem(null);
			handleDragEnd();
		}
	};
	const getStatusVariant = (status: string) => {
		switch (status) {
			case "comprado":
				return "default";
			case "otw":
				return "secondary";
			case "prioridade":
				return "destructive";
			default:
				return "outline";
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case "desejado":
				return "Desejado";
			case "comprado":
				return "Comprado";
			case "otw":
				return "A Caminho";
			case "prioridade":
				return "Prioridade";
			default:
				return status;
		}
	};

	return (
		<>
			<div className="bg-white rounded-lg overflow-hidden">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								{isOwner && <TableHead className="w-[40px]"></TableHead>}
								<TableHead className="w-[80px]">Imagem</TableHead>
								<TableHead>Idol</TableHead>
								<TableHead className="hidden sm:table-cell">Grupo</TableHead>
								<TableHead className="hidden md:table-cell">Era</TableHead>
								<TableHead className="hidden lg:table-cell">Coleção</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="hidden xl:table-cell">Notas</TableHead>
								{isOwner && <TableHead className="w-[60px]">Ações</TableHead>}
							</TableRow>
						</TableHeader>
						<TableBody>
							{currentItems.map((item, index) => (
								<TableRow
									key={item.id}
									className={`${
										isOwner ? "cursor-move" : "cursor-pointer"
									} hover:bg-gray-50`}
									draggable={isOwner}
									onDragStart={() => handleDragStart(index)}
									onDragOver={handleDragOver}
									onDrop={() => handleDrop(index)}
									onDragEnd={handleDragEnd}
									onClick={() => handleItemClick(item)}
								>
									{isOwner && (
										<TableCell>
											<GripVertical className="w-4 h-4 text-muted-foreground" />
										</TableCell>
									)}
									<TableCell>
										<div className="w-12 h-16 relative bg-gray-100 rounded overflow-hidden">
											{item.imageUrl || item.imagem_url ? (
												<Image
													src={
														item.imageUrl ||
														item.imagem_url ||
														"/placeholder.svg"
													}
													alt={item.idol || item.photocard || ""}
													fill
													className="object-cover"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
													N/A
												</div>
											)}
										</div>
									</TableCell>
									<TableCell className="font-medium">
										{item.idol || item.photocard}
									</TableCell>
									<TableCell className="hidden sm:table-cell">
										{item.group || item.grupo || "-"}
									</TableCell>
									<TableCell className="hidden md:table-cell">
										{item.album || item.era || "-"}
									</TableCell>
									<TableCell className="hidden lg:table-cell">
										{item.version || item.colecao ? (
											<Badge variant="outline" className="text-xs">
												{item.version || item.colecao}
											</Badge>
										) : (
											"-"
										)}
									</TableCell>
									<TableCell>
										<Badge
											variant={getStatusVariant(item.status) as any}
											className="text-xs"
										>
											{getStatusLabel(item.status)}
										</Badge>
									</TableCell>
									<TableCell className="hidden xl:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
										{item.notes || item.notas || "-"}
									</TableCell>
									{isOwner && (
										<TableCell>
											<Button
												size="sm"
												variant="ghost"
												className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
												onClick={(e) => {
													e.stopPropagation();
													setItemToDelete(item.id);
												}}
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										</TableCell>
									)}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				{currentItems.length === 0 && (
					<div className="text-center py-12">
						<p className="text-muted-foreground">
							Nenhum item na wishlist ainda
						</p>
					</div>
				)}
			</div>

			<AlertDialog
				open={!!itemToDelete}
				onOpenChange={() => setItemToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remover item?</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza que deseja remover este photocard da sua wishlist?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => itemToDelete && handleDeleteItem(itemToDelete)}
							className="bg-red-600 hover:bg-red-700"
						>
							Remover
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<PhotocardDetailModal
				open={showDetailModal}
				onOpenChange={setShowDetailModal}
				item={selectedItem}
				isOwner={isOwner}
				onItemUpdated={handleItemUpdated}
			/>
		</>
	);
}
