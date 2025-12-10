import { Navbar } from "@/components/navbar"
import { redirect } from "next/navigation"
import { NovoCEGForm } from "@/components/novo-ceg-form"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export default async function NovoCEGPage() {
  // Get session from Better Auth
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect("/auth/login")
  }

  // Get user profile
  const [userProfile] = await db.select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (!userProfile) {
    redirect("/auth/login")
  }

  // Map user types from the old system to the new one
  const isVendedorCEG = userProfile.userType === "seller" || 
                       userProfile.userType === "admin" || 
                       userProfile.userType === "vendedor_ceg"

  if (!isVendedorCEG) {
    redirect("/cegs")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Criar Novo CEG</h1>
            <p className="text-muted-foreground">Crie uma nova compra em grupo para seus clientes</p>
          </div>

          <NovoCEGForm userId={session.user.id} />
        </div>
      </div>
    </div>
  )
}
