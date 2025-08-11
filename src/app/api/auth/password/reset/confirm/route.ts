import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import bcrypt from "bcryptjs"

const schema = z.object({ token: z.string().min(10), password: z.string().min(6) })

export async function POST(req: NextRequest) {
  try {
    const { token, password } = schema.parse(await req.json())
    const reset = await db.passwordReset.findUnique({ where: { token } })
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 400 })
    }
    const hash = await bcrypt.hash(password, 12)
    await db.user.update({ where: { id: reset.userId }, data: { password: hash } })
    await db.passwordReset.update({ where: { token }, data: { usedAt: new Date() } })
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


