import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"

const updateCommentSchema = z.object({
  content: z.string().min(1, "Le contenu est requis"),
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/comments/[id] - Récupérer un commentaire spécifique
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const comment = await db.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        task: {
          select: { id: true, title: true }
        }
      }
    })

    if (!comment) {
      return NextResponse.json(
        { error: "Commentaire non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Error fetching comment:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du commentaire" },
      { status: 500 }
    )
  }
}

// PUT /api/comments/[id] - Mettre à jour un commentaire
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()
    const validatedData = updateCommentSchema.parse(body)

    const existingComment = await db.comment.findUnique({
      where: { id }
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: "Commentaire non trouvé" },
        { status: 404 }
      )
    }

    const comment = await db.comment.update({
      where: { id },
      data: {
        content: validatedData.content,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(comment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      )
    }
    
    console.error("Error updating comment:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du commentaire" },
      { status: 500 }
    )
  }
}

// DELETE /api/comments/[id] - Supprimer un commentaire
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const existingComment = await db.comment.findUnique({
      where: { id }
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: "Commentaire non trouvé" },
        { status: 404 }
      )
    }

    await db.comment.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Commentaire supprimé avec succès" })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du commentaire" },
      { status: 500 }
    )
  }
}