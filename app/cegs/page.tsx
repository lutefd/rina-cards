import { Navbar } from "@/components/navbar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { CEGCard } from "@/components/ceg-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function CEGsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Buscar perfil do usuário
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const isVendedorCEG = profile?.tipo_usuario === "vendedor_ceg" || profile?.tipo_usuario === "admin"

  // Buscar CEGs do vendedor
  const { data: meusCEGs } = isVendedorCEG
    ? await supabase.from("cegs").select("*").eq("vendedor_id", user.id).order("created_at", { ascending: false })
    : { data: null }

  // Buscar CEGs abertos para participar
  const { data: cegsAbertos } = await supabase
    .from("cegs")
    .select("*, profiles(nome_completo)")
    .eq("status", "aberto")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">CEGs - Compras em Grupo</h1>
            <p className="text-muted-foreground">Gerencie e participe de compras em grupo de photocards</p>
          </div>
          {isVendedorCEG && (
            <Button asChild className="bg-pink-600 hover:bg-pink-700">
              <Link href="/cegs/novo">
                <Plus className="w-4 h-4 mr-2" />
                Novo CEG
              </Link>
            </Button>
          )}
        </div>

        <Tabs defaultValue={isVendedorCEG ? "meus-cegs" : "participar"}>
          <TabsList>
            {isVendedorCEG && <TabsTrigger value="meus-cegs">Meus CEGs</TabsTrigger>}
            <TabsTrigger value="participar">CEGs Disponíveis</TabsTrigger>
            <TabsTrigger value="meus-pedidos">Meus Pedidos</TabsTrigger>
          </TabsList>

          {isVendedorCEG && (
            <TabsContent value="meus-cegs">
              {meusCEGs && meusCEGs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {meusCEGs.map((ceg: any) => (
                    <CEGCard key={ceg.id} ceg={ceg} isOwner={true} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg">
                  <p className="text-muted-foreground mb-4">Você ainda não criou nenhum CEG</p>
                  <Button asChild className="bg-pink-600 hover:bg-pink-700">
                    <Link href="/cegs/novo">Criar Primeiro CEG</Link>
                  </Button>
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="participar">
            {cegsAbertos && cegsAbertos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cegsAbertos.map((ceg: any) => (
                  <CEGCard key={ceg.id} ceg={ceg} isOwner={false} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-muted-foreground">Nenhum CEG aberto no momento</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="meus-pedidos">
            <div className="bg-white rounded-lg p-6">
              <p className="text-muted-foreground">Seus pedidos em CEGs aparecerão aqui</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
