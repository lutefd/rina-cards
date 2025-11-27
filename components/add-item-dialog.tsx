"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wishlistId: string
  nextPosition: number
  onItemAdded: (item: any) => void
}

export function AddItemDialog({ open, onOpenChange, wishlistId, nextPosition, onItemAdded }: AddItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [idol, setIdol] = useState("")
  const [grupo, setGrupo] = useState("")
  const [era, setEra] = useState("")
  const [colecao, setColecao] = useState("")
  const [imagemUrl, setImagemUrl] = useState("")
  const [status, setStatus] = useState("desejado")
  const [notas, setNotas] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from("wishlist_items")
      .insert({
        wishlist_id: wishlistId,
        idol,
        grupo: grupo || null,
        era: era || null,
        colecao: colecao || null,
        imagem_url: imagemUrl || null,
        posicao: nextPosition,
        status,
        notas: notas || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error adding item:", insertError)
      setError("Erro ao adicionar item. Tente novamente.")
      setIsLoading(false)
      return
    }

    onItemAdded(data)
    onOpenChange(false)

    // Limpar form
    setIdol("")
    setGrupo("")
    setEra("")
    setColecao("")
    setImagemUrl("")
    setStatus("desejado")
    setNotas("")
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Photocard</DialogTitle>
          <DialogDescription>Adicione um novo photocard à sua wishlist</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="idol">Idol *</Label>
            <Input
              id="idol"
              value={idol}
              onChange={(e) => setIdol(e.target.value)}
              placeholder="Nome do idol"
              required
            />
          </div>

          <div>
            <Label htmlFor="grupo">Grupo</Label>
            <Input id="grupo" value={grupo} onChange={(e) => setGrupo(e.target.value)} placeholder="Nome do grupo" />
          </div>

          <div>
            <Label htmlFor="era">Era</Label>
            <Input
              id="era"
              value={era}
              onChange={(e) => setEra(e.target.value)}
              placeholder="Ex: Born Pink, The Album"
            />
          </div>

          <div>
            <Label htmlFor="colecao">Coleção</Label>
            <Input
              id="colecao"
              value={colecao}
              onChange={(e) => setColecao(e.target.value)}
              placeholder="Ex: THE CHASE, FOCUS, ERA"
            />
          </div>

          <div>
            <Label htmlFor="imagem">URL da Imagem</Label>
            <Input
              id="imagem"
              value={imagemUrl}
              onChange={(e) => setImagemUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
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
          </div>

          <div>
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observações adicionais"
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-pink-600 hover:bg-pink-700">
              {isLoading ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
