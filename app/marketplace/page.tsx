import { Navbar } from "@/components/navbar"
import { PhotocardGrid } from "@/components/photocard-grid"
import { MarketplaceFilters } from "@/components/marketplace-filters"
import { Suspense } from "react"

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Buscar Photocards</h1>
          <p className="text-muted-foreground">Encontre photocards raros dos seus idols favoritos</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar com filtros */}
          <aside className="lg:w-64 flex-shrink-0">
            <Suspense fallback={<div>Carregando filtros...</div>}>
              <MarketplaceFilters />
            </Suspense>
          </aside>

          {/* Grid de photocards */}
          <main className="flex-1">
            <Suspense fallback={<div>Carregando photocards...</div>}>
              <PhotocardGrid />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}
