import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const createProjectSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  color: z.string().optional().default("#3b82f6"),
  workspaceId: z.string().optional(),
})

const updateProjectSchema = z.object({
  name: z.string().min(1, "Le nom est requis").optional(),
  description: z.string().optional(),
  color: z.string().optional(),
})

// GET /api/projects - Récupérer tous les projets
export async function GET(request: NextRequest) {
  try {
    const projects = await db.project.findMany({
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
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Calculer les statistiques pour chaque projet
    const projectsWithStats = projects.map(project => {
      const tasks = project.tasks
      const stats = {
        total: tasks.length,
        todo: tasks.filter(t => t.status === "TODO").length,
        inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
        done: tasks.filter(t => t.status === "DONE").length,
        archived: tasks.filter(t => t.status === "ARCHIVED").length,
      }
      
      return {
        ...project,
        stats
      }
    })

    return NextResponse.json(projectsWithStats)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets" },
      { status: 500 }
    )
  }
}

// POST /api/projects - Créer un nouveau projet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    // Si aucun workspaceId n'est fourni, créer ou utiliser un workspace par défaut
    let workspaceId = validatedData.workspaceId
    if (!workspaceId) {
      let defaultWorkspace = await db.workspace.findFirst()
      if (!defaultWorkspace) {
        // Créer un utilisateur par défaut d'abord
        let defaultUser = await db.user.findFirst()
        if (!defaultUser) {
          defaultUser = await db.user.create({
            data: {
              id: 'user-1',
              email: 'default@example.com',
              name: 'Default User',
            },
          })
        }
        
        defaultWorkspace = await db.workspace.create({
          data: {
            name: 'Default Workspace',
            description: 'Workspace par défaut',
            ownerId: defaultUser.id,
          },
        })
      }
      workspaceId = defaultWorkspace.id
    }

    const project = await db.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        color: validatedData.color,
        workspaceId: workspaceId,
      },
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

    return NextResponse.json(projectWithStats, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      )
    }
    
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du projet" },
      { status: 500 }
    )
  }
}