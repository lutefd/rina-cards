"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Check, X, AlertCircle } from "lucide-react"
import { AdicionarPhotocardCEGDialog } from "@/components/adicionar-photocard-ceg-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

interface Photocard {
  id: string
  titulo: string
  idol: string
  grupo: string | null
  era: string | null
  colecao: string | null
  imagem_url: string | null
  preco: number | null
  status: string
  solicitado_por: string | null
  notas_solicitacao: string | null
  solicitante?: {
    nome_completo: string
    email: string
  }
}

interface GerenciadorPhotocardsCEGProps {
  cegId: string
  photocards: Photocard[]
}

export function GerenciadorPhotocardsCEG({ cegId, photocards }: GerenciadorPhotocardsCEGProps) {
  const [currentPhotocards, setCurrentPhotocards] = useState(photocards)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  const disponiveisAprovados = currentPhotocards.filter((p) => p.status === "disponivel" || p.status === "aprovado")
  const solicitacoes = currentPhotocards.filter((p) => p.status === "solicitado")

  const handleAprovar = async (photocardId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("ceg_photocards").update({ status: "aprovado" }).eq("id", photocardId)

    if (!error) {
      setCurrentPhotocards(currentPhotocards.map((p) => (p.id === photocardId ? { ...p, status: "aprovado" } : p)))
    }
  }

  const handleRejeitar = async (photocardId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("ceg_photocards").update({ status: "rejeitado" }).eq("id", photocardId)

    if (!error) {
      setCurrentPhotocards(currentPhotocards.filter((p) => p.id !== photocardId))
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return

    const supabase = createClient()
    const { error } = await supabase.from("ceg_photocards").delete().eq("id", itemToDelete)

    if (!error) {
      setCurrentPhotocards(currentPhotocards.filter((p) => p.id !== itemToDelete))
    }
    setItemToDelete(null)
  }

  const handlePhotocardAdded = (newPhotocard: Photocard) => {
    setCurrentPhotocards([...currentPhotocards, newPhotocard])
  }

  return (
    <div className="space-y-6 mb-6">
      {/* Photocards Disponíveis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Photocards Disponíveis no CEG</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Photocards que os compradores podem encomendar através deste CEG
              </p>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="bg-pink-600 hover:bg-pink-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Photocard
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {disponiveisAprovados.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {disponiveisAprovados.map((photocard) => (
                <div key={photocard.id} className="border rounded-lg p-3 relative group">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setItemToDelete(photocard.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-2 relative overflow-hidden">
                    <img
                      src={photocard.imagem_url || `/placeholder.svg?height=300&width=225&query=${photocard.idol}`}
                      alt={photocard.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="font-medium text-sm line-clamp-1">{photocard.titulo}</h4>
                  <p className="text-xs text-muted-foreground">{photocard.idol}</p>
                  {photocard.preco && (
                    <p className="text-sm font-bold text-pink-600 mt-1">R$ {photocard.preco.toFixed(2)}</p>
                  )}
                  {photocard.status === "aprovado" && (
                    <Badge className="mt-2 bg-green-100 text-green-700 text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      Solicitação Aprovada
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum photocard adicionado ainda</p>
              <p className="text-sm mt-1">Adicione photocards para que os compradores possam fazer pedidos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Solicitações Pendentes */}
      {solicitacoes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <CardTitle>Solicitações de Photocards</CardTitle>
              <Badge className="bg-orange-100 text-orange-700">{solicitacoes.length}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Compradores solicitaram estes photocards. Aprove ou rejeite conforme disponibilidade.
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photocard</TableHead>
                  <TableHead>Solicitado por</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Preço Sugerido</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitacoes.map((photocard) => (
                  <TableRow key={photocard.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{photocard.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          {photocard.idol}
                          {photocard.grupo && ` - ${photocard.grupo}`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{photocard.solicitante?.nome_completo}</p>
                        <p className="text-sm text-muted-foreground">{photocard.solicitante?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{photocard.notas_solicitacao || "-"}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{photocard.preco ? `R$ ${photocard.preco.toFixed(2)}` : "-"}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleAprovar(photocard.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRejeitar(photocard.id)}>
                          <X className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AdicionarPhotocardCEGDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        cegId={cegId}
        onPhotocardAdded={handlePhotocardAdded}
      />

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover photocard?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este photocard do CEG? Ele não estará mais disponível para pedidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
