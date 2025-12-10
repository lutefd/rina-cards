"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateOrderStatus } from "@/lib/api-client"
import { Search, Mail, Phone } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

interface Pedido {
  id: string
  quantity: number
  unitPrice: number
  totalAmount: number
  status: string
  contactInfo: any
  notes: string | null
  user: {
    name: string | null
    email: string | null
    phone?: string | null
  }
  product?: {
    name: string
    idol?: string | null
    group?: string | null
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
      case "confirmed":
        return "default"
      case "paid":
        return "default"
      case "shipped":
        return "secondary"
      case "delivered":
        return "outline"
      case "canceled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente"
      case "confirmed":
        return "Confirmado"
      case "paid":
        return "Pago"
      case "shipped":
        return "Enviado"
      case "delivered":
        return "Entregue"
      case "canceled":
        return "Cancelado"
      default:
        return status
    }
  }

  const updateStatus = async (pedidoId: string, novoStatus: string) => {
    try {
      // Call the API to update the order status
      await updateOrderStatus(pedidoId, novoStatus)
      
      // Update the local state
      setPedidos(pedidos.map((p) => (p.id === pedidoId ? { ...p, status: novoStatus } : p)))
      
      // Show success message
      toast.success("Status atualizado com sucesso")
    } catch (error) {
      console.error("Error updating order status:", error)
      toast.error("Erro ao atualizar status")
    }
  }

  const filteredPedidos = pedidos.filter(
    (p) =>
      p.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.product?.idol?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalReceber = pedidos.filter((p) => p.status !== "canceled").reduce((acc, p) => acc + p.totalAmount, 0)

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
          <p className="text-2xl font-bold">{pedidos.filter((p) => p.status === "pending").length}</p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Entregues</p>
          <p className="text-2xl font-bold">{pedidos.filter((p) => p.status === "delivered").length}</p>
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
                  {pedido.user.name || pedido.user.email}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{pedido.product?.name || 'Photocard'}</p>
                    <p className="text-sm text-muted-foreground">
                      {pedido.product?.idol || ''} {pedido.product?.group ? `- ${pedido.product.group}` : ''}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{pedido.quantity}</TableCell>
                <TableCell className="font-medium">R$ {pedido.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <Select value={pedido.status} onValueChange={(value) => updateStatus(pedido.id, value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="shipped">Enviado</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="canceled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {pedido.user.email && (
                      <a href={`mailto:${pedido.user.email}`} title={pedido.user.email}>
                        <Button size="icon" variant="ghost">
                          <Mail className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {pedido.user.phone && (
                      <a href={`tel:${pedido.user.phone}`} title={pedido.user.phone}>
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
                <p>{selectedPedido.user.name}</p>
                <p className="text-sm text-muted-foreground">{selectedPedido.user.email}</p>
                {selectedPedido.user.phone && (
                  <p className="text-sm text-muted-foreground">{selectedPedido.user.phone}</p>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold">Photocard</p>
                <p>{selectedPedido.product?.name || 'Photocard'}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPedido.product?.idol || ''} {selectedPedido.product?.group ? `- ${selectedPedido.product.group}` : ''}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold">Quantidade</p>
                  <p>{selectedPedido.quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Preço Unitário</p>
                  <p>R$ {selectedPedido.unitPrice.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold">Preço Total</p>
                <p className="text-lg font-bold text-pink-600">R$ {selectedPedido.totalAmount.toFixed(2)}</p>
              </div>

              {selectedPedido.notes && (
                <div>
                  <p className="text-sm font-semibold">Notas</p>
                  <p className="text-sm">{selectedPedido.notes}</p>
                </div>
              )}

              {selectedPedido.contactInfo && (
                <div>
                  <p className="text-sm font-semibold">Informações Adicionais de Contato</p>
                  <pre className="text-sm bg-gray-50 p-2 rounded">
                    {JSON.stringify(selectedPedido.contactInfo, null, 2)}
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
