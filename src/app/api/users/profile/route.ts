import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"

const profileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const body = await request.json()
    const data = profileSchema.parse(body)

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        name: data.name,
        email: data.email,
        bio: data.bio,
        phone: data.phone,
        location: data.location,
      },
      select: { id: true, name: true, email: true, avatar: true, bio: true, phone: true, location: true }
    })

    return NextResponse.json(updated)
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const u = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, avatar: true, bio: true, phone: true, location: true }
    })
    return NextResponse.json(u)
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


