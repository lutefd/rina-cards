import { Navbar } from "@/components/navbar"
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GerenciadorPedidos } from "@/components/gerenciador-pedidos"
import { GerenciadorPhotocardsCEG } from "@/components/gerenciador-photocards-ceg"
import Link from "next/link"
import { ArrowLeft, Edit } from "lucide-react"

export default async function GerenciarCEGPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: ceg, error } = await supabase.from("cegs").select("*").eq("id", id).single()

  if (error || !ceg) {
    notFound()
  }

  // Verificar se é o vendedor do CEG
  if (ceg.vendedor_id !== user.id) {
    redirect("/cegs")
  }

  // Buscar pedidos do CEG
  const { data: pedidos } = await supabase
    .from("ceg_pedidos")
    .select(`
      *,
      comprador:profiles!ceg_pedidos_comprador_id_fkey(nome_completo, email, telefone),
      photocard:photocards(titulo, idol, grupo)
    `)
    .eq("ceg_id", id)
    .order("created_at", { ascending: false })

  const { data: cegPhotocards } = await supabase
    .from("ceg_photocards")
    .select(`
      *,
      solicitante:profiles!ceg_photocards_solicitado_por_fkey(nome_completo, email)
    `)
    .eq("ceg_id", id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/cegs">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para CEGs
            </Link>
          </Button>
        </div>

        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{ceg.titulo}</h1>
              {ceg.descricao && <p className="text-muted-foreground">{ceg.descricao}</p>}
            </div>
            <div className="flex gap-2">
              <Badge
                className={
                  ceg.status === "aberto"
                    ? "bg-green-100 text-green-700"
                    : ceg.status === "fechado"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                }
              >
                {ceg.status === "aberto"
                  ? "Aberto"
                  : ceg.status === "fechado"
                    ? "Fechado"
                    : ceg.status === "processando"
                      ? "Processando"
                      : ceg.status === "finalizado"
                        ? "Finalizado"
                        : "Cancelado"}
              </Badge>
              <Button asChild size="sm" variant="outline">
                <Link href={`/cegs/${id}/editar`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{ceg.tipo === "nacional" ? "Nacional" : "Internacional"}</p>
            </div>
            {ceg.marketplace_origem && (
              <div>
                <p className="text-sm text-muted-foreground">Marketplace</p>
                <p className="font-medium">{ceg.marketplace_origem}</p>
              </div>
            )}
            {ceg.data_fechamento && (
              <div>
                <p className="text-sm text-muted-foreground">Data de Fechamento</p>
                <p className="font-medium">{new Date(ceg.data_fechamento).toLocaleDateString("pt-BR")}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Total de Pedidos</p>
              <p className="font-medium">{pedidos?.length || 0}</p>
            </div>
          </div>
        </div>

        <GerenciadorPhotocardsCEG cegId={id} photocards={cegPhotocards || []} />

        <GerenciadorPedidos cegId={id} pedidos={pedidos || []} />
      </div>
    </div>
  )
}
