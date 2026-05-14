import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

import { authOptions } from "@/lib/auth"
import connectToDatabase from "@/lib/mongodb"
import { serializeProject } from "@/lib/serializers"
import Project, { type IProject } from "@/models/Project"

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 50
type ProjectQuery = {
  userId: string
  $or?: Array<{ name?: RegExp; description?: RegExp }>
  status?: IProject["status"]
  priority?: IProject["priority"]
}

function getPaginationParams(request: NextRequest) {
  const pageParam = Number(request.nextUrl.searchParams.get("page") ?? "1")
  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE))
  const limit = Math.min(Math.max(Number.isFinite(limitParam) ? Math.floor(limitParam) : DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)
  const page = Math.max(Number.isFinite(pageParam) ? Math.floor(pageParam) : 1, 1)

  return { page, limit }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function getProjectQuery(request: NextRequest, userId: string): ProjectQuery {
  const query: ProjectQuery = { userId }
  const search = request.nextUrl.searchParams.get("q")?.trim()
  const status = request.nextUrl.searchParams.get("status")
  const priority = request.nextUrl.searchParams.get("priority")

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i")
    query.$or = [{ name: searchRegex }, { description: searchRegex }]
  }

  if (
    status === "planning" ||
    status === "in-progress" ||
    status === "completed" ||
    status === "on-hold"
  ) {
    query.status = status
  }

  if (priority === "low" || priority === "medium" || priority === "high") {
    query.priority = priority
  }

  return query
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await connectToDatabase()

  if (request.nextUrl.searchParams.get("all") === "true") {
    const projects = await Project.find({ userId: session.user.id }).sort({ createdAt: -1, _id: -1 })
    return NextResponse.json({ projects: projects.map(serializeProject) })
  }

  const query = getProjectQuery(request, session.user.id)
  const { page, limit } = getPaginationParams(request)
  const total = await Project.countDocuments(query)
  const totalPages = Math.max(Math.ceil(total / limit), 1)
  const currentPage = Math.min(page, totalPages)
  const projects = await Project.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .skip((currentPage - 1) * limit)
    .limit(limit)

  return NextResponse.json({
    projects: projects.map(serializeProject),
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
