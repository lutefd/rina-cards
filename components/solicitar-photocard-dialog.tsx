"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { requestPhotocard } from "@/lib/api-client"
import { toast } from "sonner"

interface SolicitarPhotocardDialogProps {
  cegId: string
}

export function SolicitarPhotocardDialog({ cegId }: SolicitarPhotocardDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [titulo, setTitulo] = useState("")
  const [idol, setIdol] = useState("")
  const [grupo, setGrupo] = useState("")
  const [era, setEra] = useState("")
  const [colecao, setColecao] = useState("")
  const [imagemUrl, setImagemUrl] = useState("")
  const [preco, setPreco] = useState("")
  const [notas, setNotas] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Request photocard using API client
      await requestPhotocard({
        groupPurchaseId: cegId,
        photocard: titulo,
        idol,
        group: grupo,
        era,
        collection: colecao,
        imageUrl: imagemUrl,
        requestNotes: notas
      })
      
      toast.success("Solicitação enviada com sucesso!")
      setOpen(false)
      
      // Limpar campos
      setTitulo("")
      setIdol("")
      setGrupo("")
      setEra("")
      setColecao("")
      setImagemUrl("")
      setPreco("")
      setNotas("")
      router.refresh()
    } catch (error) {
      console.error("Erro ao solicitar photocard:", error)
      toast.error("Erro ao enviar solicitação. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-transparent">
          <Plus className="w-4 h-4 mr-2" />
          Solicitar Photocard
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Photocard</DialogTitle>
          <DialogDescription>
            Solicite um photocard que não está na lista. O vendedor irá avaliar sua solicitação.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título do Photocard *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Lisa Photocard Moonlit Floor"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="idol">Idol *</Label>
              <Input id="idol" value={idol} onChange={(e) => setIdol(e.target.value)} placeholder="Ex: Lisa" required />
            </div>

            <div>
              <Label htmlFor="grupo">Grupo</Label>
              <Input id="grupo" value={grupo} onChange={(e) => setGrupo(e.target.value)} placeholder="Ex: BLACKPINK" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="era">Era</Label>
              <Input id="era" value={era} onChange={(e) => setEra(e.target.value)} placeholder="Ex: Moonlit Floor" />
            </div>

            <div>
              <Label htmlFor="colecao">Coleção</Label>
              <Input
                id="colecao"
                value={colecao}
                onChange={(e) => setColecao(e.target.value)}
                placeholder="Ex: FOCUS"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="imagemUrl">URL da Imagem (opcional)</Label>
            <Input
              id="imagemUrl"
              value={imagemUrl}
              onChange={(e) => setImagemUrl(e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground mt-1">Se tiver uma foto de referência do photocard</p>
          </div>

          <div>
            <Label htmlFor="preco">Preço Esperado (R$) - opcional</Label>
            <Input
              id="preco"
              type="number"
              step="0.01"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="notas">Notas Adicionais</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Informações adicionais sobre o photocard que você procura..."
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-pink-600 hover:bg-pink-700">
              {isLoading ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
