import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

import { authOptions } from "@/lib/auth"
import { getUserProjects } from "@/lib/dashboard-data"
import connectToDatabase from "@/lib/mongodb"
import { serializeProject } from "@/lib/serializers"
import Project from "@/models/Project"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await connectToDatabase()

  const projects = await getUserProjects(session.user.id)
  return NextResponse.json({ projects })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  await connectToDatabase()
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const description = typeof body.description === "string" ? body.description.trim() : ""
  const dueDate = body.dueDate ? new Date(body.dueDate) : null

  if (!name) {
    return NextResponse.json({ error: "Project name is required." }, { status: 400 })
  }

  if (name.length > 100) {
    return NextResponse.json(
      { error: "Project name must be 100 characters or fewer." },
      { status: 400 }
    )
  }

  if (!description) {
    return NextResponse.json({ error: "Project description is required." }, { status: 400 })
  }

  if (description.length > 500) {
    return NextResponse.json(
      { error: "Description must be 500 characters or fewer." },
      { status: 400 }
    )
  }

  if (!dueDate || Number.isNaN(dueDate.getTime())) {
    return NextResponse.json({ error: "Choose a valid project due date." }, { status: 400 })
  }

  const project = await Project.create({
    name,
    description,
    status: body.status,
    priority: body.priority,
    dueDate,
    userId: session.user.id,
  })

  return NextResponse.json({ project: serializeProject(project) }, { status: 201 })
}
