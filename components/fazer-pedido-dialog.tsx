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
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ShoppingCart, Trash2 } from "lucide-react"

interface Photocard {
  id: string
  titulo: string
  descricao: string | null
  idol: string
  grupo: string
  preco: number | null
  imagem_url: string | null
}

interface FazerPedidoDialogProps {
  cegId: string
  photocards: Photocard[]
}

export function FazerPedidoDialog({ cegId, photocards }: FazerPedidoDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedPhotocards, setSelectedPhotocards] = useState<{ id: string; quantidade: number }[]>([])
  const [telefone, setTelefone] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const togglePhotocard = (photocardId: string) => {
    setSelectedPhotocards((prev) => {
      const exists = prev.find((p) => p.id === photocardId)
      if (exists) {
        return prev.filter((p) => p.id !== photocardId)
      } else {
        return [...prev, { id: photocardId, quantidade: 1 }]
      }
    })
  }

  const updateQuantidade = (photocardId: string, quantidade: number) => {
    if (quantidade < 1) return
    setSelectedPhotocards((prev) => prev.map((p) => (p.id === photocardId ? { ...p, quantidade } : p)))
  }

  const calcularTotal = () => {
    return selectedPhotocards.reduce((total, item) => {
      const photocard = photocards.find((p) => p.id === item.id)
      return total + (photocard?.preco || 0) * item.quantidade
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedPhotocards.length === 0) {
      alert("Selecione pelo menos um photocard")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("Você precisa estar logado para fazer um pedido")
        return
      }

      // Criar pedidos para cada photocard selecionado
      const pedidos = selectedPhotocards.map((item) => {
        const photocard = photocards.find((p) => p.id === item.id)
        return {
          ceg_id: cegId,
          photocard_id: item.id,
          comprador_id: user.id,
          quantidade: item.quantidade,
          preco_unitario: photocard?.preco || 0,
          preco_total: (photocard?.preco || 0) * item.quantidade,
          telefone,
          observacoes: observacoes || null,
          status: "pendente",
        }
      })

      const { error } = await supabase.from("ceg_pedidos").insert(pedidos)

      if (error) {
        throw error
      }

      alert("Pedido realizado com sucesso!")
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error("Erro ao fazer pedido:", error)
      alert("Erro ao fazer pedido: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-pink-600 hover:bg-pink-700" size="lg">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Fazer Pedido neste CEG
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fazer Pedido no CEG</DialogTitle>
          <DialogDescription>
            Selecione os photocards que deseja encomendar e preencha suas informações de contato
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de Photocards */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Selecione os Photocards</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto border rounded-lg p-3">
              {photocards.map((pc) => {
                const selected = selectedPhotocards.find((s) => s.id === pc.id)
                return (
                  <div
                    key={pc.id}
                    onClick={() => togglePhotocard(pc.id)}
                    className={`border rounded-lg p-2 cursor-pointer transition-all ${
                      selected ? "border-pink-500 bg-pink-50" : "hover:border-gray-300"
                    }`}
                  >
                    <div className="aspect-[3/4] bg-gray-100 rounded mb-2 relative overflow-hidden">
                      <img
                        src={pc.imagem_url || `/placeholder.svg?height=200&width=150&query=${pc.idol} photocard`}
                        alt={pc.titulo}
                        className="w-full h-full object-cover"
                      />
                      {selected && (
                        <div className="absolute top-1 right-1 bg-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-xs line-clamp-1">{pc.titulo}</h4>
                    <p className="text-xs text-muted-foreground">{pc.idol}</p>
                    <p className="text-sm font-bold text-pink-600 mt-1">R$ {pc.preco?.toFixed(2)}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Resumo dos Selecionados */}
          {selectedPhotocards.length > 0 && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="text-base font-semibold mb-3 block">Photocards Selecionados</Label>
              <div className="space-y-2">
                {selectedPhotocards.map((item) => {
                  const photocard = photocards.find((p) => p.id === item.id)
                  if (!photocard) return null
                  return (
                    <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{photocard.titulo}</p>
                        <p className="text-xs text-muted-foreground">{photocard.idol}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateQuantidade(item.id, item.quantidade - 1)
                            }}
                            disabled={item.quantidade <= 1}
                          >
                            -
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantidade}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateQuantidade(item.id, item.quantidade + 1)
                            }}
                          >
                            +
                          </Button>
                        </div>
                        <p className="text-sm font-bold text-pink-600 w-20 text-right">
                          R$ {((photocard.preco || 0) * item.quantidade).toFixed(2)}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePhotocard(item.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="text-2xl font-bold text-pink-600">R$ {calcularTotal().toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Informações de Contato */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="telefone">
                Telefone/WhatsApp <span className="text-red-500">*</span>
              </Label>
              <Input
                id="telefone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">O vendedor usará este número para entrar em contato</p>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais sobre seu pedido..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || selectedPhotocards.length === 0}
              className="flex-1 bg-pink-600 hover:bg-pink-700"
            >
              {isSubmitting ? "Enviando..." : "Confirmar Pedido"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
