"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import {
  CameraIcon,
  CheckCircle2Icon,
  BarChart3Icon,
  BellIcon,
  KeyRoundIcon,
  LaptopIcon,
  FolderPlusIcon,
  ListChecksIcon,
  Loader2Icon,
  MoonIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SunIcon,
  Trash2Icon,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { ProjectSectionCharts, TaskSectionCharts } from "@/components/dashboard/project-task-section-charts"
import { ProductivitySuggestions } from "@/components/dashboard/productivity-suggestions"
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed"
import { SectionHeading } from "@/components/dashboard/section-heading"
import { TeamCollaboration } from "@/components/dashboard/team-collaboration"
import { ProjectForm } from "@/components/projects/project-form"
import { ProjectList } from "@/components/projects/project-list"
import { SiteHeader } from "@/components/site-header"
import { TaskForm } from "@/components/tasks/task-form"
import { TaskList } from "@/components/tasks/task-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmationModal } from "@/components/confirmation-modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Project, Task } from "@/types"

type ViewMode = "list" | "create" | "edit"
type ActiveView = "overview" | "projects" | "tasks" | "team" | "analytics" | "settings"
type DeleteTarget =
  | { type: "project"; id: string; name: string }
  | { type: "task"; id: string; name: string }
  | { type: "account"; id: "account"; name: string }
type PaginationMeta = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}
type ProjectFilters = {
  query: string
  status: Project["status"] | "all"
  priority: Project["priority"] | "all"
}
type TaskFilters = {
  query: string
  status: Task["status"] | "all"
  priority: Task["priority"] | "all"
  projectId: string
}

const LIST_PAGE_SIZE = 10

async function readJsonResponse<T>(response: Response): Promise<T> {
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || "Request failed")
  }

  return data
}

function readPageParam(value: string | null) {
  const page = Number(value)
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
}

function readProjectStatusParam(value: string | null): Project["status"] | "all" {
  return value === "planning" ||
    value === "in-progress" ||
    value === "completed" ||
    value === "on-hold"
    ? value
    : "all"
}

function readTaskStatusParam(value: string | null): Task["status"] | "all" {
  return value === "todo" || value === "in-progress" || value === "completed" ? value : "all"
}

function readPriorityParam(value: string | null): Project["priority"] | "all" {
  return value === "low" || value === "medium" || value === "high" ? value : "all"
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const tab = searchParams.get("tab")
  const mode = searchParams.get("mode")
  const activeView: ActiveView =
    tab === "projects" ||
    tab === "tasks" ||
    tab === "team" ||
    tab === "analytics" ||
    tab === "settings"
      ? tab
      : "overview"
  const projectPage = readPageParam(searchParams.get("projectPage"))
  const taskPage = readPageParam(searchParams.get("taskPage"))
  const projectFilters: ProjectFilters = {
    query: searchParams.get("projectSearch") ?? "",
    status: readProjectStatusParam(searchParams.get("projectStatus")),
    priority: readPriorityParam(searchParams.get("projectPriority")),
  }
  const taskFilters: TaskFilters = {
    query: searchParams.get("taskSearch") ?? "",
    status: readTaskStatusParam(searchParams.get("taskStatus")),
    priority: readPriorityParam(searchParams.get("taskPriority")),
    projectId: searchParams.get("taskProject") ?? "all",
  }

  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [projectRows, setProjectRows] = useState<Project[]>([])
  const [taskRows, setTaskRows] = useState<Task[]>([])
  const [projectPagination, setProjectPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: LIST_PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  })
  const [taskPagination, setTaskPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: LIST_PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isProjectTableLoading, setIsProjectTableLoading] = useState(false)
  const [isTaskTableLoading, setIsTaskTableLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [projectViewMode, setProjectViewMode] = useState<ViewMode>("list")
  const [taskViewMode, setTaskViewMode] = useState<ViewMode>("list")
  const [editingProject, setEditingProject] = useState<Project | undefined>()
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
  })
  const [profileMessage, setProfileMessage] = useState("")
  const [profileError, setProfileError] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError("")

    try {
      const [projectsResponse, tasksResponse] = await Promise.all([
        fetch("/api/projects?all=true", { cache: "no-store" }),
        fetch("/api/tasks?all=true", { cache: "no-store" }),
      ])

      const [projectData, taskData] = await Promise.all([
        readJsonResponse<{ projects: Project[] }>(projectsResponse),
        readJsonResponse<{ tasks: Task[] }>(tasksResponse),
      ])

      setProjects(projectData.projects)
      setTasks(taskData.tasks)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadProjectRows = useCallback(async () => {
    setIsProjectTableLoading(true)
    setError("")

    try {
      const params = new URLSearchParams({
        page: String(projectPage),
        limit: String(LIST_PAGE_SIZE),
      })

      if (projectFilters.query.trim()) params.set("q", projectFilters.query.trim())
      if (projectFilters.status !== "all") params.set("status", projectFilters.status)
      if (projectFilters.priority !== "all") params.set("priority", projectFilters.priority)

      const response = await fetch(`/api/projects?${params.toString()}`, { cache: "no-store" })
      const data = await readJsonResponse<{ projects: Project[]; pagination: PaginationMeta }>(response)

      setProjectRows(data.projects)
      setProjectPagination(data.pagination)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load project table data")
    } finally {
      setIsProjectTableLoading(false)
    }
  }, [projectFilters.priority, projectFilters.query, projectFilters.status, projectPage])

  const loadTaskRows = useCallback(async () => {
    setIsTaskTableLoading(true)
    setError("")

    try {
      const params = new URLSearchParams({
        page: String(taskPage),
        limit: String(LIST_PAGE_SIZE),
      })

      if (taskFilters.query.trim()) params.set("q", taskFilters.query.trim())
      if (taskFilters.status !== "all") params.set("status", taskFilters.status)
      if (taskFilters.priority !== "all") params.set("priority", taskFilters.priority)
      if (taskFilters.projectId !== "all") params.set("projectId", taskFilters.projectId)

      const response = await fetch(`/api/tasks?${params.toString()}`, { cache: "no-store" })
      const data = await readJsonResponse<{ tasks: Task[]; pagination: PaginationMeta }>(response)

      setTaskRows(data.tasks)
      setTaskPagination(data.pagination)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load task table data")
    } finally {
      setIsTaskTableLoading(false)
    }
  }, [taskFilters.priority, taskFilters.projectId, taskFilters.query, taskFilters.status, taskPage])

  useEffect(() => {
    const timeout = window.setTimeout(loadDashboardData, 0)
    return () => window.clearTimeout(timeout)
  }, [loadDashboardData])

  useEffect(() => {
    const timeout = window.setTimeout(loadProjectRows, 0)
    return () => window.clearTimeout(timeout)
  }, [loadProjectRows])

  useEffect(() => {
    const timeout = window.setTimeout(loadTaskRows, 0)
    return () => window.clearTimeout(timeout)
  }, [loadTaskRows])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setProjectViewMode(activeView === "projects" && mode === "create" ? "create" : "list")
      setTaskViewMode(activeView === "tasks" && mode === "create" ? "create" : "list")
      setEditingProject(undefined)
      setEditingTask(undefined)
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [activeView, mode])

  const navigateTo = (view: ActiveView) => {
    router.push(view === "overview" ? "/dashboard" : `/dashboard?tab=${view}`)
  }

  const navigateToPage = (view: "projects" | "tasks", page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", view)
    params.delete("mode")
    params.set(view === "projects" ? "projectPage" : "taskPage", String(page))
    router.push(`/dashboard?${params.toString()}`)
  }

  const updateProjectFilters = (nextFilters: ProjectFilters) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "projects")
    params.delete("mode")
    params.set("projectPage", "1")

    if (nextFilters.query.trim()) {
      params.set("projectSearch", nextFilters.query)
    } else {
      params.delete("projectSearch")
    }

    if (nextFilters.status !== "all") {
      params.set("projectStatus", nextFilters.status)
    } else {
      params.delete("projectStatus")
    }

    if (nextFilters.priority !== "all") {
      params.set("projectPriority", nextFilters.priority)
    } else {
      params.delete("projectPriority")
    }

    router.push(`/dashboard?${params.toString()}`)
  }

  const updateTaskFilters = (nextFilters: TaskFilters) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "tasks")
    params.delete("mode")
    params.set("taskPage", "1")

    if (nextFilters.query.trim()) {
      params.set("taskSearch", nextFilters.query)
    } else {
      params.delete("taskSearch")
    }

    if (nextFilters.status !== "all") {
      params.set("taskStatus", nextFilters.status)
    } else {
      params.delete("taskStatus")
    }

    if (nextFilters.priority !== "all") {
      params.set("taskPriority", nextFilters.priority)
    } else {
      params.delete("taskPriority")
    }

    if (nextFilters.projectId !== "all") {
      params.set("taskProject", nextFilters.projectId)
    } else {
      params.delete("taskProject")
    }

    router.push(`/dashboard?${params.toString()}`)
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
      setProjectRows((previousProjects) =>
        editingProject
          ? previousProjects.map((item) => (item.id === project.id ? project : item))
          : [project, ...previousProjects].slice(0, LIST_PAGE_SIZE)
      )
      setProjectViewMode("list")
      setEditingProject(undefined)
      router.replace("/dashboard?tab=projects")
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
      setTaskRows((previousTasks) =>
        editingTask
          ? previousTasks.map((item) => (item.id === task.id ? task : item))
          : [task, ...previousTasks].slice(0, LIST_PAGE_SIZE)
      )
      setTaskViewMode("list")
      setEditingTask(undefined)
      router.replace("/dashboard?tab=tasks")
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
      setProjectRows((previousProjects) =>
        previousProjects.filter((project) => project.id !== projectId)
      )
      setTasks((previousTasks) => previousTasks.filter((task) => task.projectId !== projectId))
      setTaskRows((previousTasks) => previousTasks.filter((task) => task.projectId !== projectId))
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
      setTaskRows((previousTasks) => previousTasks.filter((task) => task.id !== taskId))
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to delete task")
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return
    }

    setIsDeleting(true)

    try {
      if (deleteTarget.type === "project") {
        await handleDeleteProject(deleteTarget.id)
      } else if (deleteTarget.type === "task") {
        await handleDeleteTask(deleteTarget.id)
      } else {
        setProfileError("Account deletion is protected. Connect the delete account API before enabling this action.")
      }

      setDeleteTarget(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleTaskComplete = async (taskId: string, completed: boolean) => {
    const task = taskRows.find((item) => item.id === taskId)
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
      setTaskRows((previousTasks) =>
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
    const productivityPercentage =
      tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

    return {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks,
      overdueTasks,
      productivityPercentage,
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
      title: "View analytics",
      description: "Use charts to understand work velocity.",
      icon: BarChart3Icon,
      action: () => navigateTo("analytics"),
      label: "View chart",
    },
  ]

  const renderOverview = () => (
    <div className="dashboard-enter space-y-6">
      <SectionHeading
        title="Dashboard Overview"
        description="Live productivity signals, task activity, and project health across your workspace."
      />
      <ChartAreaInteractive tasks={tasks} />
      <DashboardStats stats={stats} />
      <ProductivitySuggestions
        projects={projects}
        tasks={tasks}
        onOpenAnalytics={() => navigateTo("analytics")}
        onOpenProjects={() => navigateTo("projects")}
        onOpenTasks={() => navigateTo("tasks")}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {capabilityCards.map((item) => (
          <Card key={item.title} className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
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
        <RecentActivityFeed projects={projects} tasks={tasks} />
        <ProjectList
          projects={projects.slice(0, 5)}
          tasks={tasks}
          onView={() => navigateTo("projects")}
        />
      </div>

      <div className="grid gap-6">
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
      <div className="space-y-6">
        <SectionHeading
          title="Project Management"
          description="Create, prioritize, and track project delivery across your workspace."
          action={
            <Button onClick={() => setProjectViewMode("create")}>
              <FolderPlusIcon className="size-4" />
              New project
            </Button>
          }
        />
        <ProjectSectionCharts projects={projects} tasks={tasks} />
        <ProjectList
          projects={projectRows}
          tasks={tasks}
          filters={projectFilters}
          isLoading={isProjectTableLoading}
          pagination={{
            ...projectPagination,
            onPageChange: (page) => navigateToPage("projects", page),
          }}
          onFiltersChange={updateProjectFilters}
          onEdit={(project) => {
            setEditingProject(project)
            setProjectViewMode("edit")
          }}
          onDelete={(projectId) => {
            const project = projectRows.find((item) => item.id === projectId)
            setDeleteTarget({
              type: "project",
              id: projectId,
              name: project?.name || "this project",
            })
          }}
          onView={(project) => {
            setEditingProject(project)
            setProjectViewMode("edit")
          }}
        />
      </div>
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
      <div className="space-y-6">
        <SectionHeading
          title="Task Management"
          description="Search, filter, assign, prioritize, and complete tasks by project."
          action={
            <Button onClick={() => setTaskViewMode("create")}>
              <ListChecksIcon className="size-4" />
              New task
            </Button>
          }
        />
        <TaskSectionCharts tasks={tasks} />
        <TaskList
          tasks={taskRows}
          projects={projects}
          filters={taskFilters}
          isLoading={isTaskTableLoading}
          pagination={{
            ...taskPagination,
            onPageChange: (page) => navigateToPage("tasks", page),
          }}
          onFiltersChange={updateTaskFilters}
          onEdit={(task) => {
            setEditingTask(task)
            setTaskViewMode("edit")
          }}
          onDelete={(taskId) => {
            const task = taskRows.find((item) => item.id === taskId)
            setDeleteTarget({
              type: "task",
              id: taskId,
              name: task?.title || "this task",
            })
          }}
          onToggleComplete={handleToggleTaskComplete}
          onView={(task) => {
            setEditingTask(task)
            setTaskViewMode("edit")
          }}
        />
      </div>
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

  const handleProfileSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setProfileError("")
    setProfileMessage("")

    const fullName = (profileForm.fullName || session?.user?.name || "").trim()
    const email = (profileForm.email || session?.user?.email || "").trim().toLowerCase()
    const phone = profileForm.phone.trim()

    if (fullName.length < 2) {
      setProfileError("Full name must be at least 2 characters long.")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setProfileError("Enter a valid email address.")
      return
    }

    if (phone && !/^[+\d][\d\s().-]{7,}$/.test(phone)) {
      setProfileError("Enter a valid phone number.")
      return
    }

    setProfileForm({ fullName, email, phone })
    setProfileMessage("Profile settings look good. Saving to the database can be connected next.")
  }

  const renderSettings = () => (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <SectionHeading
        title="Settings"
        description="Manage profile, account, and notification preferences."
      />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CameraIcon className="size-4" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleProfileSubmit}>
              <div className="flex items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-lg bg-primary/10 text-lg font-semibold text-primary">
                  {(profileForm.fullName || session?.user?.name || "TU")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-picture">Profile picture</Label>
                  <Input id="profile-picture" type="file" accept="image/*" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input
                    id="full-name"
                    value={profileForm.fullName || session?.user?.name || ""}
                    onChange={(event) =>
                      setProfileForm((previous) => ({ ...previous, fullName: event.target.value }))
                    }
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={profileForm.email || session?.user?.email || ""}
                    onChange={(event) =>
                      setProfileForm((previous) => ({ ...previous, email: event.target.value }))
                    }
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  value={profileForm.phone}
                  onChange={(event) =>
                    setProfileForm((previous) => ({ ...previous, phone: event.target.value }))
                  }
                  placeholder="+1 555 010 1234"
                />
              </div>

              {profileError && <p className="text-sm text-destructive">{profileError}</p>}
              {profileMessage && <p className="text-sm text-emerald-600">{profileMessage}</p>}

              <Button type="submit">Save profile</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheckIcon className="size-4" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <KeyRoundIcon className="size-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Change password</p>
                  <p className="text-xs text-muted-foreground">Update your login credentials.</p>
                </div>
              </div>
              <Button size="sm" variant="outline">Change</Button>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <LaptopIcon className="size-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Connected devices</p>
                  <p className="text-xs text-muted-foreground">Current device active now.</p>
                </div>
              </div>
              <Button size="sm" variant="outline">View</Button>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <CheckCircle2Icon className="size-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Account verification</p>
                  <p className="text-xs text-muted-foreground">Email verification status.</p>
                </div>
              </div>
              <Button size="sm" variant="outline">Verify</Button>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 p-3">
              <div className="flex items-center gap-3">
                <Trash2Icon className="size-4 text-destructive" />
                <div>
                  <p className="text-sm font-medium">Delete account</p>
                  <p className="text-xs text-muted-foreground">Permanently remove your account.</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  setDeleteTarget({
                    type: "account",
                    id: "account",
                    name: session?.user?.email || "your account",
                  })
                }
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BellIcon className="size-4" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
              Push notifications
              <input type="checkbox" defaultChecked className="size-4 accent-primary" />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
              Task reminders
              <input type="checkbox" defaultChecked className="size-4 accent-primary" />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
              Project updates
              <input type="checkbox" defaultChecked className="size-4 accent-primary" />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
              Weekly summary
              <input type="checkbox" className="size-4 accent-primary" />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SunIcon className="size-4" />
              Theme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <span className="text-sm text-muted-foreground">Appearance</span>
              <Select value={theme ?? "system"} onValueChange={setTheme}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">
                    <SunIcon />
                    Light
                  </SelectItem>
                  <SelectItem value="dark">
                    <MoonIcon />
                    Dark
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3 text-sm text-muted-foreground">
              <ShieldAlertIcon className="size-4 text-primary" />
              Sensitive account actions should be confirmed before they are applied.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderDashboardLoading = () => (
    <div className="dashboard-enter space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="space-y-3">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="flex items-center justify-center gap-3 py-12 text-sm text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin text-primary" />
          Loading dashboard data...
        </CardContent>
      </Card>
    </div>
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
                renderDashboardLoading()
              ) : (
                <>
                  {activeView === "overview" && renderOverview()}
                  {activeView === "projects" && renderProjects()}
                  {activeView === "tasks" && renderTasks()}
                  {activeView === "team" && <TeamCollaboration />}
                  {activeView === "analytics" && (
                    <AnalyticsDashboard projects={projects} tasks={tasks} />
                  )}
                  {activeView === "settings" && renderSettings()}
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
      <ConfirmationModal
        open={Boolean(deleteTarget)}
        title="Confirm delete"
        description={
          deleteTarget?.type === "project"
            ? `Delete "${deleteTarget.name}"? This will also remove its related tasks from your dashboard.`
            : deleteTarget?.type === "task"
              ? `Delete "${deleteTarget.name}"? This action cannot be undone.`
              : deleteTarget?.type === "account"
                ? `Delete ${deleteTarget.name}? This is a protected action and needs a connected account deletion API.`
                : ""
        }
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
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
