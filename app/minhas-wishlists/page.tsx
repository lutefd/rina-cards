import { Navbar } from "@/components/navbar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { WishlistCard } from "@/components/wishlist-card"

export default async function MinhasWishlistsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: wishlists } = await supabase
    .from("wishlists")
    .select("*, wishlist_items(count)")
    .eq("usuario_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Minhas Wishlists</h1>
            <p className="text-muted-foreground">Gerencie suas listas de desejos de photocards</p>
          </div>
          <Button asChild className="bg-pink-600 hover:bg-pink-700">
            <Link href="/minhas-wishlists/nova">
              <Plus className="w-4 h-4 mr-2" />
              Nova Wishlist
            </Link>
          </Button>
        </div>

        {wishlists && wishlists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlists.map((wishlist: any) => (
              <WishlistCard key={wishlist.id} wishlist={wishlist} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-muted-foreground mb-4">Você ainda não criou nenhuma wishlist</p>
            <Button asChild className="bg-pink-600 hover:bg-pink-700">
              <Link href="/minhas-wishlists/nova">Criar Primeira Wishlist</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
