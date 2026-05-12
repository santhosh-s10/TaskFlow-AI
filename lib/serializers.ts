import type { HydratedDocument } from "mongoose"
import type { IProject } from "@/models/Project"
import type { ITask } from "@/models/Task"

export function serializeProject(project: HydratedDocument<IProject>) {
  return {
    id: project._id.toString(),
    name: project.name,
    description: project.description,
    status: project.status,
    priority: project.priority,
    dueDate: project.dueDate.toISOString().split("T")[0],
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }
}

export function serializeTask(task: HydratedDocument<ITask>) {
  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    projectId: task.projectId.toString(),
    assignedTo: task.assignedTo,
    tags: task.tags,
    dueDate: task.dueDate.toISOString().split("T")[0],
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }
}
