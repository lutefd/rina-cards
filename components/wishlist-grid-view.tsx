"use client";

import type React from "react";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, GripVertical } from "lucide-react";
import { PhotocardDetailModal } from "@/components/photocard-detail-modal";
import {
	updateWishlistItem,
	deleteWishlistItem,
	WishlistItem as ApiWishlistItem,
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

// Use the API client's WishlistItem type as our base

// Extended WishlistItem to handle both new and legacy fields
interface WishlistItem extends ApiWishlistItem {
	// Legacy fields for backward compatibility
	grupo?: string | null;
	era?: string | null;
	colecao?: string | null;
	imagem_url?: string | null;
	notas?: string | null;
	posicao?: number;
}

interface WishlistGridViewProps {
	items: WishlistItem[];
	isOwner: boolean;
	onAddClick?: (position: number) => void;
	onItemDeleted?: (itemId: string) => void;
	gridSize?: number;
	wishlistTitle?: string;
}

export function WishlistGridView({ items, isOwner, onAddClick, onItemDeleted, gridSize = 8, wishlistTitle }: WishlistGridViewProps) {
	const exportRef = useRef<HTMLDivElement>(null);
	const [currentItems, setCurrentItems] = useState(items);
	const [draggedItem, setDraggedItem] = useState<number | null>(null);
	const [itemToDelete, setItemToDelete] = useState<string | null>(null);
	const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [isDragging, setIsDragging] = useState(false);

	// Sync internal state with props when items change
	useEffect(() => {
		console.log('WishlistGridView received items update:', items.length, 'items');
		console.log('Item IDs:', items.map(i => i.id));
		setCurrentItems(items);
	}, [items]);

	// Listen for export event
	useEffect(() => {
		const handleExport = async () => {
			if (!exportRef.current) return;

			try {
				// Hide interactive elements during export
				const hideElements = exportRef.current.querySelectorAll('.export-hide');
				hideElements.forEach(el => (el as HTMLElement).style.display = 'none');
				
				// Show export-only elements
				const showElements = exportRef.current.querySelectorAll('.export-show');
				showElements.forEach(el => (el as HTMLElement).style.display = 'block');

				const { toPng } = await import('html-to-image');
				const dataUrl = await toPng(exportRef.current, {
					quality: 1,
					pixelRatio: 2,
					backgroundColor: '#ffffff',
				});

				// Restore elements
				hideElements.forEach(el => (el as HTMLElement).style.display = '');
				showElements.forEach(el => (el as HTMLElement).style.display = 'none');

				const link = document.createElement('a');
				link.download = `${wishlistTitle || 'wishlist'}.png`;
				link.href = dataUrl;
				link.click();
				toast.success('Wishlist exportada com sucesso!');
			} catch (error) {
				console.error('Error exporting wishlist:', error);
				toast.error('Erro ao exportar wishlist');
			}
		};

		window.addEventListener('exportWishlist', handleExport);
		return () => window.removeEventListener('exportWishlist', handleExport);
	}, [wishlistTitle]);

	const handleItemClick = (item: WishlistItem) => {
		// Only open modal if we're not dragging
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
	};
	const totalSlots = gridSize * gridSize;
	const slots = Array.from({ length: totalSlots }, (_, i) => i);

	const getStatusColor = (status: string) => {
		switch (status) {
			case "desejado":
				return "bg-gray-100 border-gray-300";
			case "comprado":
				return "bg-green-50 border-green-300";
			case "otw":
				return "bg-blue-50 border-blue-300";
			case "prioridade":
				return "bg-pink-50 border-pink-300";
			default:
				return "bg-gray-100 border-gray-300";
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case "desejado":
				return "";
			case "comprado":
				return "✓";
			case "otw":
				return "☕"; // Coffee emoji
			case "prioridade":
				return "🌸"; // Flower emoji
			default:
				return "";
		}
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
		// Reset dragging state after a short delay to prevent click from firing
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
			// Update each item's priority
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

	return (
		<div className="bg-white rounded-lg p-6">
			<div ref={exportRef} className="bg-white p-6">
				{/* Title - only visible in export */}
				{wishlistTitle && (
					<div className="mb-4 export-show" style={{ display: 'none' }}>
						<h2 className="text-2xl font-bold text-center">{wishlistTitle}</h2>
					</div>
				)}
				
				{/* Status Legend - always visible */}
				<div className="flex justify-center gap-6 text-sm mb-4">
					<span className="flex items-center gap-1">
						<span>☕</span>
						<span>otw</span>
					</span>
					<span className="flex items-center gap-1">
						<span>🌸</span>
						<span>prio</span>
					</span>
				</div>
				<div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
				{slots.map((slotIndex) => {
					const item = currentItems[slotIndex];

					if (!item) {
						return (
							<div key={slotIndex} className="flex flex-col">
								<div
									className={`aspect-3/4 bg-green-100 rounded border-2 border-dashed border-green-300 flex items-center justify-center transition-all ${
										isOwner ? "cursor-pointer hover:bg-green-200 hover:border-green-400" : ""
									}`}
									onDragOver={handleDragOver}
									onDrop={() => isOwner && handleDrop(slotIndex)}
									onClick={() => isOwner && onAddClick?.(slotIndex)}
								>
									{isOwner && <span className="text-green-400 text-2xl">+</span>}
								</div>
								{/* Empty space for label consistency */}
								<div className="mt-1 text-center">
									<p className="text-[10px] font-semibold uppercase text-transparent">&nbsp;</p>
									<p className="text-[9px] text-transparent">&nbsp;</p>
								</div>
							</div>
						);
					}

					return (
						<div key={item.id} className="flex flex-col">
							<div
								className={`aspect-3/4 rounded border-2 relative overflow-hidden group ${getStatusColor(
									item.status
								)} ${isOwner ? "cursor-move" : "cursor-pointer"}`}
								draggable={isOwner}
								onDragStart={() => handleDragStart(slotIndex)}
								onDragOver={handleDragOver}
								onDrop={() => handleDrop(slotIndex)}
								onDragEnd={handleDragEnd}
								onClick={() => handleItemClick(item)}
							>
							{isOwner && (
								<Button
									size="sm"
									variant="destructive"
									className="export-hide absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
									onClick={(e) => {
										e.stopPropagation();
										setItemToDelete(item.id);
									}}
								>
									<X className="w-3 h-3" />
								</Button>
							)}

							{isOwner && (
								<div className="export-hide absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
									<GripVertical className="w-4 h-4 text-white drop-shadow-lg" />
								</div>
							)}

							{/* Use either new or legacy image URL field */}
							{(item.imageUrl || item.imagem_url) ? (
								<Image
									src={(item.imageUrl || item.imagem_url || "/placeholder.svg")}
									alt={item.idol || ""}
									fill
									className="object-cover"
								/>
							) : (
								<div className="w-full h-full flex flex-col items-center justify-center p-2">
									<span className="text-xs font-medium text-center">
										{item.idol}
									</span>
								</div>
							)}

							{getStatusLabel(item.status) && (
								<div className="absolute bottom-1 right-1 bg-white px-1.5 py-0.5 rounded text-[10px] font-semibold">
									{getStatusLabel(item.status)}
								</div>
							)}

							<div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-white">
								<p className="text-xs font-semibold text-center mb-1">
									{item.idol}
								</p>
								{/* Use either new or legacy group field */}
								{(item.group || item.grupo) && (
									<p className="text-[10px] text-center">{item.group || item.grupo}</p>
								)}
								{/* Use either new or legacy album/era field */}
								{(item.album || item.era) && (
									<p className="text-[10px] text-center text-gray-300">
										{item.album || item.era}
									</p>
								)}
							</div>
						</div>
						{/* Labels below card - collection and era */}
						<div className="mt-1 text-center">
							{(item.version || item.colecao) && (
								<p className="text-[10px] font-semibold uppercase text-gray-700">
									{item.version || item.colecao}
								</p>
							)}
							{(item.album || item.era) && (
								<p className="text-[9px] text-gray-500">
									{item.album || item.era}
								</p>
							)}
						</div>
					</div>
					);
				})}
				</div>
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

			<div className="mt-6 flex gap-4 justify-center text-sm">
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded" />
					<span className="text-muted-foreground">Vazio</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded" />
					<span className="text-muted-foreground">Desejado</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 bg-blue-50 border-2 border-blue-300 rounded" />
					<span className="text-muted-foreground">OTW</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 bg-pink-50 border-2 border-pink-300 rounded" />
					<span className="text-muted-foreground">Prioridade</span>
				</div>
			</div>
		</div>
	);
}
