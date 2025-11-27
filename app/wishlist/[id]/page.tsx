import { Navbar } from "@/components/navbar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { WishlistBuilder } from "@/components/wishlist-builder"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Lock, Share2, Edit } from "lucide-react"
import Link from "next/link"

export default async function WishlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: wishlist, error } = await supabase.from("wishlists").select("*").eq("id", id).single()

  if (error || !wishlist) {
    notFound()
  }

  // Verificar se o usuário tem permissão para ver essa wishlist
  if (wishlist.visibilidade === "privada" && wishlist.usuario_id !== user?.id) {
    redirect("/minhas-wishlists")
  }

  const { data: items } = await supabase
    .from("wishlist_items")
    .select("*")
    .eq("wishlist_id", id)
    .order("posicao", { ascending: true })

  const isOwner = user?.id === wishlist.usuario_id

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{wishlist.nome}</h1>
              {wishlist.descricao && <p className="text-muted-foreground">{wishlist.descricao}</p>}
            </div>
            <div className="flex gap-2">
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
          </div>

          {isOwner && (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/wishlist/${id}/editar`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Info
                </Link>
              </Button>
              <Button variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          )}
        </div>

        <WishlistBuilder wishlistId={id} items={items || []} isOwner={isOwner} />
      </div>
    </div>
  )
}
