import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const updateTagSchema = z.object({
  name: z.string().min(1, "Le nom est requis").optional(),
  color: z.string().optional(),
})

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/tags/[id] - Récupérer un tag spécifique
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const tag = await db.tag.findUnique({
      where: { id: params.id },
      include: {
        workspace: {
          select: { id: true, name: true }
        },
        tasks: {
          include: {
            task: {
              select: { 
                id: true, 
                title: true, 
                status: true,
                project: {
                  select: { id: true, name: true, color: true }
                }
              }
            }
          }
        },
        _count: {
          select: { tasks: true }
        }
      }
    })

    if (!tag) {
      return NextResponse.json(
        { error: "Tag non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json(tag)
  } catch (error) {
    console.error("Error fetching tag:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du tag" },
      { status: 500 }
    )
  }
}

// PUT /api/tags/[id] - Mettre à jour un tag
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const validatedData = updateTagSchema.parse(body)

    const existingTag = await db.tag.findUnique({
      where: { id: params.id }
    })

    if (!existingTag) {
      return NextResponse.json(
        { error: "Tag non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier si un tag avec le même nom existe déjà (si on change le nom)
    if (validatedData.name && validatedData.name !== existingTag.name) {
      const duplicateTag = await db.tag.findFirst({
        where: {
          name: validatedData.name,
          workspaceId: existingTag.workspaceId,
          id: { not: params.id }
        }
      })

      if (duplicateTag) {
        return NextResponse.json(
          { error: "Un tag avec ce nom existe déjà" },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.color !== undefined) updateData.color = validatedData.color

    const tag = await db.tag.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(tag)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      )
    }
    
    console.error("Error updating tag:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du tag" },
      { status: 500 }
    )
  }
}

// DELETE /api/tags/[id] - Supprimer un tag
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const existingTag = await db.tag.findUnique({
      where: { id: params.id }
    })

    if (!existingTag) {
      return NextResponse.json(
        { error: "Tag non trouvé" },
        { status: 404 }
      )
    }

    await db.tag.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Tag supprimé avec succès" })
  } catch (error) {
    console.error("Error deleting tag:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du tag" },
      { status: 500 }
    )
  }
}