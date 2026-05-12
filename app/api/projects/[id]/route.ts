import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

import { authOptions } from "@/lib/auth"
import connectToDatabase from "@/lib/mongodb"
import { serializeProject } from "@/lib/serializers"
import Project from "@/models/Project"
import Task from "@/models/Task"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json()
  await connectToDatabase()

  const project = await Project.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    {
      name: body.name,
      description: body.description,
      status: body.status,
      priority: body.priority,
      dueDate: body.dueDate,
    },
    { new: true, runValidators: true }
  )

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  return NextResponse.json({ project: serializeProject(project) })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  await connectToDatabase()

  const project = await Project.findOneAndDelete({ _id: id, userId: session.user.id })
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  await Task.deleteMany({ projectId: id, userId: session.user.id })

  return NextResponse.json({ success: true })
}
