import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

import { authOptions } from "@/lib/auth"
import connectToDatabase from "@/lib/mongodb"
import Account from "@/models/Account"
import Project from "@/models/Project"
import Session from "@/models/Session"
import Task from "@/models/Task"
import User from "@/models/User"
import VerificationToken from "@/models/VerificationToken"

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^[+\d][\d\s().-]{7,}$/

function serializeUser(user: {
  _id: unknown
  name: string
  email: string
  image?: string | null
  phone?: string | null
  emailVerified?: Date | null
  updatedAt?: Date
}) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    phone: user.phone ?? "",
    emailVerified: user.emailVerified?.toISOString() ?? null,
    updatedAt: user.updatedAt?.toISOString() ?? null,
  }
}

async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }

  await connectToDatabase()
  return User.findById(session.user.id)
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    user: serializeUser(user),
    devices: [
      {
        id: "current",
        name: "Current browser session",
        status: "Active now",
        lastSeen: new Date().toISOString(),
      },
    ],
  })
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const action = typeof body.action === "string" ? body.action : "profile"

  if (action === "profile") {
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const phone = typeof body.phone === "string" ? body.phone.trim() : ""
    const image = typeof body.image === "string" && body.image.trim() ? body.image.trim() : null

    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: "Full name must be between 2 and 50 characters." },
        { status: 400 }
      )
    }

    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
    }

    if (phone && !phonePattern.test(phone)) {
      return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 })
    }

    if (image && image.length > 750_000) {
      return NextResponse.json(
        { error: "Profile picture is too large. Choose an image under 500 KB." },
        { status: 400 }
      )
    }

    if (email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } })
      if (existingUser) {
        return NextResponse.json({ error: "That email is already in use." }, { status: 409 })
      }

      user.emailVerified = null
    }

    user.name = name
    user.email = email
    user.phone = phone || null
    user.image = image
    await user.save()

    return NextResponse.json({ user: serializeUser(user) })
  }

  if (action === "password") {
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : ""
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : ""
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : ""

    if (!user.password) {
      return NextResponse.json(
        { error: "This account uses Google sign-in, so it does not have a local password." },
        { status: 400 }
      )
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 })
    }

    if (!passwordPattern.test(newPassword)) {
      return NextResponse.json(
        { error: "Use 8+ characters with uppercase, lowercase, number, and symbol." },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "New passwords do not match." }, { status: 400 })
    }

    user.password = newPassword
    await user.save()

    return NextResponse.json({ user: serializeUser(user), message: "Password updated." })
  }

  if (action === "verification") {
    user.emailVerified = new Date()
    await user.save()

    return NextResponse.json({
      user: serializeUser(user),
      message: "Account verification updated.",
    })
  }

  return NextResponse.json({ error: "Unsupported account action." }, { status: 400 })
}

export async function DELETE() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = user._id
  const userIdString = String(user._id)
  const email = user.email

  await Promise.all([
    Project.deleteMany({ userId: userIdString }),
    Task.deleteMany({ userId: userIdString }),
    Account.deleteMany({ userId }),
    Session.deleteMany({ userId }),
    VerificationToken.deleteMany({
      identifier: { $in: [email, `password-reset:${email}`] },
    }),
  ])
  await User.deleteOne({ _id: userId })

  return NextResponse.json({ success: true })
}
