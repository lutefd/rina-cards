import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Lock } from "lucide-react"

interface WishlistCardProps {
  wishlist: {
    id: string
    nome: string
    descricao: string | null
    visibilidade: string
    wishlist_items: { count: number }[]
    created_at: string
  }
}

export function WishlistCard({ wishlist }: WishlistCardProps) {
  const itemCount = wishlist.wishlist_items?.[0]?.count || 0

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{wishlist.nome}</h3>
          {wishlist.descricao && <p className="text-sm text-muted-foreground line-clamp-2">{wishlist.descricao}</p>}
        </div>
        <Badge variant={wishlist.visibilidade === "publica" ? "default" : "secondary"}>
          {wishlist.visibilidade === "publica" ? (
            <>
              <Eye className="w-3 h-3 mr-1" /> Pública
            </>
          ) : (
            <>
              <Lock className="w-3 h-3 mr-1" /> Privada
            </>
          )}
        </Badge>
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {itemCount} {itemCount === 1 ? "item" : "itens"}
        </p>
      </div>

      <div className="flex gap-2">
        <Button asChild size="sm" className="flex-1 bg-pink-600 hover:bg-pink-700">
          <Link href={`/wishlist/${wishlist.id}`}>Ver Wishlist</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/wishlist/${wishlist.id}/editar`}>Editar</Link>
        </Button>
      </div>
    </div>
  )
}
