import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

import { authOptions } from "@/lib/auth"
import connectToDatabase from "@/lib/mongodb"
import { serializeTask } from "@/lib/serializers"
import Project from "@/models/Project"
import Task from "@/models/Task"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await connectToDatabase()

  const tasks = await Task.find({ userId: session.user.id }).sort({ createdAt: -1 })
  return NextResponse.json({ tasks: tasks.map(serializeTask) })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  await connectToDatabase()

  const project = await Project.findOne({ _id: body.projectId, userId: session.user.id })
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const task = await Task.create({
    title: body.title,
    description: body.description,
    status: body.status,
    priority: body.priority,
    projectId: body.projectId,
    assignedTo: body.assignedTo,
    tags: body.tags,
    dueDate: body.dueDate,
    userId: session.user.id,
  })

  return NextResponse.json({ task: serializeTask(task) }, { status: 201 })
}
