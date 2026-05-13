import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

import { authOptions } from "@/lib/auth"
import { userOwnsProject } from "@/lib/dashboard-data"
import connectToDatabase from "@/lib/mongodb"
import { serializeTask } from "@/lib/serializers"
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
  const title = typeof body.title === "string" ? body.title.trim() : ""
  const description = typeof body.description === "string" ? body.description.trim() : ""
  const assignedTo = typeof body.assignedTo === "string" ? body.assignedTo.trim() : ""
  const dueDate = body.dueDate ? new Date(body.dueDate) : null

  if (!title) {
    return NextResponse.json({ error: "Task title is required." }, { status: 400 })
  }

  if (title.length > 120) {
    return NextResponse.json(
      { error: "Task title must be 120 characters or fewer." },
      { status: 400 }
    )
  }

  if (!description) {
    return NextResponse.json({ error: "Task description is required." }, { status: 400 })
  }

  if (description.length > 500) {
    return NextResponse.json(
      { error: "Description must be 500 characters or fewer." },
      { status: 400 }
    )
  }

  if (!assignedTo) {
    return NextResponse.json({ error: "Assignee email is required." }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assignedTo)) {
    return NextResponse.json(
      { error: "Enter a valid assignee email address." },
      { status: 400 }
    )
  }

  if (!body.projectId) {
    return NextResponse.json({ error: "Select a project for this task." }, { status: 400 })
  }

  if (!Array.isArray(body.tags) || body.tags.length === 0) {
    return NextResponse.json({ error: "Add at least one tag." }, { status: 400 })
  }

  if (!dueDate || Number.isNaN(dueDate.getTime())) {
    return NextResponse.json({ error: "Choose a valid task due date." }, { status: 400 })
  }

  if (body.projectId) {
    if (!(await userOwnsProject(body.projectId, session.user.id))) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
  }

  const task = await Task.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    {
      title,
      description,
      status: body.status,
      priority: body.priority,
      projectId: body.projectId,
      assignedTo,
      tags: body.tags,
      dueDate,
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
