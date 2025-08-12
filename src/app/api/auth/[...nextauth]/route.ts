import NextAuth, { type AuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import "next-auth/jwt"

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
  
  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
  }
}

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // Important derrière un proxy (Render): fait confiance aux en-têtes Host/X-Forwarded-*
  trustHost: true,
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password || "")
        
        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/signin"
  },
  callbacks: {
    async jwt({ token, user }) {
      // Ne stocker que l'ID utilisateur dans le JWT (évite les cookies trop gros)
      if (user) token.id = (user as any).id
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        // Charger les infos utilisateur pour la session (renvoyées dans la réponse, pas stockées en cookie)
        try {
          const u = await db.user.findUnique({ where: { id: String(token.id) }, select: { name: true, email: true, avatar: true } })
          if (u) {
            session.user.name = u.name
            session.user.email = u.email
            session.user.image = u.avatar || null
          }
        } catch {}
      }
      return session
    }
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

// Assure un runtime Node (Prisma non compatible Edge) et évite tout cache
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"