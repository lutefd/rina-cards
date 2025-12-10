"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateWishlistItem, WishlistItem as ApiWishlistItem } from "@/lib/api-client"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface WishlistItem extends ApiWishlistItem {
  grupo?: string | null
  era?: string | null
  colecao?: string | null
  imagem_url?: string | null
  notas?: string | null
  posicao?: number
}

interface PhotocardDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: WishlistItem | null
  isOwner: boolean
  onItemUpdated?: (item: WishlistItem) => void
}

export function PhotocardDetailModal({ 
  open, 
  onOpenChange, 
  item, 
  isOwner,
  onItemUpdated 
}: PhotocardDetailModalProps) {
  const [status, setStatus] = useState(item?.status || "desejado")
  const [notes, setNotes] = useState(item?.notes || item?.notas || "")
  const [isLoading, setIsLoading] = useState(false)

  // Update local state when item changes
  useState(() => {
    if (item) {
      setStatus(item.status || "desejado")
      setNotes(item.notes || item.notas || "")
    }
  })

  if (!item) return null

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const updatedItem = await updateWishlistItem(item.id, {
        status,
        notes: notes || null
      })

      const legacyItem = {
        ...updatedItem,
        grupo: updatedItem.group,
        era: updatedItem.album,
        colecao: updatedItem.version,
        imagem_url: updatedItem.imageUrl,
        notas: updatedItem.notes,
        posicao: updatedItem.priority
      }

      toast.success("Photocard atualizado com sucesso")
      onItemUpdated?.(legacyItem as WishlistItem)
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating item:", error)
      toast.error("Erro ao atualizar photocard")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "desejado": return "Desejado"
      case "prioridade": return "Prioridade"
      case "otw": return "A Caminho (OTW)"
      case "comprado": return "Comprado"
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "desejado": return "bg-gray-100 text-gray-700"
      case "prioridade": return "bg-pink-100 text-pink-700"
      case "otw": return "bg-blue-100 text-blue-700"
      case "comprado": return "bg-green-100 text-green-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isOwner ? "Editar Photocard" : "Detalhes do Photocard"}</DialogTitle>
          <DialogDescription>
            {isOwner ? "Atualize o status e notas do photocard" : "Informações do photocard"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photocard Image and Info */}
          <div className="flex gap-4">
            <div className="w-32 h-40 bg-gray-100 rounded-lg overflow-hidden shrink-0">
              {(item.imageUrl || item.imagem_url) ? (
                <img
                  src={item.imageUrl || item.imagem_url || ""}
                  alt={item.photocard}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-xs text-center p-2">{item.idol}</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-semibold">{item.photocard}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Idol</p>
                <p className="font-medium">{item.idol}</p>
              </div>

              {(item.group || item.grupo) && (
                <div>
                  <p className="text-sm text-muted-foreground">Grupo</p>
                  <p className="font-medium">{item.group || item.grupo}</p>
                </div>
              )}

              {(item.album || item.era) && (
                <div>
                  <p className="text-sm text-muted-foreground">Era/Álbum</p>
                  <p className="font-medium">{item.album || item.era}</p>
                </div>
              )}

              {(item.version || item.colecao) && (
                <div>
                  <p className="text-sm text-muted-foreground">Coleção/Versão</p>
                  <p className="font-medium">{item.version || item.colecao}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            {isOwner ? (
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desejado">Desejado</SelectItem>
                  <SelectItem value="prioridade">Prioridade</SelectItem>
                  <SelectItem value="otw">A Caminho (OTW)</SelectItem>
                  <SelectItem value="comprado">Comprado</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge className={getStatusColor(item.status)}>
                {getStatusLabel(item.status)}
              </Badge>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notas</Label>
            {isOwner ? (
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre este photocard..."
                rows={3}
              />
            ) : (
              <p className="text-sm text-muted-foreground p-3 bg-gray-50 rounded-lg min-h-[80px]">
                {notes || "Sem notas"}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              {isOwner ? "Cancelar" : "Fechar"}
            </Button>
            {isOwner && (
              <Button 
                onClick={handleSave} 
                disabled={isLoading} 
                className="flex-1 bg-pink-600 hover:bg-pink-700"
              >
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
