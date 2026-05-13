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

  const project = await Project.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    {
      name,
      description,
      status: body.status,
      priority: body.priority,
      dueDate,
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
