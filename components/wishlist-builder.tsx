"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Grid3x3, List, Download } from "lucide-react"
import { WishlistGridView } from "@/components/wishlist-grid-view"
import { WishlistListView } from "@/components/wishlist-list-view"
import { AddItemDialog } from "@/components/add-item-dialog"

interface WishlistItem {
  id: string
  wishlist_id: string
  photocard_id: string | null
  idol: string
  grupo: string | null
  era: string | null
  colecao: string | null
  imagem_url: string | null
  posicao: number
  status: string
  notas: string | null
}

interface WishlistBuilderProps {
  wishlistId: string
  items: WishlistItem[]
  isOwner: boolean
}

export function WishlistBuilder({ wishlistId, items, isOwner }: WishlistBuilderProps) {
  const [view, setView] = useState<"grid" | "list">("grid")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [currentItems, setCurrentItems] = useState(items)

  const handleItemAdded = (newItem: WishlistItem) => {
    setCurrentItems([...currentItems, newItem])
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
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

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          {isOwner && (
            <Button size="sm" className="bg-pink-600 hover:bg-pink-700" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          )}
        </div>
      </div>

      {view === "grid" ? (
        <WishlistGridView items={currentItems} isOwner={isOwner} />
      ) : (
        <WishlistListView items={currentItems} isOwner={isOwner} />
      )}

      {isOwner && (
        <AddItemDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          wishlistId={wishlistId}
          nextPosition={currentItems.length}
          onItemAdded={handleItemAdded}
        />
      )}
    </div>
  )
}
