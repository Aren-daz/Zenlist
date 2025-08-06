import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

interface RouteParams {
  params: {
    id: string
  }
}

// DELETE /api/habit-entries/[id] - Supprimer une entrée d'habitude
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const existingEntry = await db.habitEntry.findUnique({
      where: { id: params.id }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Entrée non trouvée" },
        { status: 404 }
      )
    }

    await db.habitEntry.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Entrée supprimée avec succès" })
  } catch (error) {
    console.error("Error deleting habit entry:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'entrée" },
      { status: 500 }
    )
  }
}