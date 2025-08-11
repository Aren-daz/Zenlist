"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function MobileAuthCTA() {
  const { status } = useSession()
  if (status !== "unauthenticated") return null

  return (
    <div className="ml-auto flex items-center gap-2">
      <Button asChild size="sm" className="px-3 py-1">
        <Link href="/auth/signin">Se connecter</Link>
      </Button>
      <Button asChild variant="outline" size="sm" className="px-3 py-1">
        <Link href="/auth/signup">Créer un compte</Link>
      </Button>
    </div>
  )
}


