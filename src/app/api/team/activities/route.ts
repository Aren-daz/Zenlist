import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

// Placeholder d'activités d'équipe
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // À implémenter: agréger les dernières activités (création/maj tâches, commentaires, projets)
    // Pour l'instant, retourner une liste vide pour ne pas casser l'UI
    return NextResponse.json([])
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


