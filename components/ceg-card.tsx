import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Globe, MapPin, Clock } from "lucide-react"

interface CEGCardProps {
  ceg: {
    id: string
    title: string
    description: string | null
    type: string
    marketplaceSource: string | null
    closingDate: string | Date | null
    status: string
    sellerName?: string | null
  }
  isOwner: boolean
}

export function CEGCard({ ceg, isOwner }: CEGCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-700"
      case "closed":
        return "bg-yellow-100 text-yellow-700"
      case "processing":
        return "bg-blue-100 text-blue-700"
      case "finished":
        return "bg-gray-100 text-gray-700"
      case "canceled":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Aberto"
      case "closed":
        return "Fechado"
      case "processing":
        return "Processando"
      case "finished":
        return "Finalizado"
      case "canceled":
        return "Cancelado"
      default:
        return status
    }
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{ceg.title}</h3>
          {ceg.description && <p className="text-sm text-muted-foreground line-clamp-2">{ceg.description}</p>}
        </div>
        <Badge className={getStatusColor(ceg.status)}>{getStatusLabel(ceg.status)}</Badge>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {ceg.type === "national" ? <MapPin className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
          <span>{ceg.type === "national" ? "CEG Nacional" : "CEG Internacional"}</span>
        </div>

        {ceg.marketplaceSource && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Origem: {ceg.marketplaceSource}</span>
          </div>
        )}

        {ceg.closingDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Fecha em: {new Date(ceg.closingDate).toLocaleDateString("pt-BR")}</span>
          </div>
        )}

        {!isOwner && ceg.sellerName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Vendedor: {ceg.sellerName}</span>
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
