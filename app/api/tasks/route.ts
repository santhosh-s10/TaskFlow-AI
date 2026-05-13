import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

import { authOptions } from "@/lib/auth"
import { userOwnsProject } from "@/lib/dashboard-data"
import connectToDatabase from "@/lib/mongodb"
import { serializeTask } from "@/lib/serializers"
import Task from "@/models/Task"

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 50

function getPaginationParams(request: NextRequest) {
  const pageParam = Number(request.nextUrl.searchParams.get("page") ?? "1")
  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE))
  const limit = Math.min(Math.max(Number.isFinite(limitParam) ? Math.floor(limitParam) : DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)
  const page = Math.max(Number.isFinite(pageParam) ? Math.floor(pageParam) : 1, 1)

  return { page, limit }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await connectToDatabase()

  if (request.nextUrl.searchParams.get("all") === "true") {
    const tasks = await Task.find({ userId: session.user.id }).sort({ createdAt: -1, _id: -1 })
    return NextResponse.json({ tasks: tasks.map(serializeTask) })
  }

  const { page, limit } = getPaginationParams(request)
  const total = await Task.countDocuments({ userId: session.user.id })
  const totalPages = Math.max(Math.ceil(total / limit), 1)
  const currentPage = Math.min(page, totalPages)
  const tasks = await Task.find({ userId: session.user.id })
    .sort({ createdAt: -1, _id: -1 })
    .skip((currentPage - 1) * limit)
    .limit(limit)

  return NextResponse.json({
    tasks: tasks.map(serializeTask),
    pagination: {
      page: currentPage,
      pageSize: limit,
      totalItems: total,
      totalPages,
    },
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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

  if (!(await userOwnsProject(body.projectId, session.user.id))) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const task = await Task.create({
    title,
    description,
    status: body.status,
    priority: body.priority,
    projectId: body.projectId,
    assignedTo,
    tags: body.tags,
    dueDate,
    userId: session.user.id,
  })

  return NextResponse.json({ task: serializeTask(task) }, { status: 201 })
}
