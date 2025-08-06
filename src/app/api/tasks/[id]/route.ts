import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const updateTaskSchema = z.object({
  title: z.string().min(1, "Le titre est requis").optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "ARCHIVED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().optional(),
  projectId: z.string().optional(),
  assignedTo: z.string().optional(),
  parent_id: z.string().optional(),
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/tasks/[id] - Récupérer une tâche spécifique
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const task = await db.task.findUnique({
      where: { id },
      include: {
        project: true,
        assignee: {
          select: { id: true, name: true, email: true }
        },
        creator: {
          select: { id: true, name: true, email: true }
        },
        tags: {
          include: {
            tag: true
          }
        },
        children: true,
        parent: true,
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: "Tâche non trouvée" },
        { status: 404 }
      )
    }

    // Transformer les tags pour correspondre au format attendu par le frontend
    const transformedTask = {
      ...task,
      tags: task.tags.map(tt => tt.tag)
    }

    return NextResponse.json(transformedTask)
  } catch (error) {
    console.error("Error fetching task:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la tâche" },
      { status: 500 }
    )
  }
}

// PUT /api/tasks/[id] - Mettre à jour une tâche
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateTaskSchema.parse(body)

    const existingTask = await db.task.findUnique({
      where: { id }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: "Tâche non trouvée" },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
    if (validatedData.dueDate !== undefined) updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null
    if (validatedData.projectId !== undefined) updateData.projectId = validatedData.projectId
    if (validatedData.assignedTo !== undefined) updateData.assignedTo = validatedData.assignedTo
    if (validatedData.parent_id !== undefined) updateData.parent_id = validatedData.parent_id

    const task = await db.task.update({
      where: { id },
      data: updateData,
      include: {
        project: true,
        assignee: {
          select: { id: true, name: true, email: true }
        },
        creator: {
          select: { id: true, name: true, email: true }
        },
        tags: {
          include: {
            tag: true
          }
        },
        children: true,
        parent: true
      }
    })

    // Transformer les tags pour correspondre au format attendu par le frontend
    const transformedTask = {
      ...task,
      tags: task.tags.map(tt => tt.tag)
    }

    return NextResponse.json(transformedTask)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      )
    }
    
    console.error("Error updating task:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la tâche" },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id] - Supprimer une tâche
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const existingTask = await db.task.findUnique({
      where: { id }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: "Tâche non trouvée" },
        { status: 404 }
      )
    }

    await db.task.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Tâche supprimée avec succès" })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la tâche" },
      { status: 500 }
    )
  }
}