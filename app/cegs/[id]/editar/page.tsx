import { Navbar } from "@/components/navbar"
import { redirect, notFound } from "next/navigation"
import { EditarCEGForm } from "@/components/editar-ceg-form"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { groupPurchases } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export default async function EditarCEGPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Get session from Better Auth
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect("/auth/login")
  }

  // Get the group purchase
  const [ceg] = await db
    .select()
    .from(groupPurchases)
    .where(
      and(
        eq(groupPurchases.id, id),
        eq(groupPurchases.sellerId, session.user.id)
      )
    )
    .limit(1)

  if (!ceg) {
    notFound()
  }
  
  // Convert to the format expected by the EditarCEGForm component
  const cegFormatted = {
    id: ceg.id,
    titulo: ceg.title,
    descricao: ceg.description,
    tipo: ceg.type,
    marketplace_origem: ceg.marketplaceSource,
    data_fechamento: ceg.closingDate ? ceg.closingDate.toISOString() : null,
    taxa_adicional: ceg.additionalFee || 0,
    informacoes_envio: ceg.shippingInfo,
    status: ceg.status
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Editar CEG</h1>
        <EditarCEGForm ceg={cegFormatted} />
      </div>
    </div>
  )
}
