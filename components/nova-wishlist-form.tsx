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

interface NovaWishlistFormProps {
  userId: string
}

export function NovaWishlistForm({ userId }: NovaWishlistFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [visibilidade, setVisibilidade] = useState("publica")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from("wishlists")
      .insert({
        usuario_id: userId,
        nome,
        descricao: descricao || null,
        visibilidade,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error creating wishlist:", insertError)
      setError("Erro ao criar wishlist. Tente novamente.")
      setIsLoading(false)
      return
    }

    router.push(`/wishlist/${data.id}`)
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
              placeholder="Ex: Minha wishlist do BTS"
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva sua wishlist (opcional)"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="visibilidade">Visibilidade</Label>
            <Select value={visibilidade} onValueChange={setVisibilidade}>
              <SelectTrigger id="visibilidade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="publica">Pública - Visível para todos</SelectItem>
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
              {isLoading ? "Criando..." : "Criar Wishlist"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
