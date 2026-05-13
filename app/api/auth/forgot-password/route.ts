import { NextRequest, NextResponse } from "next/server"

import { sendPasswordResetEmail } from "@/lib/email"
import connectToDatabase from "@/lib/mongodb"
import { createPasswordResetToken } from "@/lib/password-reset"
import User from "@/models/User"
import VerificationToken from "@/models/VerificationToken"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      return NextResponse.json(
        { error: "No account exists with this email address." },
        { status: 404 }
      )
    }

    const { token, tokenHash } = createPasswordResetToken()
    const expires = new Date(Date.now() + 60 * 60 * 1000)
    const identifier = `password-reset:${normalizedEmail}`
    const baseUrl = process.env.NEXTAUTH_URL ?? new URL(request.url).origin
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`

    await VerificationToken.deleteMany({ identifier })
    await VerificationToken.create({
      identifier,
      token: tokenHash,
      expires,
    })

    await sendPasswordResetEmail({ to: normalizedEmail, resetUrl })

    return NextResponse.json({
      message: "A reset link has been sent to your email.",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Unable to send a reset link right now. Please try again." },
      { status: 500 }
    )
  }
}
