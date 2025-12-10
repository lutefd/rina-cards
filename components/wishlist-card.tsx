import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Lock } from "lucide-react"

interface WishlistCardProps {
  wishlist: {
    id: string
    nome?: string // Legacy field
    descricao?: string | null // Legacy field
    visibilidade?: string // Legacy field
    title?: string
    description?: string | null
    isPublic?: boolean
    wishlist_items?: { count: number }[] // Legacy field
    itemCount?: number
    created_at?: string // Legacy field
    createdAt?: Date | string
  }
}

export function WishlistCard({ wishlist }: WishlistCardProps) {
  // Support both legacy and new field names
  const title = wishlist.title || wishlist.nome || "";
  const description = wishlist.description || wishlist.descricao || null;
  const isPublic = wishlist.isPublic !== undefined ? wishlist.isPublic : wishlist.visibilidade === "publica";
  const itemCount = wishlist.itemCount || wishlist.wishlist_items?.[0]?.count || 0;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{title}</h3>
          {description && <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>}
        </div>
        <Badge variant={isPublic ? "default" : "secondary"}>
          {isPublic ? (
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
