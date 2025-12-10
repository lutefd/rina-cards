"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { addWishlistItem, searchPhotocards } from "@/lib/api-client"
import { toast } from "sonner"
import { Search, Loader2, X } from "lucide-react"

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wishlistId: string
  nextPosition: number
  onItemAdded: (item: any) => void
}

export function AddItemDialog({ open, onOpenChange, wishlistId, nextPosition, onItemAdded }: AddItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("catalog")

  // Manual entry fields
  const [idol, setIdol] = useState("")
  const [grupo, setGrupo] = useState("")
  const [era, setEra] = useState("")
  const [colecao, setColecao] = useState("")
  const [imagemUrl, setImagemUrl] = useState("")
  const [status, setStatus] = useState("desejado")
  const [notas, setNotas] = useState("")

  // Catalog search
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPhotocard, setSelectedPhotocard] = useState<any | null>(null)

  // Search photocards when query changes
  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const results = await searchPhotocards(searchQuery)
        setSearchResults(results)
      } catch (error) {
        console.error("Error searching photocards:", error)
      } finally {
        setIsSearching(false)
      }
    }

    const debounce = setTimeout(search, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  const handleSelectPhotocard = (photocard: any) => {
    setSelectedPhotocard(photocard)
  }

  const handleSubmitFromCatalog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPhotocard || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const newItem = await addWishlistItem({
        wishlistId,
        photocard: selectedPhotocard.titulo,
        idol: selectedPhotocard.idol,
        group: selectedPhotocard.grupo,
        album: selectedPhotocard.era,
        version: selectedPhotocard.colecao,
        imageUrl: selectedPhotocard.imagem_url,
        priority: nextPosition,
        status,
        notes: notas,
        photocardsId: selectedPhotocard.id
      })
      
      const legacyItem = {
        ...newItem,
        grupo: newItem.group,
        era: newItem.album,
        colecao: newItem.version,
        imagem_url: newItem.imageUrl,
        posicao: newItem.priority,
        notas: newItem.notes
      }
      
      toast.success("Item adicionado com sucesso")
      onItemAdded(legacyItem)
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error adding item:", error)
      setError("Erro ao adicionar item. Tente novamente.")
      toast.error("Erro ao adicionar item")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    
    setIsLoading(true)
    setError(null)

    try {
      // Add item using API client
      const newItem = await addWishlistItem({
        wishlistId,
        photocard: idol, // Using idol as the photocard name
        idol,
        group: grupo,
        album: era,
        version: colecao,
        imageUrl: imagemUrl,
        priority: nextPosition,
        status,
        notes: notas
      })
      
      // Convert to legacy format for compatibility
      const legacyItem = {
        ...newItem,
        grupo: newItem.group,
        era: newItem.album,
        colecao: newItem.version,
        imagem_url: newItem.imageUrl,
        posicao: newItem.priority,
        notas: newItem.notes
      }
      
      toast.success("Item adicionado com sucesso")
      onItemAdded(legacyItem)
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error adding item:", error)
      setError("Erro ao adicionar item. Tente novamente.")
      toast.error("Erro ao adicionar item")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setIdol("")
    setGrupo("")
    setEra("")
    setColecao("")
    setImagemUrl("")
    setStatus("desejado")
    setNotas("")
    setSearchQuery("")
    setSearchResults([])
    setSelectedPhotocard(null)
    setActiveTab("catalog")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Photocard</DialogTitle>
          <DialogDescription>Adicione um novo photocard à sua wishlist</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="catalog">Do Catálogo</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>

          {/* From Catalog Tab */}
          <TabsContent value="catalog" className="space-y-4">
            <form onSubmit={handleSubmitFromCatalog} className="space-y-4">
              {/* Search */}
              <div>
                <Label htmlFor="search">Buscar Photocard</Label>
                <div className="relative">
                  {isSearching ? (
                    <Loader2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground animate-spin" />
                  ) : (
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  )}
                  <Input
                    id="search"
                    placeholder="Nome do idol, grupo ou título..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Digite pelo menos 2 caracteres para buscar
                </p>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto border rounded-lg p-3">
                  {searchResults.map((pc) => (
                    <div
                      key={pc.id}
                      onClick={() => handleSelectPhotocard(pc)}
                      className={`border rounded-lg p-2 cursor-pointer transition-all ${
                        selectedPhotocard?.id === pc.id
                          ? "border-pink-500 ring-2 ring-pink-200 bg-pink-50"
                          : "hover:border-pink-300"
                      }`}
                    >
                      <div className="aspect-3/4 bg-gray-100 rounded mb-2 relative overflow-hidden">
                        <img
                          src={pc.imagem_url || `/placeholder.svg?height=200&width=150&query=${pc.idol}`}
                          alt={pc.titulo}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs font-medium line-clamp-1">{pc.titulo}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{pc.idol}</p>
                      {pc.grupo && <p className="text-xs text-muted-foreground line-clamp-1">{pc.grupo}</p>}
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !isSearching && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum photocard encontrado
                </p>
              )}

              {/* Selected Photocard Info */}
              {selectedPhotocard && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <p className="text-sm font-semibold mb-2">Photocard Selecionado:</p>
                  <div className="flex gap-3">
                    <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden shrink-0">
                      <img
                        src={selectedPhotocard.imagem_url || `/placeholder.svg?height=80&width=60`}
                        alt={selectedPhotocard.titulo}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{selectedPhotocard.titulo}</p>
                      <p className="text-xs text-muted-foreground">{selectedPhotocard.idol}</p>
                      {selectedPhotocard.grupo && (
                        <p className="text-xs text-muted-foreground">{selectedPhotocard.grupo}</p>
                      )}
                      {selectedPhotocard.era && (
                        <p className="text-xs text-muted-foreground">{selectedPhotocard.era}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Status and Notes - Only editable fields */}
              <div>
                <Label htmlFor="catalog-status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="catalog-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desejado">Desejado</SelectItem>
                    <SelectItem value="prioridade">Prioridade</SelectItem>
                    <SelectItem value="otw">A Caminho (OTW)</SelectItem>
                    <SelectItem value="comprado">Comprado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="catalog-notas">Notas</Label>
                <Textarea
                  id="catalog-notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Observações adicionais"
                  rows={2}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || !selectedPhotocard} 
                  className="flex-1 bg-pink-600 hover:bg-pink-700"
                >
                  {isLoading ? "Adicionando..." : "Adicionar"}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Manual Entry Tab */}
          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={handleSubmitManual} className="space-y-4">
          <div>
            <Label htmlFor="idol">Idol *</Label>
            <Input
              id="idol"
              value={idol}
              onChange={(e) => setIdol(e.target.value)}
              placeholder="Nome do idol"
              required
            />
          </div>

          <div>
            <Label htmlFor="grupo">Grupo</Label>
            <Input id="grupo" value={grupo} onChange={(e) => setGrupo(e.target.value)} placeholder="Nome do grupo" />
          </div>

          <div>
            <Label htmlFor="era">Era</Label>
            <Input
              id="era"
              value={era}
              onChange={(e) => setEra(e.target.value)}
              placeholder="Ex: Born Pink, The Album"
            />
          </div>

          <div>
            <Label htmlFor="colecao">Coleção</Label>
            <Input
              id="colecao"
              value={colecao}
              onChange={(e) => setColecao(e.target.value)}
              placeholder="Ex: THE CHASE, FOCUS, ERA"
            />
          </div>

          <div>
            <Label htmlFor="imagem">URL da Imagem</Label>
            <Input
              id="imagem"
              value={imagemUrl}
              onChange={(e) => setImagemUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

              <div>
                <Label htmlFor="manual-status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="manual-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desejado">Desejado</SelectItem>
                    <SelectItem value="prioridade">Prioridade</SelectItem>
                    <SelectItem value="otw">A Caminho (OTW)</SelectItem>
                    <SelectItem value="comprado">Comprado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="manual-notas">Notas</Label>
                <Textarea
                  id="manual-notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Observações adicionais"
                  rows={2}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 bg-pink-600 hover:bg-pink-700">
                  {isLoading ? "Adicionando..." : "Adicionar"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
