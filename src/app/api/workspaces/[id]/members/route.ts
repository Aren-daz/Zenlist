import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"
import { randomUUID } from "crypto"

interface RouteParams {
  params: Promise<{ id: string }>
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
})

// GET /api/workspaces/[id]/members - liste des membres d'un workspace
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params

    // vérifier que l'utilisateur a accès à ce workspace
    const workspace = await db.workspace.findFirst({
      where: {
        id,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
    })
    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const members = await db.workspaceMember.findMany({
      where: { workspaceId: id },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      orderBy: { joinedAt: "asc" },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/workspaces/[id]/members - inviter/ajouter un membre existant par email
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const body = await request.json()
    const { email, role } = inviteSchema.parse(body)

    const workspace = await db.workspace.findFirst({
      where: {
        id,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id, role: { in: ["ADMIN"] } } } },
        ],
      },
    })
    if (!workspace) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const invited = await db.user.findUnique({ where: { email } })
    if (!invited) {
      // Utilisateur inconnu: créer invitation (pas de notification possible)
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
      console.log(`[INVITE] Email: ${email} | Token: ${invitation.token}`)
      return NextResponse.json({ message: "Invitation envoyée" }, { status: 201 })
    }

    // Utilisateur connu: créer une invitation à accepter via notifications
    const token = randomUUID()
    // S'assurer que le modèle Invitation existe et le client Prisma est à jour
    const invitation = await db.invitation.create({
      data: {
        email,
        role: role as any,
        token,
        workspaceId: id,
        invitedByUserId: user.id,
      },
    })
    await db.notification.create({
      data: {
        type: 'invite_workspace',
        title: 'Invitation à rejoindre un workspace',
        message: 'Vous avez été invité à rejoindre un workspace',
        userId: invited.id,
        data: JSON.stringify({ token: invitation.token, workspaceId: id, role }),
      }
    })
    return NextResponse.json({ message: 'Invitation envoyée' }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    }
    console.error("Error inviting member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/workspaces/[id]/members?userId=... - retirer un membre
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || ""
    if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 })

    // vérifier droit admin/owner
    const workspace = await db.workspace.findFirst({
      where: {
        id,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id, role: { in: ["ADMIN"] } } } },
        ],
      },
    })
    if (!workspace) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    await db.workspaceMember.deleteMany({ where: { workspaceId: id, userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


