import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"
import { randomUUID } from "crypto"

interface RouteParams { params: Promise<{ id: string }> }

const inviteSchema = z.object({ email: z.string().email(), role: z.enum(["ADMIN","MEMBER","VIEWER"]).default("MEMBER") })

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    // droit: membre du workspace du projet
    const project = await db.project.findFirst({
      where: { id, workspace: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] } },
    })
    if (!project) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const members = await db.projectMember.findMany({
      where: { projectId: id },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      orderBy: { joinedAt: 'asc' },
    })
    return NextResponse.json(members)
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const body = await request.json()
    const { email, role } = inviteSchema.parse(body)

    const project = await db.project.findFirst({
      where: { id, workspace: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id, role: { in: ['ADMIN'] } } } }] } },
    })
    if (!project) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      // Invitation à accepter via notification
      const token = randomUUID()
      const invitation = await db.invitation.create({
        data: {
          email,
          role: role as any,
          token,
          workspaceId: project.workspaceId,
          projectId: id,
          invitedByUserId: user.id,
        }
      })
      await db.notification.create({
        data: {
          type: 'invite_project',
          title: 'Invitation à rejoindre un projet',
          message: 'Vous avez été invité à rejoindre un projet',
          userId: existingUser.id,
          data: JSON.stringify({ token: invitation.token, projectId: id, role }),
        }
      })
      return NextResponse.json({ message: 'Invitation projet envoyée' }, { status: 201 })
    }

    // Utilisateur inconnu: créer invitation (console log)
    const token = randomUUID()
    const invitation = await db.invitation.create({
      data: {
        email,
        role: role as any,
        token,
        workspaceId: project.workspaceId,
        projectId: id,
        invitedByUserId: user.id,
      }
    })
    console.log(`[INVITE:PROJECT] Email: ${email} | Token: ${invitation.token}`)
    return NextResponse.json({ message: 'Invitation projet envoyée' }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || ''
    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 })

    const project = await db.project.findFirst({
      where: { id, workspace: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id, role: { in: ['ADMIN'] } } } }] } },
    })
    if (!project) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await db.projectMember.deleteMany({ where: { projectId: id, userId } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


