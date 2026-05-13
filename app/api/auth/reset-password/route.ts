import { NextRequest, NextResponse } from "next/server"

import connectToDatabase from "@/lib/mongodb"
import { hashPasswordResetToken } from "@/lib/password-reset"
import User from "@/models/User"
import VerificationToken from "@/models/VerificationToken"

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
const strongPasswordMessage =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."

export async function POST(request: NextRequest) {
  try {
    const { email, token, password, confirmPassword } = await request.json()
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""
    const resetToken = typeof token === "string" ? token.trim() : ""

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || !resetToken) {
      return NextResponse.json(
        { error: "The reset link is invalid." },
        { status: 400 }
      )
    }

    if (typeof password !== "string" || !passwordPattern.test(password)) {
      return NextResponse.json(
        { error: strongPasswordMessage },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const identifier = `password-reset:${normalizedEmail}`
    const storedToken = await VerificationToken.findOne({
      identifier,
      token: hashPasswordResetToken(resetToken),
      expires: { $gt: new Date() },
    })

    if (!storedToken) {
      return NextResponse.json(
        { error: "The reset link is invalid or expired." },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      await VerificationToken.deleteMany({ identifier })
      return NextResponse.json(
        { error: "The reset link is invalid or expired." },
        { status: 400 }
      )
    }

    user.password = password
    user.updatedAt = new Date()
    await user.save()
    await VerificationToken.deleteMany({ identifier })

    return NextResponse.json({ message: "Password reset successfully." })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Unable to reset the password right now. Please try again." },
      { status: 500 }
    )
  }
}
