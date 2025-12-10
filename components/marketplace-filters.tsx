"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import type { Photocard } from "@/lib/api-client"

interface MarketplaceFiltersProps {
  photocards: Photocard[];
}

export function MarketplaceFilters({ photocards }: MarketplaceFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  
  // Extract unique values from photocards
  const uniqueGroups = Array.from(new Set(photocards.map(pc => pc.group || pc.grupo).filter(Boolean)));
  const uniqueIdols = Array.from(new Set(photocards.map(pc => pc.idol).filter(Boolean)));
  
  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };
  
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateFilters("search", value);
  };

  return (
    <div className="bg-white rounded-lg p-6 space-y-6 sticky top-20">
      {/* Busca */}
      <div>
        <Label htmlFor="search" className="text-sm font-semibold mb-2 block">
          Buscar
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            id="search" 
            placeholder="Nome do idol, grupo..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Filtro por Grupo */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">Filtrar por Grupo</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {uniqueGroups.slice(0, 10).map((group) => (
            <div key={group} className="flex items-center space-x-2">
              <Checkbox 
                id={`group-${group}`}
                checked={searchParams.get("group") === group}
                onCheckedChange={(checked) => updateFilters("group", checked ? (group as string) : "")}
              />
              <label
                htmlFor={`group-${group}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {group}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Filtro por Idol */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">Filtrar por Idol</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {uniqueIdols.slice(0, 10).map((idol) => (
            <div key={idol} className="flex items-center space-x-2">
              <Checkbox 
                id={`idol-${idol}`}
                checked={searchParams.get("idol") === idol}
                onCheckedChange={(checked) => updateFilters("idol", checked ? idol : "")}
              />
              <label
                htmlFor={`idol-${idol}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {idol}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Filtro por Preço */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">Filtrar por Preço</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="price-1" />
            <label htmlFor="price-1" className="text-sm cursor-pointer">
              R$ 0 - R$ 10
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="price-2" />
            <label htmlFor="price-2" className="text-sm cursor-pointer">
              R$ 11 - R$ 20
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="price-3" />
            <label htmlFor="price-3" className="text-sm cursor-pointer">
              R$ 21 - R$ 30
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="price-4" />
            <label htmlFor="price-4" className="text-sm cursor-pointer">
              R$ 31 - R$ 40
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="price-5" />
            <label htmlFor="price-5" className="text-sm cursor-pointer">
              Acima de R$ 40
            </label>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <div className="flex-1">
            <Label htmlFor="min-price" className="text-xs mb-1 block">
              Mín
            </Label>
            <Input id="min-price" type="number" placeholder="0" className="h-8" />
          </div>
          <div className="flex items-end">
            <span className="text-muted-foreground mb-1">até</span>
          </div>
          <div className="flex-1">
            <Label htmlFor="max-price" className="text-xs mb-1 block">
              Máx
            </Label>
            <Input id="max-price" type="number" placeholder="100" className="h-8" />
          </div>
        </div>
      </div>

      {/* Tipo de CEG */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">Tipo de CEG</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="ceg-nacional" />
            <label htmlFor="ceg-nacional" className="text-sm cursor-pointer">
              CEG Nacional
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="ceg-internacional" />
            <label htmlFor="ceg-internacional" className="text-sm cursor-pointer">
              CEG Internacional
            </label>
          </div>
        </div>
      </div>

      {/* Ordenar */}
      <div>
        <Label htmlFor="sort" className="text-sm font-semibold mb-2 block">
          Ordenar por
        </Label>
        <Select 
          defaultValue={searchParams.get("sort") || "recent"}
          onValueChange={(value) => updateFilters("sort", value)}
        >
          <SelectTrigger id="sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais Recentes</SelectItem>
            <SelectItem value="price-asc">Menor Preço</SelectItem>
            <SelectItem value="price-desc">Maior Preço</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
