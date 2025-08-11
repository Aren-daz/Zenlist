import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"
import { randomUUID } from "crypto"

interface RouteParams { params: Promise<{ id: string }> }

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN","MEMBER","VIEWER"]).default("MEMBER"),
})

// POST /api/workspaces/[id]/invitations - créer une invitation (email inconnu)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const body = await request.json()
    const { email, role } = inviteSchema.parse(body)

    // Vérifier accès admin/owner
    const ws = await db.workspace.findFirst({
      where: {
        id,
        OR: [{ ownerId: user.id }, { members: { some: { userId: user.id, role: { in: ["ADMIN"] } } } }],
      },
    })
    if (!ws) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Si l'utilisateur existe déjà, on renvoie une erreur (utiliser endpoint members pour ajouter directement)
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "L'utilisateur existe déjà. Utilisez l'ajout de membre." }, { status: 409 })
    }

    // Créer l'invitation
    const token = randomUUID()
    const invitation = await db.invitation.create({
      data: {
        email,
        role: role as any,
        token,
        workspaceId: id,
        invitedByUserId: user.id,
      },
    })

    // Envoi d'email (fallback console)
    console.log(`[INVITE] Email: ${email} | Token: ${token}`)

    return NextResponse.json({ message: "Invitation créée", invitationId: invitation.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    }
    console.error("Error creating invitation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


