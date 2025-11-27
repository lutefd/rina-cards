"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Search, Mail, Phone } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Pedido {
  id: string
  quantidade: number
  preco_unitario: number
  preco_total: number
  status: string
  informacoes_contato: any
  notas: string | null
  comprador: {
    nome_completo: string | null
    email: string
    telefone: string | null
  }
  photocard: {
    titulo: string
    idol: string
    grupo: string
  }
}

interface GerenciadorPedidosProps {
  cegId: string
  pedidos: Pedido[]
}

export function GerenciadorPedidos({ cegId, pedidos: initialPedidos }: GerenciadorPedidosProps) {
  const [pedidos, setPedidos] = useState(initialPedidos)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmado":
        return "default"
      case "pago":
        return "default"
      case "enviado":
        return "secondary"
      case "entregue":
        return "outline"
      case "cancelado":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendente":
        return "Pendente"
      case "confirmado":
        return "Confirmado"
      case "pago":
        return "Pago"
      case "enviado":
        return "Enviado"
      case "entregue":
        return "Entregue"
      case "cancelado":
        return "Cancelado"
      default:
        return status
    }
  }

  const updateStatus = async (pedidoId: string, novoStatus: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("ceg_pedidos").update({ status: novoStatus }).eq("id", pedidoId)

    if (error) {
      console.error("[v0] Error updating status:", error)
      return
    }

    setPedidos(pedidos.map((p) => (p.id === pedidoId ? { ...p, status: novoStatus } : p)))
  }

  const filteredPedidos = pedidos.filter(
    (p) =>
      p.comprador.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.comprador.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.photocard.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.photocard.idol.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalReceber = pedidos.filter((p) => p.status !== "cancelado").reduce((acc, p) => acc + p.preco_total, 0)

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total de Pedidos</p>
          <p className="text-2xl font-bold">{pedidos.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-bold">{pedidos.filter((p) => p.status === "pendente").length}</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Entregues</p>
          <p className="text-2xl font-bold">{pedidos.filter((p) => p.status === "entregue").length}</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total a Receber</p>
          <p className="text-2xl font-bold text-pink-600">R$ {totalReceber.toFixed(2)}</p>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por comprador, photocard ou idol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabela de Pedidos */}
      <div className="bg-white rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Comprador</TableHead>
              <TableHead>Photocard</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Preço Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPedidos.map((pedido) => (
              <TableRow key={pedido.id}>
                <TableCell className="font-medium">
                  {pedido.comprador.nome_completo || pedido.comprador.email}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{pedido.photocard.titulo}</p>
                    <p className="text-sm text-muted-foreground">
                      {pedido.photocard.idol} - {pedido.photocard.grupo}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{pedido.quantidade}</TableCell>
                <TableCell className="font-medium">R$ {pedido.preco_total.toFixed(2)}</TableCell>
                <TableCell>
                  <Select value={pedido.status} onValueChange={(value) => updateStatus(pedido.id, value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="enviado">Enviado</SelectItem>
                      <SelectItem value="entregue">Entregue</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {pedido.comprador.email && (
                      <a href={`mailto:${pedido.comprador.email}`} title={pedido.comprador.email}>
                        <Button size="icon" variant="ghost">
                          <Mail className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {pedido.comprador.telefone && (
                      <a href={`tel:${pedido.comprador.telefone}`} title={pedido.comprador.telefone}>
                        <Button size="icon" variant="ghost">
                          <Phone className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedPedido(pedido)
                      setShowDetailsDialog(true)
                    }}
                  >
                    Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredPedidos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{searchTerm ? "Nenhum pedido encontrado" : "Nenhum pedido ainda"}</p>
          </div>
        )}
      </div>

      {/* Dialog de Detalhes */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>Informações completas sobre o pedido</DialogDescription>
          </DialogHeader>

          {selectedPedido && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold">Comprador</p>
                <p>{selectedPedido.comprador.nome_completo}</p>
                <p className="text-sm text-muted-foreground">{selectedPedido.comprador.email}</p>
                {selectedPedido.comprador.telefone && (
                  <p className="text-sm text-muted-foreground">{selectedPedido.comprador.telefone}</p>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold">Photocard</p>
                <p>{selectedPedido.photocard.titulo}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPedido.photocard.idol} - {selectedPedido.photocard.grupo}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold">Quantidade</p>
                  <p>{selectedPedido.quantidade}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Preço Unitário</p>
                  <p>R$ {selectedPedido.preco_unitario.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold">Preço Total</p>
                <p className="text-lg font-bold text-pink-600">R$ {selectedPedido.preco_total.toFixed(2)}</p>
              </div>

              {selectedPedido.notas && (
                <div>
                  <p className="text-sm font-semibold">Notas</p>
                  <p className="text-sm">{selectedPedido.notas}</p>
                </div>
              )}

              {selectedPedido.informacoes_contato && (
                <div>
                  <p className="text-sm font-semibold">Informações Adicionais de Contato</p>
                  <pre className="text-sm bg-gray-50 p-2 rounded">
                    {JSON.stringify(selectedPedido.informacoes_contato, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
