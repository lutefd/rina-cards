"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart } from "lucide-react"
import Image from "next/image"

interface Photocard {
  id: string
  titulo: string
  descricao: string | null
  idol: string
  grupo: string
  era: string
  colecao: string
  imagem_url: string | null
  preco: number | null
  tipo_venda: string | null
  status: string
}

export function PhotocardGrid() {
  const [photocards, setPhotocards] = useState<Photocard[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPhotocards = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("photocards")
        .select("*")
        .eq("status", "disponivel")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching photocards:", error)
      } else {
        setPhotocards(data || [])
      }
      setIsLoading(false)
    }

    fetchPhotocards()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
            <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4" />
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{photocards.length} photocards encontrados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {photocards.map((pc) => (
          <div key={pc.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="relative aspect-[3/4] bg-gray-100">
              <Image
                src={pc.imagem_url || `/placeholder.svg?height=400&width=300&query=${pc.idol} photocard`}
                alt={pc.titulo}
                fill
                className="object-cover"
              />
              <button className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50">
                <Heart className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-lg mb-1">{pc.titulo}</h3>
                <p className="text-sm text-muted-foreground">
                  {pc.grupo} • {pc.colecao}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {pc.colecao}
                </Badge>
                {pc.tipo_venda === "ceg_nacional" && (
                  <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                    CEG Nacional
                  </Badge>
                )}
                {pc.tipo_venda === "ceg_internacional" && (
                  <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
                    CEG Internacional
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-2xl font-bold text-pink-600">R$ {pc.preco?.toFixed(2) || "0.00"}</span>
                <Button size="sm" className="bg-pink-600 hover:bg-pink-700">
                  <Heart className="w-4 h-4 mr-2" />
                  Adicionar à Wishlist
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {photocards.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum photocard encontrado</p>
        </div>
      )}
    </div>
  )
}
