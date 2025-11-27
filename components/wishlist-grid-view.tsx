"use client"

import type React from "react"

import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, GripVertical } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface WishlistItem {
  id: string
  idol: string
  grupo: string | null
  era: string | null
  colecao: string | null
  imagem_url: string | null
  status: string
  notas: string | null
  posicao: number // Assuming posicao is a field in the WishlistItem interface
}

interface WishlistGridViewProps {
  items: WishlistItem[]
  isOwner: boolean
}

export function WishlistGridView({ items, isOwner }: WishlistGridViewProps) {
  const [currentItems, setCurrentItems] = useState(items)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  const gridSize = 8
  const totalSlots = gridSize * gridSize
  const slots = Array.from({ length: totalSlots }, (_, i) => i)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "desejado":
        return "bg-gray-100 border-gray-300"
      case "comprado":
        return "bg-green-50 border-green-300"
      case "otw":
        return "bg-blue-50 border-blue-300"
      case "prioridade":
        return "bg-pink-50 border-pink-300"
      default:
        return "bg-gray-100 border-gray-300"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "desejado":
        return ""
      case "comprado":
        return "✓"
      case "otw":
        return "otw"
      case "prioridade":
        return "prio"
      default:
        return ""
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("wishlist_items").delete().eq("id", itemId)

    if (!error) {
      setCurrentItems(currentItems.filter((item) => item.id !== itemId))
    }
    setItemToDelete(null)
  }

  const handleDragStart = (index: number) => {
    setDraggedItem(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (targetIndex: number) => {
    if (draggedItem === null || draggedItem === targetIndex) {
      setDraggedItem(null)
      return
    }

    const newItems = [...currentItems]
    const [draggedItemData] = newItems.splice(draggedItem, 1)
    newItems.splice(targetIndex, 0, draggedItemData)

    const supabase = createClient()
    const updates = newItems.map((item, index) => ({
      id: item.id,
      posicao: index,
    }))

    for (const update of updates) {
      await supabase.from("wishlist_items").update({ posicao: update.posicao }).eq("id", update.id)
    }

    setCurrentItems(newItems)
    setDraggedItem(null)
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="grid grid-cols-8 gap-2">
        {slots.map((slotIndex) => {
          const item = currentItems[slotIndex]

          if (!item) {
            return (
              <div
                key={slotIndex}
                className="aspect-[3/4] bg-green-100 rounded border-2 border-dashed border-green-300 flex items-center justify-center"
                onDragOver={handleDragOver}
                onDrop={() => isOwner && handleDrop(slotIndex)}
              >
                {isOwner && <span className="text-green-400 text-2xl">+</span>}
              </div>
            )
          }

          return (
            <div
              key={item.id}
              className={`aspect-[3/4] rounded border-2 relative overflow-hidden group ${getStatusColor(item.status)} ${
                isOwner ? "cursor-move" : ""
              }`}
              draggable={isOwner}
              onDragStart={() => handleDragStart(slotIndex)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(slotIndex)}
            >
              {isOwner && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={() => setItemToDelete(item.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}

              {isOwner && (
                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-white drop-shadow-lg" />
                </div>
              )}

              {item.imagem_url ? (
                <Image src={item.imagem_url || "/placeholder.svg"} alt={item.idol} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                  <span className="text-xs font-medium text-center">{item.idol}</span>
                </div>
              )}

              {getStatusLabel(item.status) && (
                <div className="absolute bottom-1 right-1 bg-white px-1.5 py-0.5 rounded text-[10px] font-semibold">
                  {getStatusLabel(item.status)}
                </div>
              )}

              {item.colecao && (
                <div className="absolute bottom-1 left-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-[8px] font-semibold">
                  {item.colecao}
                </div>
              )}

              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-white">
                <p className="text-xs font-semibold text-center mb-1">{item.idol}</p>
                {item.grupo && <p className="text-[10px] text-center">{item.grupo}</p>}
                {item.era && <p className="text-[10px] text-center text-gray-300">{item.era}</p>}
              </div>
            </div>
          )
        })}
      </div>

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
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
  )
}
