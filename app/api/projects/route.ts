import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

import { authOptions } from "@/lib/auth"
import connectToDatabase from "@/lib/mongodb"
import { serializeProject } from "@/lib/serializers"
import Project from "@/models/Project"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await connectToDatabase()

  const projects = await Project.find({ userId: session.user.id }).sort({ createdAt: -1 })
  return NextResponse.json({ projects: projects.map(serializeProject) })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  await connectToDatabase()

  const project = await Project.create({
    name: body.name,
    description: body.description,
    status: body.status,
    priority: body.priority,
    dueDate: body.dueDate,
    userId: session.user.id,
  })

  return NextResponse.json({ project: serializeProject(project) }, { status: 201 })
}
