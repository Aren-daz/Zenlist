import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"

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
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
      where: {
        workspace: {
          OR: [
            { ownerId: user.id },
            { members: { some: { userId: user.id } } }
          ]
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
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await request.json()
    const validatedData = createTagSchema.parse(body)

    // Si aucun workspaceId n'est fourni, créer ou utiliser un workspace par défaut
    let workspaceId = validatedData.workspaceId
    if (!workspaceId) {
      let defaultWorkspace = await db.workspace.findFirst({ where: { ownerId: user.id } })
      if (!defaultWorkspace) {
        defaultWorkspace = await db.workspace.create({
          data: {
            name: `${user.name ?? 'Mon'} Workspace`,
            description: 'Workspace par défaut',
            ownerId: user.id,
          },
        })
        await db.workspaceMember.create({ data: { workspaceId: defaultWorkspace.id, userId: user.id, role: 'ADMIN' } })
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