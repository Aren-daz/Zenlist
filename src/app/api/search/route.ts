import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const status = searchParams.get("status")?.split(",") || []
    const priority = searchParams.get("priority")?.split(",") || []
    const projects = searchParams.get("projects")?.split(",") || []
    const tags = searchParams.get("tags")?.split(",") || []
    const assignee = searchParams.get("assignee")?.split(",") || []
    const dueFrom = searchParams.get("dueFrom")
    const dueTo = searchParams.get("dueTo")
    const createdBy = searchParams.get("createdBy")

    // Construire la requête de recherche
    const whereConditions: any = {}

    // Recherche textuelle dans le titre et la description
    if (query) {
      whereConditions.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    }

    // Filtres de statut
    if (status.length > 0) {
      whereConditions.status = { in: status }
    }

    // Filtres de priorité
    if (priority.length > 0) {
      whereConditions.priority = { in: priority }
    }

    // Filtres de projet
    if (projects.length > 0) {
      whereConditions.projectId = { in: projects }
    }

    // Filtres d'assignation
    if (assignee.length > 0) {
      whereConditions.assignedTo = { in: assignee }
    }

    // Filtres de date d'échéance
    if (dueFrom || dueTo) {
      whereConditions.dueDate = {}
      if (dueFrom) {
        whereConditions.dueDate.gte = new Date(dueFrom)
      }
      if (dueTo) {
        whereConditions.dueDate.lte = new Date(dueTo)
      }
    }

    // Filtre de créateur
    if (createdBy) {
      whereConditions.created_by = createdBy
    }

    // Rechercher les tâches
    const tasks = await db.task.findMany({
      where: whereConditions,
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
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50 // Limiter les résultats
    })

    // Transformer les résultats pour correspondre au format attendu
    const results = tasks.map(task => ({
      ...task,
      tags: task.tags.map(tt => tt.tag)
    }))

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}