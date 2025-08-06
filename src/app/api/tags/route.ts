import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const createTagSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  color: z.string().optional().default("#6b7280"),
  workspaceId: z.string().optional(),
})

const updateTagSchema = z.object({
  name: z.string().min(1, "Le nom est requis").optional(),
  color: z.string().optional(),
})

// GET /api/tags - Récupérer tous les tags
export async function GET(request: NextRequest) {
  try {
    const tags = await db.tag.findMany({
      include: {
        workspace: {
          select: { id: true, name: true }
        },
        tasks: {
          include: {
            task: {
              select: { id: true, title: true, status: true }
            }
          }
        },
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tags" },
      { status: 500 }
    )
  }
}

// POST /api/tags - Créer un nouveau tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createTagSchema.parse(body)

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

    // Vérifier si un tag avec le même nom existe déjà dans le workspace
    const existingTag = await db.tag.findFirst({
      where: {
        name: validatedData.name,
        workspaceId: workspaceId
      }
    })

    if (existingTag) {
      return NextResponse.json(
        { error: "Un tag avec ce nom existe déjà" },
        { status: 400 }
      )
    }

    const tag = await db.tag.create({
      data: {
        name: validatedData.name,
        color: validatedData.color,
        workspaceId: workspaceId,
      },
      include: {
        workspace: {
          select: { id: true, name: true }
        },
        tasks: {
          include: {
            task: {
              select: { id: true, title: true, status: true }
            }
          }
        },
        _count: {
          select: { tasks: true }
        }
      }
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      )
    }
    
    console.error("Error creating tag:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du tag" },
      { status: 500 }
    )
  }
}