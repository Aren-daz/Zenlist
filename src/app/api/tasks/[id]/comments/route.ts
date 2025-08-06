import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const createCommentSchema = z.object({
  content: z.string().min(1, "Le contenu est requis"),
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/tasks/[id]/comments - Récupérer tous les commentaires d'une tâche
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Vérifier si la tâche existe
    const task = await db.task.findUnique({
      where: { id }
    })

    if (!task) {
      return NextResponse.json(
        { error: "Tâche non trouvée" },
        { status: 404 }
      )
    }

    const comments = await db.comment.findMany({
      where: { taskId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des commentaires" },
      { status: 500 }
    )
  }
}

// POST /api/tasks/[id]/comments - Créer un nouveau commentaire
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)

    // Vérifier si la tâche existe
    const task = await db.task.findUnique({
      where: { id }
    })

    if (!task) {
      return NextResponse.json(
        { error: "Tâche non trouvée" },
        { status: 404 }
      )
    }

    const comment = await db.comment.create({
      data: {
        content: validatedData.content,
        taskId: id,
        userId: "user-1", // TODO: Récupérer l'ID utilisateur depuis l'authentification
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      )
    }
    
    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du commentaire" },
      { status: 500 }
    )
  }
}