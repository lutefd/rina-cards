"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"

interface EditarWishlistFormProps {
  wishlist: {
    id: string
    nome: string
    descricao: string | null
    visibilidade: string
  }
}

export function EditarWishlistForm({ wishlist }: EditarWishlistFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nome, setNome] = useState(wishlist.nome)
  const [descricao, setDescricao] = useState(wishlist.descricao || "")
  const [visibilidade, setVisibilidade] = useState(wishlist.visibilidade)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from("wishlists")
      .update({
        nome,
        descricao: descricao || null,
        visibilidade,
      })
      .eq("id", wishlist.id)

    if (updateError) {
      setError("Erro ao atualizar wishlist. Tente novamente.")
      setIsLoading(false)
      return
    }

    router.push(`/wishlist/${wishlist.id}`)
    router.refresh()
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    const { error: deleteError } = await supabase.from("wishlists").delete().eq("id", wishlist.id)

    if (deleteError) {
      setError("Erro ao deletar wishlist. Tente novamente.")
      setIsDeleting(false)
      return
    }

    router.push("/minhas-wishlists")
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="nome">Nome da Wishlist *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Minha Coleção BLACKPINK"
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva sua wishlist..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="visibilidade">Visibilidade *</Label>
            <Select value={visibilidade} onValueChange={setVisibilidade}>
              <SelectTrigger id="visibilidade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="publica">Pública - Qualquer um pode ver</SelectItem>
                <SelectItem value="privada">Privada - Apenas você</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-pink-600 hover:bg-pink-700">
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" disabled={isDeleting}>
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar Wishlist
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso irá deletar permanentemente sua wishlist e todos os itens nela.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Deletar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
