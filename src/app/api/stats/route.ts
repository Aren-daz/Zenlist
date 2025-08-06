import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Récupérer toutes les tâches pour calculer les statistiques
    const tasks = await db.task.findMany({
      where: {}, // TODO: Ajouter un filtre par utilisateur quand l'auth est implémentée
    })

    // Calculer les statistiques
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.status === "DONE").length
    const inProgressTasks = tasks.filter(task => task.status === "IN_PROGRESS").length
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate) return false
      return new Date(task.dueDate) < new Date() && task.status !== "DONE"
    }).length

    const stats = {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
}