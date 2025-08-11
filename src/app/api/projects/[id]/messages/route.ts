import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"
import { getIO } from "@/lib/socket"

interface RouteParams { params: Promise<{ id: string }> }
const messageSchema = z.object({ content: z.string().min(1), attachments: z.array(z.object({ name: z.string(), url: z.string(), type: z.string().optional() })).optional() })

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const project = await db.project.findFirst({ where: { id, workspace: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] } } })
    if (!project) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const msgs = await db.projectMessage.findMany({ where: { projectId: id }, include: { user: { select: { id:true, name:true, email:true } } }, orderBy: { createdAt: 'asc' } })
    return NextResponse.json(msgs)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const { content, attachments } = messageSchema.parse(await request.json())
    const project = await db.project.findFirst({ where: { id, workspace: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] } } })
    if (!project) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const msg = await db.projectMessage.create({ data: { projectId: id, userId: user.id, content, attachments: attachments ? JSON.stringify(attachments) : null } })
    // push temps réel
    const io = getIO()
    io?.to(`project:${id}`).emit('project:message', { ...msg, user: { id: user.id, name: (user as any).name, email: (user as any).email } })
    return NextResponse.json(msg, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


