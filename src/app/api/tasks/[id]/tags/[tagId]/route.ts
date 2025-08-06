import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

interface RouteParams {
  params: {
    id: string
    tagId: string
  }
}

// DELETE /api/tasks/[id]/tags/[tagId] - Supprimer un tag d'une tâche
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Vérifier si l'association existe
    const existingAssociation = await db.taskTag.findUnique({
      where: {
        taskId_tagId: {
          taskId: params.id,
          tagId: params.tagId
        }
      }
    })

    if (!existingAssociation) {
      return NextResponse.json(
        { error: "Cette association n'existe pas" },
        { status: 404 }
      )
    }

    // Supprimer l'association
    await db.taskTag.delete({
      where: {
        taskId_tagId: {
          taskId: params.id,
          tagId: params.tagId
        }
      }
    })

    return NextResponse.json({ message: "Tag supprimé de la tâche avec succès" })
  } catch (error) {
    console.error("Error removing tag from task:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du tag de la tâche" },
      { status: 500 }
    )
  }
}