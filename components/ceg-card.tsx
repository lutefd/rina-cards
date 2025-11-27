import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Globe, MapPin, Clock } from "lucide-react"

interface CEGCardProps {
  ceg: {
    id: string
    titulo: string
    descricao: string | null
    tipo: string
    marketplace_origem: string | null
    data_fechamento: string | null
    status: string
    profiles?: {
      nome_completo: string | null
    }
  }
  isOwner: boolean
}

export function CEGCard({ ceg, isOwner }: CEGCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto":
        return "bg-green-100 text-green-700"
      case "fechado":
        return "bg-yellow-100 text-yellow-700"
      case "processando":
        return "bg-blue-100 text-blue-700"
      case "finalizado":
        return "bg-gray-100 text-gray-700"
      case "cancelado":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aberto":
        return "Aberto"
      case "fechado":
        return "Fechado"
      case "processando":
        return "Processando"
      case "finalizado":
        return "Finalizado"
      case "cancelado":
        return "Cancelado"
      default:
        return status
    }
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{ceg.titulo}</h3>
          {ceg.descricao && <p className="text-sm text-muted-foreground line-clamp-2">{ceg.descricao}</p>}
        </div>
        <Badge className={getStatusColor(ceg.status)}>{getStatusLabel(ceg.status)}</Badge>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {ceg.tipo === "nacional" ? <MapPin className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
          <span>{ceg.tipo === "nacional" ? "CEG Nacional" : "CEG Internacional"}</span>
        </div>

        {ceg.marketplace_origem && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Origem: {ceg.marketplace_origem}</span>
          </div>
        )}

        {ceg.data_fechamento && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Fecha em: {new Date(ceg.data_fechamento).toLocaleDateString("pt-BR")}</span>
          </div>
        )}

        {!isOwner && ceg.profiles?.nome_completo && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Vendedor: {ceg.profiles.nome_completo}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {isOwner ? (
          <>
            <Button asChild size="sm" className="flex-1 bg-pink-600 hover:bg-pink-700">
              <Link href={`/cegs/${ceg.id}/gerenciar`}>Gerenciar</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/cegs/${ceg.id}/editar`}>Editar</Link>
            </Button>
          </>
        ) : (
          <Button asChild size="sm" className="flex-1 bg-pink-600 hover:bg-pink-700">
            <Link href={`/cegs/${ceg.id}`}>Ver Detalhes</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
