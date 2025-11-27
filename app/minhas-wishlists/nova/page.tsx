import { Navbar } from "@/components/navbar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NovaWishlistForm } from "@/components/nova-wishlist-form"

export default async function NovaWishlistPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Nova Wishlist</h1>
            <p className="text-muted-foreground">Crie uma nova lista de desejos para seus photocards</p>
          </div>

          <NovaWishlistForm userId={user.id} />
        </div>
      </div>
    </div>
  )
}
