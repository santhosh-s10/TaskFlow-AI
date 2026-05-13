import { NextRequest, NextResponse } from 'next/server'
import { resolveMx } from 'node:dns/promises'
import connectToDatabase from '@/lib/mongodb'
import User from '@/models/User'

export const runtime = 'nodejs'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
const strongPasswordMessage =
  'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'

async function hasDeliverableEmailDomain(email: string) {
  const domain = email.split('@')[1]

  if (!domain) {
    return false
  }

  try {
    const records = await resolveMx(domain)
    return records.length > 0
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()
    const trimmedName = typeof name === 'string' ? name.trim() : ''
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!trimmedName || !normalizedEmail || !password) {
      return NextResponse.json(
        { error: 'Please enter your full name, email, and password.' },
        { status: 400 }
      )
    }

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return NextResponse.json(
        { error: 'Full name must be between 2 and 50 characters.' },
        { status: 400 }
      )
    }

    if (!emailPattern.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    if (!(await hasDeliverableEmailDomain(normalizedEmail))) {
      return NextResponse.json(
        { error: 'Please use a real email address with a valid mail domain.' },
        { status: 400 }
      )
    }

    if (typeof password !== 'string' || !passwordPattern.test(password)) {
      return NextResponse.json(
        { error: strongPasswordMessage },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Try logging in instead.' },
        { status: 409 }
      )
    }

    const user = new User({
      name: trimmedName,
      email: normalizedEmail,
      password
    })

    await user.save()

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Unable to create the account right now. Please try again.' },
      { status: 500 }
    )
  }
}
