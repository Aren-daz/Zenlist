import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Pour l'instant, retourner des notifications factices
    // TODO: Implémenter la vraie logique avec authentification
    const notifications = [
      {
        id: "1",
        type: "info",
        title: "Bienvenue",
        message: "Bienvenue sur Zenlist !",
        userId: "user-1",
        read: false,
        createdAt: new Date().toISOString(),
        data: null
      }
    ]

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Pour l'instant, retourner une réponse factice
    // TODO: Implémenter la vraie logique avec authentification
    const { type, title, message } = await request.json()

    const notification = {
      id: "temp-" + Date.now(),
      type,
      title,
      message,
      userId: "user-1",
      read: false,
      createdAt: new Date().toISOString(),
      data: null
    }

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error("Failed to create notification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}