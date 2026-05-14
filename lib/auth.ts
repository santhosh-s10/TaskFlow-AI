import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import connectToDatabase from '@/lib/mongodb'
import User from '@/models/User'

async function findOrCreateUserByEmail({
  email,
  name,
  image,
  emailVerified,
}: {
  email: string
  name?: string | null
  image?: string | null
  emailVerified?: Date | null
}) {
  const normalizedEmail = email.trim().toLowerCase()

  await connectToDatabase()

  const existingUser = await User.findOne({ email: normalizedEmail })

  if (existingUser) {
    let didChange = false

    if (name && existingUser.name !== name) {
      existingUser.name = name
      didChange = true
    }

    if (image && existingUser.image !== image) {
      existingUser.image = image
      didChange = true
    }

    if (emailVerified && !existingUser.emailVerified) {
      existingUser.emailVerified = emailVerified
      didChange = true
    }

    if (didChange) {
      await existingUser.save()
    }

    return existingUser
  }

  return User.create({
    name: name?.trim() || normalizedEmail.split('@')[0] || 'TaskFlow User',
    email: normalizedEmail,
    image: image ?? null,
    emailVerified: emailVerified ?? new Date(),
    accounts: [],
  })
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await connectToDatabase()

        const user = await User.findOne({ email: credentials.email })
        if (!user) {
          return null
        }

        const isPasswordValid = await user.comparePassword(credentials.password)
        if (!isPasswordValid) {
          return null
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image ?? null,
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') {
        return true
      }

      if (!user.email) {
        return false
      }

      await findOrCreateUserByEmail({
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: new Date(),
      })

      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.user) {
        token.name = session.user.name ?? token.name
        token.email = session.user.email ?? token.email
        token.picture = session.user.image ?? token.picture
        token.phone = session.user.phone ?? token.phone ?? null
        token.emailVerified = session.user.emailVerified ?? token.emailVerified ?? null
      }

      if (token.id) {
        await connectToDatabase()
        const databaseUser = await User.findById(token.id)

        if (databaseUser) {
          token.name = databaseUser.name
          token.email = databaseUser.email
          token.picture = databaseUser.image ?? undefined
          token.phone = databaseUser.phone ?? null
          token.emailVerified = databaseUser.emailVerified?.toISOString() ?? null
          return token
        }
      }

      const email = user?.email ?? token.email

      if (email) {
        const databaseUser = await findOrCreateUserByEmail({
          email,
          name: user?.name ?? token.name,
          image: user?.image ?? token.picture,
          emailVerified: user?.email ? new Date() : null,
        })

        token.id = databaseUser._id.toString()
        token.name = databaseUser.name
        token.email = databaseUser.email
        token.picture = databaseUser.image ?? undefined
        token.phone = databaseUser.phone ?? null
        token.emailVerified = databaseUser.emailVerified?.toISOString() ?? null
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.name = token.name ?? session.user.name
        session.user.email = token.email ?? session.user.email
        session.user.image = (token.picture as string | undefined) ?? null
        session.user.phone = token.phone ?? null
        session.user.emailVerified = token.emailVerified ?? null
      }
      return session
    },
  },
}

export default NextAuth(authOptions)
