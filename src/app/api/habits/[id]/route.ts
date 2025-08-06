import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const updateHabitSchema = z.object({
  name: z.string().min(1, "Le nom est requis").optional(),
  description: z.string().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
})

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/habits/[id] - Récupérer une habitude spécifique
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const habit = await db.habit.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { entries: true }
        }
      }
    })

    if (!habit) {
      return NextResponse.json(
        { error: "Habitude non trouvée" },
        { status: 404 }
      )
    }

    return NextResponse.json(habit)
  } catch (error) {
    console.error("Error fetching habit:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'habitude" },
      { status: 500 }
    )
  }
}

// PUT /api/habits/[id] - Mettre à jour une habitude
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const validatedData = updateHabitSchema.parse(body)

    const existingHabit = await db.habit.findUnique({
      where: { id: params.id }
    })

    if (!existingHabit) {
      return NextResponse.json(
        { error: "Habitude non trouvée" },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.frequency !== undefined) updateData.frequency = validatedData.frequency

    const habit = await db.habit.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: { entries: true }
        }
      }
    })

    return NextResponse.json(habit)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      )
    }
    
    console.error("Error updating habit:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'habitude" },
      { status: 500 }
    )
  }
}

// DELETE /api/habits/[id] - Supprimer une habitude
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const existingHabit = await db.habit.findUnique({
      where: { id: params.id }
    })

    if (!existingHabit) {
      return NextResponse.json(
        { error: "Habitude non trouvée" },
        { status: 404 }
      )
    }

    await db.habit.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Habitude supprimée avec succès" })
  } catch (error) {
    console.error("Error deleting habit:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'habitude" },
      { status: 500 }
    )
  }
}