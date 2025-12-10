"use client"

import { Navbar } from "@/components/navbar"
import { PhotocardGrid } from "@/components/photocard-grid"
import { MarketplaceFilters } from "@/components/marketplace-filters"
import { useState, useEffect } from "react"
import { getAvailablePhotocards } from "@/lib/api-client"
import type { Photocard } from "@/lib/api-client"
import { useSearchParams } from "next/navigation"

export default function MarketplacePage() {
  const [photocards, setPhotocards] = useState<Photocard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getAvailablePhotocards();
        setPhotocards(data || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  
  // Filter photocards based on search params
  const filteredPhotocards = photocards.filter(pc => {
    const search = searchParams.get("search")?.toLowerCase();
    const group = searchParams.get("group");
    const idol = searchParams.get("idol");
    
    if (search && !(
      pc.idol?.toLowerCase().includes(search) ||
      (pc.group || pc.grupo)?.toLowerCase().includes(search) ||
      (pc.title || pc.titulo)?.toLowerCase().includes(search)
    )) return false;
    
    if (group && (pc.group || pc.grupo) !== group) return false;
    if (idol && pc.idol !== idol) return false;
    
    return true;
  });
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
            {isLoading ? (
              <div>Carregando filtros...</div>
            ) : (
              <MarketplaceFilters photocards={photocards} />
            )}
          </aside>

          {/* Grid de photocards */}
          <main className="flex-1">
            {isLoading ? (
              <div>Carregando photocards...</div>
            ) : (
              <PhotocardGrid photocards={filteredPhotocards} />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
