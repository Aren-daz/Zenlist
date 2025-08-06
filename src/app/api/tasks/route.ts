import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const createTaskSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "ARCHIVED"]).optional().default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),
  dueDate: z.string().optional(),
  projectId: z.string().optional(),
  assignedTo: z.string().optional(),
  parent_id: z.string().optional(),
})

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

// GET /api/tasks - Récupérer toutes les tâches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const projectId = searchParams.get("projectId")
    const assignedTo = searchParams.get("assignedTo")

    const where: any = {}
    
    if (status) where.status = status
    if (priority) where.priority = priority
    if (projectId) where.projectId = projectId
    if (assignedTo) where.assignedTo = assignedTo

    const tasks = await db.task.findMany({
      where,
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
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Transformer les tags pour correspondre au format attendu par le frontend
    const transformedTasks = tasks.map(task => ({
      ...task,
      tags: task.tags.map(tt => tt.tag)
    }))

    return NextResponse.json(transformedTasks)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tâches" },
      { status: 500 }
    )
  }
}

// POST /api/tasks - Créer une nouvelle tâche
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validatedData = createTaskSchema.parse(body)

    // Vérifier si le projet existe si projectId est fourni et n'est pas vide
    if (validatedData.projectId && validatedData.projectId.trim() !== "") {
      const project = await db.project.findUnique({
        where: { id: validatedData.projectId }
      })
      if (!project) {
        return NextResponse.json(
          { error: "Projet non trouvé" },
          { status: 400 }
        )
      }
    } else {
      // Créer un projet par défaut si aucun projet n'est spécifié
      let defaultProject = await db.project.findFirst()
      if (!defaultProject) {
        // Créer un workspace par défaut d'abord
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
        
        // Créer un projet par défaut
        defaultProject = await db.project.create({
          data: {
            name: 'Projet par défaut',
            description: 'Projet par défaut',
            workspaceId: defaultWorkspace.id,
          },
        })
      }
      validatedData.projectId = defaultProject.id
    }

    // Vérifier si l'utilisateur assigné existe si assignedTo est fourni
    if (validatedData.assignedTo) {
      const user = await db.user.findUnique({
        where: { id: validatedData.assignedTo }
      })
      if (!user) {
        return NextResponse.json(
          { error: "Utilisateur assigné non trouvé" },
          { status: 400 }
        )
      }
    }

    // Vérifier si l'utilisateur créateur existe
    let creatorUser = await db.user.findUnique({
      where: { id: "user-1" }
    })
    if (!creatorUser) {
      creatorUser = await db.user.create({
        data: {
          id: 'user-1',
          email: 'creator@example.com',
          name: 'Creator User',
        },
      })
    }

    const task = await db.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status,
        priority: validatedData.priority,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        projectId: validatedData.projectId,
        assignedTo: validatedData.assignedTo,
        parent_id: validatedData.parent_id,
        created_by: "user-1", // TODO: Récupérer l'ID utilisateur depuis l'authentification
      },
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

    return NextResponse.json(transformedTask, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      )
    }
    
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la tâche" },
      { status: 500 }
    )
  }
}