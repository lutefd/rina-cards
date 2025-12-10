"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Heart, LayoutGrid, ShoppingBag, UserIcon } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await authClient.getSession()
        // Extract user data from the session
        if (data?.session) {
          // Fetch user profile from API
          const response = await fetch('/api/user/profile')
          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
          } else {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error fetching user session:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    // We don't have a direct subscription method in Better Auth client
    // So we'll poll for session changes periodically
    const interval = setInterval(fetchUser, 60000) // Check every minute

    return () => {
      clearInterval(interval)
    }
  }, [])

  const handleLogout = async () => {
    await authClient.signOut({})
    router.push("/")
  }

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-linear-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">RC</span>
          </div>
          <span className="font-bold text-xl text-pink-600">RinaCards</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/marketplace">
            <Button
              variant={pathname === "/marketplace" ? "default" : "ghost"}
              className={pathname === "/marketplace" ? "bg-pink-600 hover:bg-pink-700" : ""}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Marketplace
            </Button>
          </Link>

          {!loading && user && (
            <>
              <Link href="/minhas-wishlists">
                <Button
                  variant={pathname === "/minhas-wishlists" ? "default" : "ghost"}
                  className={pathname === "/minhas-wishlists" ? "bg-pink-600 hover:bg-pink-700" : ""}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Wishlists
                </Button>
              </Link>

              <Link href="/cegs">
                <Button
                  variant={pathname === "/cegs" ? "default" : "ghost"}
                  className={pathname === "/cegs" ? "bg-pink-600 hover:bg-pink-700" : ""}
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  CEGs
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <UserIcon className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/perfil">Perfil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/meus-pedidos">Meus Pedidos</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {!loading && !user && (
            <Link href="/auth/login">
              <Button className="bg-pink-600 hover:bg-pink-700">Entrar</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
