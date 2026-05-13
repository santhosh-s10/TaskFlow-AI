"use client"

import { useMemo } from "react"
import type { ReactNode } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  CheckCircle2Icon,
  CircleDotIcon,
  FolderKanbanIcon,
  ListChecksIcon,
} from "lucide-react"

import type { Project, Task } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RecentActivityFeedProps {
  projects: Project[]
  tasks: Task[]
}

type ActivityItem = {
  id: string
  title: string
  detail: string
  timestamp: string
  icon: ReactNode
  badge: string
}

export function RecentActivityFeed({ projects, tasks }: RecentActivityFeedProps) {
  const activities = useMemo<ActivityItem[]>(() => {
    const projectActivities = projects.map((project) => ({
      id: `project-${project.id}`,
      title: project.name,
      detail:
        project.status === "completed"
          ? "Project marked completed"
          : "Project updated",
      timestamp: project.updatedAt || project.createdAt,
      icon: <FolderKanbanIcon className="size-4" />,
      badge: "Project",
    }))

    const taskActivities = tasks.map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      detail:
        task.status === "completed"
          ? "Task completed"
          : task.status === "in-progress"
            ? "Task moved to in progress"
            : "Task updated",
      timestamp: task.updatedAt || task.createdAt,
      icon:
        task.status === "completed" ? (
          <CheckCircle2Icon className="size-4" />
        ) : (
          <ListChecksIcon className="size-4" />
        ),
      badge: "Task",
    }))

    return [...projectActivities, ...taskActivities]
      .sort((first, second) => {
        return new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime()
      })
      .slice(0, 8)
  }, [projects, tasks])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleDotIcon className="size-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No recent project or task activity yet.
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  {activity.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.detail}</p>
                    </div>
                    <Badge variant="outline">{activity.badge}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
