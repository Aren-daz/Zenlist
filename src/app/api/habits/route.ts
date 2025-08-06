import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const createHabitSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional().default("DAILY"),
})

const updateHabitSchema = z.object({
  name: z.string().min(1, "Le nom est requis").optional(),
  description: z.string().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
})

// GET /api/habits - Récupérer toutes les habitudes
export async function GET(request: NextRequest) {
  try {
    const habits = await db.habit.findMany({
      include: {
        _count: {
          select: { entries: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(habits)
  } catch (error) {
    console.error("Error fetching habits:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des habitudes" },
      { status: 500 }
    )
  }
}

// POST /api/habits - Créer une nouvelle habitude
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createHabitSchema.parse(body)

    const habit = await db.habit.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        frequency: validatedData.frequency,
        userId: "user-1", // TODO: Récupérer l'ID utilisateur depuis l'authentification
      },
      include: {
        _count: {
          select: { entries: true }
        }
      }
    })

    return NextResponse.json(habit, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      )
    }
    
    console.error("Error creating habit:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'habitude" },
      { status: 500 }
    )
  }
}