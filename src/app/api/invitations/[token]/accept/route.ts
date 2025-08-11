import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

interface RouteParams { params: Promise<{ token: string }> }

const acceptSchema = z.object({
  name: z.string().optional(),
  password: z.string().min(6).optional(),
})

// POST /api/invitations/[token]/accept
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params
    const invitation = await db.invitation.findUnique({ where: { token } })
    if (!invitation || invitation.status !== 'PENDING') {
      return NextResponse.json({ error: 'Invitation invalide' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const { name } = acceptSchema.parse(body)

    // Si l'utilisateur existe déjà, on rattache directement
    let user = await db.user.findUnique({ where: { email: invitation.email } })
    if (!user) {
      // créer un compte minimal (mots de passe/SSO à intégrer selon besoin)
      user = await db.user.create({
        data: {
          email: invitation.email,
          name: name ?? invitation.email.split('@')[0],
        },
      })
    }

    // Ajouter au workspace
    await db.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId: user.id } },
      update: { role: invitation.role },
      create: { workspaceId: invitation.workspaceId, userId: user.id, role: invitation.role },
    })

    await db.invitation.update({ where: { token }, data: { status: 'ACCEPTED', acceptedAt: new Date() } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


