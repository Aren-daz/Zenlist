import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db.$executeRaw`
      UPDATE notifications 
      SET read = true 
      WHERE userId = ${user.id} AND read = false
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}