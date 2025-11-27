"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface WishlistItem {
  id: string
  idol: string
  grupo: string | null
  era: string | null
  colecao: string | null
  imagem_url: string | null
  status: string
  notas: string | null
}

interface WishlistListViewProps {
  items: WishlistItem[]
  isOwner: boolean
}

export function WishlistListView({ items, isOwner }: WishlistListViewProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "comprado":
        return "default"
      case "otw":
        return "secondary"
      case "prioridade":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "desejado":
        return "Desejado"
      case "comprado":
        return "Comprado"
      case "otw":
        return "A Caminho"
      case "prioridade":
        return "Prioridade"
      default:
        return status
    }
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Imagem</TableHead>
            <TableHead>Idol</TableHead>
            <TableHead>Grupo</TableHead>
            <TableHead>Era</TableHead>
            <TableHead>Coleção</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="w-12 h-16 relative bg-gray-100 rounded overflow-hidden">
                  {item.imagem_url ? (
                    <Image src={item.imagem_url || "/placeholder.svg"} alt={item.idol} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      N/A
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{item.idol}</TableCell>
              <TableCell>{item.grupo || "-"}</TableCell>
              <TableCell>{item.era || "-"}</TableCell>
              <TableCell>{item.colecao ? <Badge variant="outline">{item.colecao}</Badge> : "-"}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(item.status) as any}>{getStatusLabel(item.status)}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                {item.notas || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum item na wishlist ainda</p>
        </div>
      )}
    </div>
  )
}
