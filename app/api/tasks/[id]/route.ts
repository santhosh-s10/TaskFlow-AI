import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

import { authOptions } from "@/lib/auth"
import connectToDatabase from "@/lib/mongodb"
import { serializeTask } from "@/lib/serializers"
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

  if (body.projectId) {
    const project = await Project.findOne({ _id: body.projectId, userId: session.user.id })
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
  }

  const task = await Task.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    {
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      projectId: body.projectId,
      assignedTo: body.assignedTo,
      tags: body.tags,
      dueDate: body.dueDate,
    },
    { new: true, runValidators: true }
  )

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  return NextResponse.json({ task: serializeTask(task) })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  await connectToDatabase()

  const task = await Task.findOneAndDelete({ _id: id, userId: session.user.id })
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
