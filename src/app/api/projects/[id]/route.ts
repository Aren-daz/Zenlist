import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const updateProjectSchema = z.object({
  name: z.string().min(1, "Le nom est requis").optional(),
  description: z.string().optional(),
  color: z.string().optional(),
})

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/projects/[id] - Récupérer un projet spécifique
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const project = await db.project.findUnique({
      where: { id: params.id },
      include: {
        workspace: {
          select: { id: true, name: true }
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true }
            },
            creator: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        _count: {
          select: { tasks: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      )
    }

    // Calculer les statistiques
    const tasks = project.tasks
    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === "TODO").length,
      inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
      done: tasks.filter(t => t.status === "DONE").length,
      archived: tasks.filter(t => t.status === "ARCHIVED").length,
    }

    const projectWithStats = {
      ...project,
      stats
    }

    return NextResponse.json(projectWithStats)
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du projet" },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id] - Mettre à jour un projet
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const validatedData = updateProjectSchema.parse(body)

    const existingProject = await db.project.findUnique({
      where: { id: params.id }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.color !== undefined) updateData.color = validatedData.color

    const project = await db.project.update({
      where: { id: params.id },
      data: updateData,
      include: {
        workspace: {
          select: { id: true, name: true }
        },
        tasks: {
          select: { id: true, status: true }
        },
        _count: {
          select: { tasks: true }
        }
      }
    })

    // Calculer les statistiques
    const tasks = project.tasks
    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === "TODO").length,
      inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
      done: tasks.filter(t => t.status === "DONE").length,
      archived: tasks.filter(t => t.status === "ARCHIVED").length,
    }

    const projectWithStats = {
      ...project,
      stats
    }

    return NextResponse.json(projectWithStats)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      )
    }
    
    console.error("Error updating project:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du projet" },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Supprimer un projet
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const existingProject = await db.project.findUnique({
      where: { id: params.id }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      )
    }

    await db.project.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Projet supprimé avec succès" })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du projet" },
      { status: 500 }
    )
  }
}