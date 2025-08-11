import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { randomUUID } from "crypto"

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json())
    const user = await db.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ message: 'Si le compte existe, un email a été envoyé.' })

    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30) // 30 min
    await db.passwordReset.create({ data: { userId: user.id, token, expiresAt } })

    // En prod: envoyer un email. Ici: retourner le token pour dev
    return NextResponse.json({ message: 'Lien de réinitialisation généré', token })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


