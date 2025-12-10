"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { authClient, customAuth } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [profile, setProfile] = useState<{
    id: string;
    name: string;
    email: string;
    userType: string;
    image?: string | null;
  } | null>(null)
  
  const [name, setName] = useState("")
  const [userType, setUserType] = useState<string>("customer")
  
  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        const { data } = await authClient.getSession()
        
        if (!data?.session) {
          router.push("/auth/login")
          return
        }
        
        const response = await fetch('/api/user/profile')
        if (!response.ok) {
          throw new Error('Failed to fetch profile')
        }
        
        const profileData = await response.json()
        setProfile(profileData)
        setName(profileData.name || '')
        setUserType(profileData.userType || 'customer')
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProfile()
  }, [router])
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      const { success, error } = await customAuth.updateProfile({
        name,
        userType,
      })
      
      if (!success) {
        throw new Error(error || 'Failed to update profile')
      }
      
      setSuccess("Perfil atualizado com sucesso!")
      
      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          name,
          userType,
        })
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Ocorreu um erro")
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleSignOut = async () => {
    try {
      await authClient.signOut({})
      router.push("/auth/login")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to sign out")
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Meu Perfil</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Atualize suas informações de perfil</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profile?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">O email não pode ser alterado</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="userType">Tipo de Usuário</Label>
                    <Select value={userType} onValueChange={setUserType}>
                      <SelectTrigger id="userType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Comprador</SelectItem>
                        <SelectItem value="seller">Vendedor</SelectItem>
                        {profile?.userType === 'admin' && (
                          <SelectItem value="admin">Administrador</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {error && <p className="text-sm text-red-500">{error}</p>}
                {success && <p className="text-sm text-green-500">{success}</p>}
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    type="submit" 
                    className="bg-pink-600 hover:bg-pink-700" 
                    disabled={isSaving}
                  >
                    {isSaving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleSignOut}
                  >
                    Sair
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
