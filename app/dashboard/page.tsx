"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  BarChart3Icon,
  FolderPlusIcon,
  LineChartIcon,
  ListChecksIcon,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { ProjectForm } from "@/components/projects/project-form"
import { ProjectList } from "@/components/projects/project-list"
import { SiteHeader } from "@/components/site-header"
import { TaskForm } from "@/components/tasks/task-form"
import { TaskList } from "@/components/tasks/task-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { Project, Task } from "@/types"

type ViewMode = "list" | "create" | "edit"
type ActiveView = "overview" | "projects" | "tasks"

async function readJsonResponse<T>(response: Response): Promise<T> {
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || "Request failed")
  }

  return data
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab")
  const activeView: ActiveView =
    tab === "projects" || tab === "tasks" ? tab : "overview"

  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [projectViewMode, setProjectViewMode] = useState<ViewMode>("list")
  const [taskViewMode, setTaskViewMode] = useState<ViewMode>("list")
  const [editingProject, setEditingProject] = useState<Project | undefined>()
  const [editingTask, setEditingTask] = useState<Task | undefined>()

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError("")

    try {
      const [projectsResponse, tasksResponse] = await Promise.all([
        fetch("/api/projects", { cache: "no-store" }),
        fetch("/api/tasks", { cache: "no-store" }),
      ])

      const [{ projects }, { tasks }] = await Promise.all([
        readJsonResponse<{ projects: Project[] }>(projectsResponse),
        readJsonResponse<{ tasks: Task[] }>(tasksResponse),
      ])

      setProjects(projects)
      setTasks(tasks)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(loadDashboardData, 0)
    return () => window.clearTimeout(timeout)
  }, [loadDashboardData])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setProjectViewMode("list")
      setTaskViewMode("list")
      setEditingProject(undefined)
      setEditingTask(undefined)
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [activeView])

  const navigateTo = (view: ActiveView) => {
    router.push(view === "overview" ? "/dashboard" : `/dashboard?tab=${view}`)
  }

  const handleProjectSubmit = async (projectData: Partial<Project>) => {
    setIsSaving(true)
    setError("")

    try {
      const response = await fetch(
        editingProject ? `/api/projects/${editingProject.id}` : "/api/projects",
        {
          method: editingProject ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectData),
        }
      )
      const { project } = await readJsonResponse<{ project: Project }>(response)

      setProjects((previousProjects) =>
        editingProject
          ? previousProjects.map((item) => (item.id === project.id ? project : item))
          : [project, ...previousProjects]
      )
      setProjectViewMode("list")
      setEditingProject(undefined)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save project")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTaskSubmit = async (taskData: Partial<Task>) => {
    setIsSaving(true)
    setError("")

    try {
      const response = await fetch(editingTask ? `/api/tasks/${editingTask.id}` : "/api/tasks", {
        method: editingTask ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      })
      const { task } = await readJsonResponse<{ task: Task }>(response)

      setTasks((previousTasks) =>
        editingTask
          ? previousTasks.map((item) => (item.id === task.id ? task : item))
          : [task, ...previousTasks]
      )
      setTaskViewMode("list")
      setEditingTask(undefined)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save task")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    setError("")

    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" })
      await readJsonResponse<{ success: boolean }>(response)
      setProjects((previousProjects) =>
        previousProjects.filter((project) => project.id !== projectId)
      )
      setTasks((previousTasks) => previousTasks.filter((task) => task.projectId !== projectId))
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to delete project")
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    setError("")

    try {
      const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
      await readJsonResponse<{ success: boolean }>(response)
      setTasks((previousTasks) => previousTasks.filter((task) => task.id !== taskId))
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to delete task")
    }
  }

  const handleToggleTaskComplete = async (taskId: string, completed: boolean) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) {
      return
    }

    setError("")

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...task,
          status: completed ? "completed" : "todo",
        }),
      })
      const { task: updatedTask } = await readJsonResponse<{ task: Task }>(response)
      setTasks((previousTasks) =>
        previousTasks.map((item) => (item.id === updatedTask.id ? updatedTask : item))
      )
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to update task")
    }
  }

  const stats = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.status === "completed").length
    const pendingTasks = tasks.filter((task) => task.status === "todo").length
    const overdueTasks = tasks.filter((task) => {
      return new Date(task.dueDate) < new Date() && task.status !== "completed"
    }).length

    return {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks,
      overdueTasks,
    }
  }, [projects.length, tasks])

  const capabilityCards = [
    {
      title: "Create projects",
      description: "Start a new workspace for upcoming work.",
      icon: FolderPlusIcon,
      action: () => {
        navigateTo("projects")
        setProjectViewMode("create")
      },
      label: "New project",
    },
    {
      title: "Manage tasks",
      description: "Review priorities, ownership, and due dates.",
      icon: ListChecksIcon,
      action: () => navigateTo("tasks"),
      label: "View tasks",
    },
    {
      title: "Track productivity",
      description: "Watch completion and pending work trends.",
      icon: LineChartIcon,
      action: () => navigateTo("overview"),
      label: "Open overview",
    },
    {
      title: "View analytics",
      description: "Use charts to understand work velocity.",
      icon: BarChart3Icon,
      action: () => navigateTo("overview"),
      label: "View chart",
    },
  ]

  const renderOverview = () => (
    <div className="space-y-6">
      <ChartAreaInteractive />
      <DashboardStats stats={stats} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {capabilityCards.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <item.icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{item.description}</p>
              <Button size="sm" variant="outline" onClick={item.action}>
                {item.label}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProjectList
          projects={projects.slice(0, 5)}
          tasks={tasks}
          onView={() => navigateTo("projects")}
        />
        <TaskList
          tasks={tasks.slice(0, 5)}
          projects={projects}
          onView={() => navigateTo("tasks")}
        />
      </div>
    </div>
  )

  const renderProjects = () =>
    projectViewMode === "list" ? (
      <ProjectList
        projects={projects}
        tasks={tasks}
        onCreate={() => setProjectViewMode("create")}
        onEdit={(project) => {
          setEditingProject(project)
          setProjectViewMode("edit")
        }}
        onDelete={handleDeleteProject}
        onView={(project) => {
          setEditingProject(project)
          setProjectViewMode("edit")
        }}
      />
    ) : (
      <ProjectForm
        project={editingProject}
        onSubmit={handleProjectSubmit}
        onCancel={() => {
          setProjectViewMode("list")
          setEditingProject(undefined)
        }}
        isLoading={isSaving}
      />
    )

  const renderTasks = () =>
    taskViewMode === "list" ? (
      <TaskList
        tasks={tasks}
        projects={projects}
        onCreate={() => setTaskViewMode("create")}
        onEdit={(task) => {
          setEditingTask(task)
          setTaskViewMode("edit")
        }}
        onDelete={handleDeleteTask}
        onToggleComplete={handleToggleTaskComplete}
        onView={(task) => {
          setEditingTask(task)
          setTaskViewMode("edit")
        }}
      />
    ) : (
      <TaskForm
        task={editingTask}
        projects={projects}
        onSubmit={handleTaskSubmit}
        onCancel={() => {
          setTaskViewMode("list")
          setEditingTask(undefined)
        }}
        isLoading={isSaving}
      />
    )

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
              {error && (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="py-3 text-sm text-destructive">{error}</CardContent>
                </Card>
              )}

              {isLoading ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    Loading dashboard data...
                  </CardContent>
                </Card>
              ) : (
                <>
                  {activeView === "overview" && renderOverview()}
                  {activeView === "projects" && renderProjects()}
                  {activeView === "tasks" && renderTasks()}
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-svh bg-background p-6 text-sm text-muted-foreground">
          Loading dashboard...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
