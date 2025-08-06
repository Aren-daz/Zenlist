import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const addTagSchema = z.object({
  tagId: z.string().min(1, "L'ID du tag est requis"),
})

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/tasks/[id]/tags - Récupérer tous les tags d'une tâche
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const taskTags = await db.taskTag.findMany({
      where: { taskId: params.id },
      include: {
        tag: {
          select: {
            id: true,
            name: true,
            color: true,
            workspace: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: {
        tag: {
          name: "asc"
        }
      }
    })

    return NextResponse.json(taskTags.map(tt => tt.tag))
  } catch (error) {
    console.error("Error fetching task tags:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tags de la tâche" },
      { status: 500 }
    )
  }
}

// POST /api/tasks/[id]/tags - Ajouter un tag à une tâche
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const validatedData = addTagSchema.parse(body)

    // Vérifier si la tâche existe
    const task = await db.task.findUnique({
      where: { id: params.id }
    })

    if (!task) {
      return NextResponse.json(
        { error: "Tâche non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier si le tag existe
    const tag = await db.tag.findUnique({
      where: { id: validatedData.tagId }
    })

    if (!tag) {
      return NextResponse.json(
        { error: "Tag non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier si l'association existe déjà
    const existingAssociation = await db.taskTag.findUnique({
      where: {
        taskId_tagId: {
          taskId: params.id,
          tagId: validatedData.tagId
        }
      }
    })

    if (existingAssociation) {
      return NextResponse.json(
        { error: "Ce tag est déjà associé à la tâche" },
        { status: 400 }
      )
    }

    // Créer l'association
    const taskTag = await db.taskTag.create({
      data: {
        taskId: params.id,
        tagId: validatedData.tagId
      },
      include: {
        tag: {
          select: {
            id: true,
            name: true,
            color: true,
            workspace: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    return NextResponse.json(taskTag.tag, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      )
    }
    
    console.error("Error adding tag to task:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du tag à la tâche" },
      { status: 500 }
    )
  }
}