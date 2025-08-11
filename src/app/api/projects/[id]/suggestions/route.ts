import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"

interface RouteParams { params: Promise<{ id: string }> }
const suggestSchema = z.object({ content: z.string().min(1) })
const updateSchema = z.object({ status: z.enum(["OPEN","ACCEPTED","REJECTED"]) })

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const project = await db.project.findFirst({ where: { id, workspace: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] } } })
    if (!project) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const items = await db.projectSuggestion.findMany({ where: { projectId: id }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json(items)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const { content } = suggestSchema.parse(await request.json())
    const project = await db.project.findFirst({ where: { id, workspace: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] } } })
    if (!project) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const s = await db.projectSuggestion.create({ data: { projectId: id, userId: user.id, content } })
    return NextResponse.json(s, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const suggestionId = searchParams.get('suggestionId') || ''
    if (!suggestionId) return NextResponse.json({ error: 'suggestionId requis' }, { status: 400 })
    const body = updateSchema.parse(await request.json())

    // vérifier droit admin (owner workspace ou admin workspace)
    const project = await db.project.findFirst({ where: { id, workspace: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id, role: { in: ['ADMIN'] } } } }] } } })
    if (!project) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const updated = await db.projectSuggestion.update({ where: { id: suggestionId }, data: { status: body.status, resolvedAt: body.status !== 'OPEN' ? new Date() : null } })
    return NextResponse.json(updated)
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


