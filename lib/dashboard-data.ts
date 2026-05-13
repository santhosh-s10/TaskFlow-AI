import mongoose from "mongoose"

import type { Project, Task } from "@/types"

export const PROJECT_COLLECTIONS = [
  "projectscollections",
  "projects",
  "projectcollection",
  "projectscollection",
]

export const TASK_COLLECTIONS = [
  "taskcollection",
  "tasks",
  "taskscollection",
  "taskscollections",
]

type RawDocument = Record<string, unknown> & {
  _id?: { toString(): string }
  id?: string | number
  createdAt?: Date | string
  updatedAt?: Date | string
}

function uniqueCollectionNames(names: string[]) {
  return Array.from(new Set(names))
}

function getCollection(name: string) {
  if (!mongoose.connection.db) {
    throw new Error("Database connection is not ready")
  }

  return mongoose.connection.db.collection(name)
}

function normalizeDate(value: unknown, fallback = new Date()) {
  const date = value ? new Date(value as string | Date) : fallback
  return Number.isNaN(date.getTime()) ? fallback : date
}

function toDateInput(value: unknown) {
  return normalizeDate(value).toISOString().split("T")[0]
}

function toIsoString(value: unknown) {
  return normalizeDate(value).toISOString()
}

function toId(document: RawDocument) {
  return document._id?.toString() ?? String(document.id ?? "")
}

export function serializeProjectDocument(project: RawDocument): Project {
  return {
    id: toId(project),
    name: String(project.name ?? "Untitled project"),
    description: String(project.description ?? ""),
    status:
      project.status === "in-progress" ||
      project.status === "completed" ||
      project.status === "on-hold"
        ? project.status
        : "planning",
    priority:
      project.priority === "low" || project.priority === "high" ? project.priority : "medium",
    dueDate: toDateInput(project.dueDate),
    createdAt: toIsoString(project.createdAt),
    updatedAt: toIsoString(project.updatedAt),
  }
}

export function serializeTaskDocument(task: RawDocument): Task {
  const projectId = task.projectId as { toString(): string } | string | number | undefined

  return {
    id: toId(task),
    title: String(task.title ?? task.name ?? "Untitled task"),
    description: String(task.description ?? ""),
    status:
      task.status === "in-progress" || task.status === "completed" ? task.status : "todo",
    priority: task.priority === "low" || task.priority === "high" ? task.priority : "medium",
    projectId: projectId?.toString() ?? "",
    assignedTo: String(task.assignedTo ?? ""),
    tags: Array.isArray(task.tags) ? task.tags.map(String) : [],
    dueDate: toDateInput(task.dueDate),
    createdAt: toIsoString(task.createdAt),
    updatedAt: toIsoString(task.updatedAt),
  }
}

async function claimImportedDocuments(collections: string[], userId: string) {
  await Promise.all(
    uniqueCollectionNames(collections).map((name) =>
      getCollection(name).updateMany(
        {
          $or: [{ userId: { $exists: false } }, { userId: null }, { userId: "" }],
        },
        { $set: { userId } }
      )
    )
  )
}

export async function getUserProjects(userId: string) {
  await claimImportedDocuments(PROJECT_COLLECTIONS, userId)

  const results = await Promise.all(
    uniqueCollectionNames(PROJECT_COLLECTIONS).map((name) =>
      getCollection(name).find({ userId }).sort({ createdAt: -1, _id: -1 }).toArray()
    )
  )

  return results.flat().map((project) => serializeProjectDocument(project as RawDocument))
}

export async function getUserTasks(userId: string) {
  await claimImportedDocuments(TASK_COLLECTIONS, userId)

  const results = await Promise.all(
    uniqueCollectionNames(TASK_COLLECTIONS).map((name) =>
      getCollection(name).find({ userId }).sort({ createdAt: -1, _id: -1 }).toArray()
    )
  )

  return results.flat().map((task) => serializeTaskDocument(task as RawDocument))
}

export async function userOwnsProject(projectId: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return false
  }

  const _id = new mongoose.Types.ObjectId(projectId)
  const matches = await Promise.all(
    uniqueCollectionNames(PROJECT_COLLECTIONS).map((name) =>
      getCollection(name).findOne({ _id, userId }, { projection: { _id: 1 } })
    )
  )

  return matches.some(Boolean)
}
