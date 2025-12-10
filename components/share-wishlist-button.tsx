"use client"

import { Button } from "@/components/ui/button"
import { Share2, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ShareWishlistButtonProps {
  wishlistId: string
}

export function ShareWishlistButton({ wishlistId }: ShareWishlistButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link copiado para a área de transferência!")
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
      toast.error("Erro ao copiar link")
    }
  }

  return (
    <Button variant="outline" onClick={handleShare}>
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Copiado!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </>
      )}
    </Button>
  )
}
