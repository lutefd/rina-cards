import { Navbar } from "@/components/navbar"
import { redirect } from "next/navigation"
import { NovaWishlistForm } from "@/components/nova-wishlist-form"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export default async function NovaWishlistPage() {
  // Get session from Better Auth
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
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

          <NovaWishlistForm />
        </div>
      </div>
    </div>
  )
}
