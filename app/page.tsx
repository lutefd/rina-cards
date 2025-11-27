import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Heart, LayoutGrid, Search } from "lucide-react"
import { Navbar } from "@/components/navbar"

export default function HomePage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-5xl font-bold text-balance">
              Bem-vindo ao <span className="text-pink-600">RinaCards</span>
            </h1>
            <p className="text-xl text-muted-foreground text-balance">
              O marketplace completo para photocards de K-pop com sistema de CEG integrado
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button asChild size="lg" className="bg-pink-600 hover:bg-pink-700">
                <Link href="/marketplace">
                  <Search className="w-5 h-5 mr-2" />
                  Explorar Marketplace
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/cadastro">Criar Conta</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Marketplace Completo</h3>
              <p className="text-muted-foreground">
                Encontre photocards raros dos seus idols favoritos com busca avançada e filtros
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Wishlist Builder</h3>
              <p className="text-muted-foreground">
                Crie wishlists visuais compartilháveis com template em grid personalizável
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <LayoutGrid className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sistema de CEG</h3>
              <p className="text-muted-foreground">
                Gerencie compras em grupo nacionais e internacionais com facilidade
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="container mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-pink-600 mb-2">1000+</div>
                <div className="text-muted-foreground">Photocards</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-pink-600 mb-2">500+</div>
                <div className="text-muted-foreground">Colecionadores</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-pink-600 mb-2">50+</div>
                <div className="text-muted-foreground">CEGs Ativos</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-pink-600 mb-2">100%</div>
                <div className="text-muted-foreground">Satisfação</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
