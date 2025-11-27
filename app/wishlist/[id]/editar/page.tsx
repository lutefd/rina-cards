import { Navbar } from "@/components/navbar"
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { EditarWishlistForm } from "@/components/editar-wishlist-form"

export default async function EditarWishlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: wishlist, error } = await supabase
    .from("wishlists")
    .select("*")
    .eq("id", id)
    .eq("usuario_id", user.id)
    .single()

  if (error || !wishlist) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Editar Wishlist</h1>
        <EditarWishlistForm wishlist={wishlist} />
      </div>
    </div>
  )
}
