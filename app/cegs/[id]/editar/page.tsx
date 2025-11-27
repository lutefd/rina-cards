import { Navbar } from "@/components/navbar"
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { EditarCEGForm } from "@/components/editar-ceg-form"

export default async function EditarCEGPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: ceg, error } = await supabase.from("cegs").select("*").eq("id", id).eq("vendedor_id", user.id).single()

  if (error || !ceg) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Editar CEG</h1>
        <EditarCEGForm ceg={ceg} />
      </div>
    </div>
  )
}
