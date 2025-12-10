"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Grid3x3, List, Download } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { WishlistGridView } from "@/components/wishlist-grid-view";
import { WishlistListView } from "@/components/wishlist-list-view";
import { AddItemDialog } from "@/components/add-item-dialog";
import { WishlistItem as ApiWishlistItem } from "@/lib/api-client";

type WishlistItem = ApiWishlistItem;

interface WishlistBuilderProps {
	wishlistId: string;
	items: WishlistItem[];
	isOwner: boolean;
	wishlistTitle?: string;
}

export function WishlistBuilder({
	wishlistId,
	items,
	isOwner,
	wishlistTitle,
}: WishlistBuilderProps) {
	const [view, setView] = useState<"grid" | "list">("grid");
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [addPosition, setAddPosition] = useState<number>(items.length);
	const [currentItems, setCurrentItems] = useState(items);
	const [gridSize, setGridSize] = useState(8);
	const addingItemRef = useRef(false);

	const minGridSize = Math.ceil(Math.sqrt(currentItems.length));

	const handleItemAdded = (newItem: WishlistItem) => {
		// Prevent concurrent additions
		if (addingItemRef.current) {
			console.warn('Already adding an item, skipping duplicate call');
			return;
		}
		
		// Check if item already exists (prevent duplicates)
		if (currentItems.some(item => item.id === newItem.id)) {
			console.warn('Item already exists in wishlist, skipping duplicate', newItem.id);
			return;
		}
		
		addingItemRef.current = true;
		console.log('Adding new item:', newItem.id, 'Current count:', currentItems.length);
		
		// Add the new item and sort by priority to maintain correct order
		const newItems = [...currentItems, newItem];
		newItems.sort((a, b) => (a.priority || 0) - (b.priority || 0));
		
		console.log('After adding, new count:', newItems.length);
		setCurrentItems(newItems);
		
		// Reset the flag after a short delay to allow the state update to complete
		setTimeout(() => {
			addingItemRef.current = false;
		}, 100);
	};

	const handleAddClick = (position: number) => {
		setAddPosition(position);
		setShowAddDialog(true);
	};

	const handleItemDeleted = (itemId: string) => {
		console.log('Item deleted:', itemId, 'Removing from parent state');
		setCurrentItems(currentItems.filter(item => item.id !== itemId));
	};

	const handleGridSizeChange = (value: string) => {
		const newSize = parseInt(value);
		if (newSize < minGridSize) {
			toast.error(
				`Você precisa remover photocards primeiro. Mínimo: ${minGridSize}x${minGridSize} para ${currentItems.length} items.`
			);
			return;
		}
		setGridSize(newSize);
	};

	const handleExport = () => {
		// Trigger export from grid view
		const event = new CustomEvent("exportWishlist");
		window.dispatchEvent(event);
	};

	return (
		<div>
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
				<div className="flex flex-wrap gap-2">
					<Button
						variant={view === "grid" ? "default" : "outline"}
						size="sm"
						onClick={() => setView("grid")}
						className={view === "grid" ? "bg-pink-600 hover:bg-pink-700" : ""}
					>
						<Grid3x3 className="w-4 h-4 mr-2" />
						Grid
					</Button>
					<Button
						variant={view === "list" ? "default" : "outline"}
						size="sm"
						onClick={() => setView("list")}
						className={view === "list" ? "bg-pink-600 hover:bg-pink-700" : ""}
					>
						<List className="w-4 h-4 mr-2" />
						Lista
					</Button>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{view === "grid" && isOwner && (
						<div className="flex items-center gap-2">
							<Label htmlFor="grid-size" className="text-sm whitespace-nowrap">
								Tamanho:
							</Label>
							<Select
								value={gridSize.toString()}
								onValueChange={handleGridSizeChange}
							>
								<SelectTrigger id="grid-size" className="w-20">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="4">4x4</SelectItem>
									<SelectItem value="6">6x6</SelectItem>
									<SelectItem value="8">8x8</SelectItem>
									<SelectItem value="10">10x10</SelectItem>
									<SelectItem value="12">12x12</SelectItem>
								</SelectContent>
							</Select>
						</div>
					)}
					{view === "grid" && (
						<Button variant="outline" size="sm" onClick={handleExport}>
							<Download className="w-4 h-4 mr-2" />
							Exportar
						</Button>
					)}
					{isOwner && (
						<Button
							size="sm"
							className="bg-pink-600 hover:bg-pink-700"
							onClick={() => setShowAddDialog(true)}
						>
							<Plus className="w-4 h-4 mr-2" />
							Adicionar Item
						</Button>
					)}
				</div>
			</div>

			{view === "grid" ? (
				<WishlistGridView
					items={currentItems}
					isOwner={isOwner}
					onAddClick={handleAddClick}
					onItemDeleted={handleItemDeleted}
					gridSize={gridSize}
					wishlistTitle={wishlistTitle}
				/>
			) : (
				<WishlistListView
					items={currentItems}
					isOwner={isOwner}
					onItemUpdated={handleItemAdded}
					onItemDeleted={handleItemDeleted}
				/>
			)}

			{isOwner && (
				<AddItemDialog
					open={showAddDialog}
					onOpenChange={setShowAddDialog}
					wishlistId={wishlistId}
					nextPosition={addPosition}
					onItemAdded={handleItemAdded}
				/>
			)}
		</div>
	);
}
