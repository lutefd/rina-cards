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

interface NovoCEGFormProps {
  userId: string
}

export function NovoCEGForm({ userId }: NovoCEGFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [tipo, setTipo] = useState("nacional")
  const [marketplaceOrigem, setMarketplaceOrigem] = useState("")
  const [dataFechamento, setDataFechamento] = useState("")
  const [taxaAdicional, setTaxaAdicional] = useState("")
  const [informacoesEnvio, setInformacoesEnvio] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from("cegs")
      .insert({
        vendedor_id: userId,
        titulo,
        descricao: descricao || null,
        tipo,
        marketplace_origem: marketplaceOrigem || null,
        data_fechamento: dataFechamento || null,
        taxa_adicional: taxaAdicional ? Number.parseFloat(taxaAdicional) : 0,
        informacoes_envio: informacoesEnvio || null,
        status: "aberto",
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error creating CEG:", insertError)
      setError("Erro ao criar CEG. Tente novamente.")
      setIsLoading(false)
      return
    }

    router.push(`/cegs/${data.id}/gerenciar`)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="titulo">Título do CEG *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: CEG BLACKPINK Born Pink - Dezembro 2024"
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes sobre o CEG, photocards disponíveis, etc."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="tipo">Tipo de CEG *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nacional">Nacional</SelectItem>
                <SelectItem value="internacional">Internacional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="marketplace">Marketplace de Origem</Label>
            <Input
              id="marketplace"
              value={marketplaceOrigem}
              onChange={(e) => setMarketplaceOrigem(e.target.value)}
              placeholder="Ex: Mercado Livre, Shopee, AliExpress"
            />
          </div>

          <div>
            <Label htmlFor="data-fechamento">Data de Fechamento</Label>
            <Input
              id="data-fechamento"
              type="date"
              value={dataFechamento}
              onChange={(e) => setDataFechamento(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="taxa">Taxa Adicional (R$)</Label>
            <Input
              id="taxa"
              type="number"
              step="0.01"
              value={taxaAdicional}
              onChange={(e) => setTaxaAdicional(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground mt-1">Taxa extra por photocard (frete, embalagem, etc.)</p>
          </div>

          <div>
            <Label htmlFor="envio">Informações de Envio</Label>
            <Textarea
              id="envio"
              value={informacoesEnvio}
              onChange={(e) => setInformacoesEnvio(e.target.value)}
              placeholder="Como será feita a entrega, locais de encontro, etc."
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-pink-600 hover:bg-pink-700">
              {isLoading ? "Criando..." : "Criar CEG"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
