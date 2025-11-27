import { Navbar } from "@/components/navbar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NovoCEGForm } from "@/components/novo-ceg-form"

export default async function NovoCEGPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const isVendedorCEG = profile?.tipo_usuario === "vendedor_ceg" || profile?.tipo_usuario === "admin"

  if (!isVendedorCEG) {
    redirect("/cegs")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Novo CEG</h1>
            <p className="text-muted-foreground">Crie uma nova compra em grupo para seus clientes</p>
          </div>

          <NovoCEGForm userId={user.id} />
        </div>
      </div>
    </div>
  )
}
