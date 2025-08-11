import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/users - liste des utilisateurs partageant au moins un workspace avec l'utilisateur courant
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Workspaces de l'utilisateur
    const workspaces = await db.workspace.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      select: { id: true },
    })

    const workspaceIds = workspaces.map(w => w.id)

    if (workspaceIds.length === 0) {
      return NextResponse.json([])
    }

    // Utilisateurs présents dans ces workspaces
    const users = await db.user.findMany({
      where: {
        OR: [
          { ownedWorkspaces: { some: { id: { in: workspaceIds } } } },
          { workspaces: { some: { workspaceId: { in: workspaceIds } } } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


