"use client"

import type React from "react"

import { useState, useMemo } from "react"
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
import { useRouter } from "next/navigation"
import { ShoppingCart, Trash2, Search, X } from "lucide-react"
import { createOrder } from "@/lib/api-client"
import { toast } from "sonner"

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
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  // Filter photocards based on search
  const filteredPhotocards = useMemo(() => {
    if (!searchQuery.trim()) return photocards
    const query = searchQuery.toLowerCase()
    return photocards.filter(
      (pc) =>
        pc.titulo.toLowerCase().includes(query) ||
        pc.idol.toLowerCase().includes(query) ||
        pc.grupo?.toLowerCase().includes(query)
    )
  }, [photocards, searchQuery])

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
      toast.error("Selecione pelo menos um photocard")
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare order items
      const items = selectedPhotocards.map((item) => {
        const photocard = photocards.find((p) => p.id === item.id)
        return {
          productId: item.id,
          quantity: item.quantidade,
          unitPrice: photocard?.preco || 0
        }
      })

      // Create contact info object
      const contactInfo = {
        telefone,
        observacoes: observacoes || undefined
      }

      // Create order using API client
      await createOrder({
        groupPurchaseId: cegId,
        items,
        contactInfo
      })

      toast.success("Pedido realizado com sucesso!")
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error("Erro ao fazer pedido:", error)
      toast.error("Erro ao fazer pedido: " + (error.message || "Tente novamente mais tarde"))
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Fazer Pedido no CEG</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Selecione os photocards que deseja encomendar e preencha suas informações de contato
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 flex-1 overflow-y-auto">
          {/* Seleção de Photocards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm md:text-base font-semibold">Selecione os Photocards</Label>
              <span className="text-xs md:text-sm text-muted-foreground">
                {selectedPhotocards.length} selecionado{selectedPhotocards.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Search bar */}
            {photocards.length > 6 && (
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nome, idol ou grupo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3 max-h-[40vh] overflow-y-auto border rounded-lg p-2 md:p-3">
              {filteredPhotocards.length > 0 ? (
                filteredPhotocards.map((pc) => {
                  const selected = selectedPhotocards.find((s) => s.id === pc.id)
                  return (
                    <div
                      key={pc.id}
                      onClick={() => togglePhotocard(pc.id)}
                      className={`border rounded-lg p-1.5 md:p-2 cursor-pointer transition-all ${
                        selected ? "border-pink-500 bg-pink-50 ring-2 ring-pink-200" : "hover:border-pink-300"
                      }`}
                    >
                      <div className="aspect-3/4 bg-gray-100 rounded mb-1.5 relative overflow-hidden">
                        <img
                          src={pc.imagem_url || `/placeholder.svg?height=200&width=150&query=${pc.idol} photocard`}
                          alt={pc.titulo}
                          className="w-full h-full object-cover"
                        />
                        {selected && (
                          <div className="absolute top-1 right-1 bg-pink-600 text-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                            ✓
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium text-[10px] md:text-xs line-clamp-2">{pc.titulo}</h4>
                      <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1">{pc.idol}</p>
                      <p className="text-xs md:text-sm font-bold text-pink-600 mt-0.5">R$ {pc.preco?.toFixed(2)}</p>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nenhum photocard encontrado</p>
                </div>
              )}
            </div>
          </div>

          {/* Resumo dos Selecionados */}
          {selectedPhotocards.length > 0 && (
            <div className="border rounded-lg p-3 md:p-4 bg-gray-50">
              <Label className="text-sm md:text-base font-semibold mb-2 md:mb-3 block">Photocards Selecionados</Label>
              <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                {selectedPhotocards.map((item) => {
                  const photocard = photocards.find((p) => p.id === item.id)
                  if (!photocard) return null
                  return (
                    <div key={item.id} className="flex items-center gap-2 bg-white p-2 md:p-3 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs md:text-sm line-clamp-1">{photocard.titulo}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1">{photocard.idol}</p>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-3">
                        <div className="flex items-center gap-1 md:gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 md:h-8 md:w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateQuantidade(item.id, item.quantidade - 1)
                            }}
                            disabled={item.quantidade <= 1}
                          >
                            -
                          </Button>
                          <span className="text-xs md:text-sm font-medium w-6 md:w-8 text-center">{item.quantidade}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 md:h-8 md:w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateQuantidade(item.id, item.quantidade + 1)
                            }}
                          >
                            +
                          </Button>
                        </div>
                        <p className="text-xs md:text-sm font-bold text-pink-600 w-14 md:w-20 text-right">
                          R$ {((photocard.preco || 0) * item.quantidade).toFixed(2)}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 md:h-8 md:w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePhotocard(item.id)
                          }}
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t flex justify-between items-center">
                <span className="text-sm md:text-base font-semibold">Total:</span>
                <span className="text-xl md:text-2xl font-bold text-pink-600">R$ {calcularTotal().toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Informações de Contato */}
          <div className="space-y-3 md:space-y-4">
            <div>
              <Label htmlFor="telefone" className="text-sm md:text-base">
                Telefone/WhatsApp <span className="text-red-500">*</span>
              </Label>
              <Input
                id="telefone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="text-sm md:text-base"
                required
              />
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">O vendedor usará este número para entrar em contato</p>
            </div>

            <div>
              <Label htmlFor="observacoes" className="text-sm md:text-base">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais sobre seu pedido..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="text-sm md:text-base"
                rows={3}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 text-sm md:text-base">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || selectedPhotocards.length === 0}
              className="flex-1 bg-pink-600 hover:bg-pink-700 text-sm md:text-base"
            >
              {isSubmitting ? "Enviando..." : `Confirmar Pedido (${selectedPhotocards.length})`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
