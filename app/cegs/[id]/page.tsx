import { Navbar } from "@/components/navbar"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Globe, MapPin, Clock, ShoppingCart } from "lucide-react"
import { FazerPedidoDialog } from "@/components/fazer-pedido-dialog"
import { SolicitarPhotocardDialog } from "@/components/solicitar-photocard-dialog"

export default async function CEGDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: ceg, error } = await supabase
    .from("cegs")
    .select("*, profiles(nome_completo, email)")
    .eq("id", id)
    .single()

  if (error || !ceg) {
    notFound()
  }

  const { data: photocards } = await supabase
    .from("ceg_photocards")
    .select("*")
    .eq("ceg_id", id)
    .in("status", ["disponivel", "aprovado"])
    .order("created_at", { ascending: false })

  // Se for o vendedor, verificar se já fez pedido
  let jaPediu = false
  if (user) {
    const { data: pedidoExistente } = await supabase
      .from("ceg_pedidos")
      .select("id")
      .eq("ceg_id", id)
      .eq("comprador_id", user.id)
      .limit(1)

    jaPediu = (pedidoExistente?.length || 0) > 0
  }

  const isVendedor = user?.id === ceg.vendedor_id

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

        {/* Cabeçalho do CEG */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{ceg.titulo}</h1>
              {ceg.descricao && <p className="text-muted-foreground">{ceg.descricao}</p>}
            </div>
            <Badge
              className={
                ceg.status === "aberto"
                  ? "bg-green-100 text-green-700"
                  : ceg.status === "fechado"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
              }
            >
              {ceg.status === "aberto" ? "Aberto para Pedidos" : "Fechado"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              {ceg.tipo === "nacional" ? (
                <MapPin className="w-5 h-5 text-pink-600" />
              ) : (
                <Globe className="w-5 h-5 text-pink-600" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">{ceg.tipo === "nacional" ? "CEG Nacional" : "CEG Internacional"}</p>
              </div>
            </div>

            {ceg.marketplace_origem && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-pink-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Marketplace</p>
                  <p className="font-medium">{ceg.marketplace_origem}</p>
                </div>
              </div>
            )}

            {ceg.data_fechamento && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-pink-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha em</p>
                  <p className="font-medium">{new Date(ceg.data_fechamento).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <p className="text-sm text-muted-foreground">
              Gerenciado por: <span className="font-medium text-foreground">{ceg.profiles?.nome_completo}</span>
            </p>
          </div>

          {!user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <Link href="/auth/login" className="font-semibold underline">
                  Faça login
                </Link>{" "}
                para fazer pedidos neste CEG
              </p>
            </div>
          )}

          {user && !isVendedor && ceg.status === "aberto" && !jaPediu && (
            <FazerPedidoDialog cegId={id} photocards={photocards || []} />
          )}

          {jaPediu && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 font-medium">Você já fez um pedido neste CEG!</p>
              <p className="text-xs text-green-700 mt-1">Acompanhe o status em "Meus Pedidos"</p>
            </div>
          )}

          {isVendedor && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800 font-medium">Você é o vendedor deste CEG</p>
              <Button asChild className="mt-2 bg-pink-600 hover:bg-pink-700">
                <Link href={`/cegs/${id}/gerenciar`}>Gerenciar Pedidos</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Lista de Photocards Disponíveis */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Photocards Disponíveis</h2>
          <p className="text-sm text-muted-foreground mb-6">Photocards que podem ser encomendados através deste CEG</p>

          {photocards && photocards.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photocards.map((pc: any) => (
                <div key={pc.id} className="border rounded-lg p-3 hover:border-pink-300 transition-colors">
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-2 relative overflow-hidden">
                    <img
                      src={pc.imagem_url || `/placeholder.svg?height=300&width=225&query=${pc.idol} photocard`}
                      alt={pc.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-medium text-sm line-clamp-1">{pc.titulo}</h3>
                  <p className="text-xs text-muted-foreground">{pc.idol}</p>
                  <p className="text-sm font-bold text-pink-600 mt-1">R$ {pc.preco?.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum photocard disponível no momento</p>
              <p className="text-sm mt-2">O vendedor ainda não adicionou photocards a este CEG</p>
            </div>
          )}

          {user && !isVendedor && ceg.status === "aberto" && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Não encontrou o photocard que procura? Solicite ao vendedor!
              </p>
              <SolicitarPhotocardDialog cegId={id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
