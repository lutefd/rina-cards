"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"

interface AdicionarPhotocardCEGDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cegId: string
  onPhotocardAdded: (photocard: any) => void
}

export function AdicionarPhotocardCEGDialog({
  open,
  onOpenChange,
  cegId,
  onPhotocardAdded,
}: AdicionarPhotocardCEGDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [photocards, setPhotocards] = useState<any[]>([])
  const [selectedPhotocard, setSelectedPhotocard] = useState<any | null>(null)

  // Campos para criar novo photocard
  const [titulo, setTitulo] = useState("")
  const [idol, setIdol] = useState("")
  const [grupo, setGrupo] = useState("")
  const [era, setEra] = useState("")
  const [colecao, setColecao] = useState("")
  const [imagemUrl, setImagemUrl] = useState("")
  const [preco, setPreco] = useState("")

  useEffect(() => {
    if (open && searchQuery) {
      searchPhotocards()
    }
  }, [searchQuery, open])

  const searchPhotocards = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("photocards")
      .select("*")
      .or(`titulo.ilike.%${searchQuery}%,idol.ilike.%${searchQuery}%,grupo.ilike.%${searchQuery}%`)
      .limit(10)

    setPhotocards(data || [])
  }

  const handleAdicionarExistente = async () => {
    if (!selectedPhotocard) return

    setIsLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("ceg_photocards")
      .insert({
        ceg_id: cegId,
        photocard_id: selectedPhotocard.id,
        titulo: selectedPhotocard.titulo,
        idol: selectedPhotocard.idol,
        grupo: selectedPhotocard.grupo,
        era: selectedPhotocard.era,
        colecao: selectedPhotocard.colecao,
        imagem_url: selectedPhotocard.imagem_url,
        preco: selectedPhotocard.preco,
        status: "disponivel",
      })
      .select()
      .single()

    if (!error && data) {
      onPhotocardAdded(data)
      onOpenChange(false)
      setSelectedPhotocard(null)
      setSearchQuery("")
    }
    setIsLoading(false)
  }

  const handleCriarNovo = async () => {
    if (!titulo || !idol) return

    setIsLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("ceg_photocards")
      .insert({
        ceg_id: cegId,
        titulo,
        idol,
        grupo: grupo || null,
        era: era || null,
        colecao: colecao || null,
        imagem_url: imagemUrl || null,
        preco: preco ? Number.parseFloat(preco) : null,
        status: "disponivel",
      })
      .select()
      .single()

    if (!error && data) {
      onPhotocardAdded(data)
      onOpenChange(false)
      // Limpar campos
      setTitulo("")
      setIdol("")
      setGrupo("")
      setEra("")
      setColecao("")
      setImagemUrl("")
      setPreco("")
    }
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Photocard ao CEG</DialogTitle>
          <DialogDescription>Adicione photocards existentes do catálogo ou crie novos</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="existente" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existente">Do Catálogo</TabsTrigger>
            <TabsTrigger value="novo">Criar Novo</TabsTrigger>
          </TabsList>

          <TabsContent value="existente" className="space-y-4">
            <div>
              <Label htmlFor="search">Buscar Photocard</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome do idol, grupo ou título..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {photocards.length > 0 && (
              <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {photocards.map((pc) => (
                  <div
                    key={pc.id}
                    onClick={() => setSelectedPhotocard(pc)}
                    className={`border rounded-lg p-2 cursor-pointer transition-all ${
                      selectedPhotocard?.id === pc.id ? "border-pink-500 ring-2 ring-pink-200" : "hover:border-pink-300"
                    }`}
                  >
                    <div className="aspect-[3/4] bg-gray-100 rounded mb-2 relative overflow-hidden">
                      <img
                        src={pc.imagem_url || `/placeholder.svg?height=200&width=150&query=${pc.idol}`}
                        alt={pc.titulo}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-medium line-clamp-1">{pc.titulo}</p>
                    <p className="text-xs text-muted-foreground">{pc.idol}</p>
                    <p className="text-xs font-bold text-pink-600">R$ {pc.preco?.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && photocards.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum photocard encontrado</p>
            )}

            <Button
              onClick={handleAdicionarExistente}
              disabled={!selectedPhotocard || isLoading}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              {isLoading ? "Adicionando..." : "Adicionar ao CEG"}
            </Button>
          </TabsContent>

          <TabsContent value="novo" className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Jisoo Photocard Born Pink"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="idol">Idol *</Label>
                <Input
                  id="idol"
                  value={idol}
                  onChange={(e) => setIdol(e.target.value)}
                  placeholder="Ex: Jisoo"
                  required
                />
              </div>

              <div>
                <Label htmlFor="grupo">Grupo</Label>
                <Input
                  id="grupo"
                  value={grupo}
                  onChange={(e) => setGrupo(e.target.value)}
                  placeholder="Ex: BLACKPINK"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="era">Era</Label>
                <Input id="era" value={era} onChange={(e) => setEra(e.target.value)} placeholder="Ex: Born Pink" />
              </div>

              <div>
                <Label htmlFor="colecao">Coleção</Label>
                <Input
                  id="colecao"
                  value={colecao}
                  onChange={(e) => setColecao(e.target.value)}
                  placeholder="Ex: THE CHASE"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="imagemUrl">URL da Imagem</Label>
              <Input
                id="imagemUrl"
                value={imagemUrl}
                onChange={(e) => setImagemUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="preco">Preço (R$)</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <Button
              onClick={handleCriarNovo}
              disabled={!titulo || !idol || isLoading}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              {isLoading ? "Criando..." : "Criar e Adicionar ao CEG"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
