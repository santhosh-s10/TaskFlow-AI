"use client"

import { useMemo } from "react"
import type { ReactNode } from "react"
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  BotIcon,
  CheckCircle2Icon,
  ClockIcon,
  FlameIcon,
  TrendingDownIcon,
} from "lucide-react"

import type { Project, Task } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type SuggestionTone = "danger" | "warning" | "info" | "success"

type Suggestion = {
  title: string
  detail: string
  tone: SuggestionTone
  icon: ReactNode
  actionLabel: string
  onAction: () => void
}

interface ProductivitySuggestionsProps {
  projects: Project[]
  tasks: Task[]
  onOpenAnalytics: () => void
  onOpenProjects: () => void
  onOpenTasks: () => void
}

const toneClasses: Record<SuggestionTone, string> = {
  danger: "border-destructive/30 bg-destructive/5 text-destructive",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  info: "border-primary/25 bg-primary/5 text-primary",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
}

function isBeforeToday(dateValue: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const date = new Date(dateValue)
  date.setHours(0, 0, 0, 0)

  return date < today
}

function daysBetween(start: Date, end: Date) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / millisecondsPerDay))
}

export function ProductivitySuggestions({
  projects,
  tasks,
  onOpenAnalytics,
  onOpenProjects,
  onOpenTasks,
}: ProductivitySuggestionsProps) {
  const suggestions = useMemo<Suggestion[]>(() => {
    const openTasks = tasks.filter((task) => task.status !== "completed")
    const completedTasks = tasks.filter((task) => task.status === "completed")
    const overdueTasks = openTasks.filter((task) => isBeforeToday(task.dueDate))
    const highPriorityTasks = openTasks.filter((task) => task.priority === "high")

    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    const fourteenDaysAgo = new Date(now)
    fourteenDaysAgo.setDate(now.getDate() - 14)

    const completedThisWeek = completedTasks.filter((task) => {
      const updatedAt = new Date(task.updatedAt)
      return updatedAt >= sevenDaysAgo
    }).length

    const completedLastWeek = completedTasks.filter((task) => {
      const updatedAt = new Date(task.updatedAt)
      return updatedAt >= fourteenDaysAgo && updatedAt < sevenDaysAgo
    }).length

    const activeProjects = projects.filter((project) => project.status !== "completed")
    const projectProgress = activeProjects
      .map((project) => {
        const projectTasks = tasks.filter((task) => task.projectId === project.id)
        const remainingTasks = projectTasks.filter((task) => task.status !== "completed").length
        const completedProjectTasks = projectTasks.length - remainingTasks
        const completion =
          projectTasks.length === 0
            ? 0
            : Math.round((completedProjectTasks / projectTasks.length) * 100)

        return {
          project,
          remainingTasks,
          completion,
        }
      })
      .filter((item) => item.remainingTasks > 0)
      .sort((first, second) => second.completion - first.completion)

    const estimatedProject = projectProgress[0]
    const suggestionsList: Suggestion[] = []

    if (overdueTasks.length > 0) {
      suggestionsList.push({
        title: `${overdueTasks.length} ${overdueTasks.length === 1 ? "task is" : "tasks are"} overdue`,
        detail: "Start with overdue work before adding new commitments.",
        tone: "danger",
        icon: <AlertTriangleIcon className="size-4" />,
        actionLabel: "Review tasks",
        onAction: onOpenTasks,
      })
    }

    if (highPriorityTasks.length > 0) {
      suggestionsList.push({
        title: "High-priority tasks need attention",
        detail: `${highPriorityTasks.length} open high-priority ${highPriorityTasks.length === 1 ? "task" : "tasks"} should be handled next.`,
        tone: "warning",
        icon: <FlameIcon className="size-4" />,
        actionLabel: "Open tasks",
        onAction: onOpenTasks,
      })
    }

    if (completedLastWeek > 0 && completedThisWeek < completedLastWeek) {
      suggestionsList.push({
        title: "Your productivity dropped this week",
        detail: `Completed ${completedThisWeek} this week versus ${completedLastWeek} last week.`,
        tone: "info",
        icon: <TrendingDownIcon className="size-4" />,
        actionLabel: "Check analytics",
        onAction: onOpenAnalytics,
      })
    }

    if (estimatedProject) {
      const dailyPace = Math.max(1, Math.ceil(completedThisWeek / 7))
      const estimatedDays = daysBetween(
        now,
        new Date(now.getTime() + (estimatedProject.remainingTasks / dailyPace) * 86400000)
      )

      suggestionsList.push({
        title: `${estimatedProject.project.name} estimated in ${estimatedDays} ${estimatedDays === 1 ? "day" : "days"}`,
        detail: `${estimatedProject.completion}% complete with ${estimatedProject.remainingTasks} ${estimatedProject.remainingTasks === 1 ? "task" : "tasks"} remaining.`,
        tone: "success",
        icon: <ClockIcon className="size-4" />,
        actionLabel: "View projects",
        onAction: onOpenProjects,
      })
    }

    if (suggestionsList.length === 0) {
      suggestionsList.push({
        title: "Workload looks balanced",
        detail: "No overdue or high-priority blockers found right now.",
        tone: "success",
        icon: <CheckCircle2Icon className="size-4" />,
        actionLabel: "View tasks",
        onAction: onOpenTasks,
      })
    }

    return suggestionsList.slice(0, 4)
  }, [onOpenAnalytics, onOpenProjects, onOpenTasks, projects, tasks])

  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <BotIcon className="size-5 text-primary" />
            AI Suggestions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Smart productivity signals based on your current projects and tasks.
          </p>
        </div>
        <Badge variant="outline">Rule-based</Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.title}
              className={cn("flex min-h-40 flex-col justify-between rounded-lg border p-4", toneClasses[suggestion.tone])}
            >
              <div className="space-y-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-background/80">
                  {suggestion.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">{suggestion.title}</h3>
                  <p className="text-sm text-muted-foreground">{suggestion.detail}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="mt-4 w-fit px-0 text-foreground hover:bg-transparent"
                onClick={suggestion.onAction}
              >
                {suggestion.actionLabel}
                <ArrowRightIcon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
