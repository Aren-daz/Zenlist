import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const createHabitEntrySchema = z.object({
  notes: z.string().optional(),
})

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/habits/[id]/entries - Récupérer toutes les entrées d'une habitude
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Vérifier si l'habitude existe
    const habit = await db.habit.findUnique({
      where: { id: params.id }
    })

    if (!habit) {
      return NextResponse.json(
        { error: "Habitude non trouvée" },
        { status: 404 }
      )
    }

    const entries = await db.habitEntry.findMany({
      where: { habitId: params.id },
      orderBy: {
        completedAt: "desc"
      }
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error("Error fetching habit entries:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des entrées" },
      { status: 500 }
    )
  }
}

// POST /api/habits/[id]/entries - Créer une nouvelle entrée d'habitude
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const validatedData = createHabitEntrySchema.parse(body)

    // Vérifier si l'habitude existe
    const habit = await db.habit.findUnique({
      where: { id: params.id }
    })

    if (!habit) {
      return NextResponse.json(
        { error: "Habitude non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier si une entrée existe déjà pour aujourd'hui
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingEntry = await db.habitEntry.findFirst({
      where: {
        habitId: params.id,
        completedAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    if (existingEntry) {
      return NextResponse.json(
        { error: "Cette habitude a déjà été complétée aujourd'hui" },
        { status: 400 }
      )
    }

    const entry = await db.habitEntry.create({
      data: {
        habitId: params.id,
        userId: "user-1", // TODO: Récupérer l'ID utilisateur depuis l'authentification
        notes: validatedData.notes,
      }
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      )
    }
    
    console.error("Error creating habit entry:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'entrée" },
      { status: 500 }
    )
  }
}