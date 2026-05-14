import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      phone?: string | null
      emailVerified?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    phone?: string | null
    emailVerified?: string | null
  }
}
