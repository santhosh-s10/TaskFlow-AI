"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import {
  AlertTriangleIcon,
  CameraIcon,
  CheckCircle2Icon,
  BarChart3Icon,
  BellIcon,
  KeyRoundIcon,
  LaptopIcon,
  FolderPlusIcon,
  LineChartIcon,
  ListChecksIcon,
  Loader2Icon,
  MoonIcon,
  ShieldAlertIcon,
  Settings2Icon,
  ShieldCheckIcon,
  SunIcon,
  Trash2Icon,
} from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { ProductivitySuggestions } from "@/components/dashboard/productivity-suggestions"
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed"
import { TeamCollaboration } from "@/components/dashboard/team-collaboration"
import { ProjectForm } from "@/components/projects/project-form"
import { ProjectList } from "@/components/projects/project-list"
import { SiteHeader } from "@/components/site-header"
import { TaskForm } from "@/components/tasks/task-form"
import { TaskList } from "@/components/tasks/task-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
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

  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
      action: () => navigateTo("analytics"),
      label: "View chart",
    },
  ]

  const renderOverview = () => (
    <div className="dashboard-enter space-y-6">
      <ChartAreaInteractive />
      <DashboardStats stats={stats} />
      <ProductivitySuggestions
        projects={projects}
        tasks={tasks}
        onOpenAnalytics={() => navigateTo("analytics")}
        onOpenProjects={() => navigateTo("projects")}
        onOpenTasks={() => navigateTo("tasks")}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
        <ProjectList
          projects={projects.slice(0, 5)}
          tasks={tasks}
          onView={() => navigateTo("projects")}
        />
        <RecentActivityFeed projects={projects} tasks={tasks} />
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
      <ProjectList
        projects={projects}
        tasks={tasks}
        onCreate={() => setProjectViewMode("create")}
        onEdit={(project) => {
          setEditingProject(project)
          setProjectViewMode("edit")
        }}
        onDelete={(projectId) => {
          const project = projects.find((item) => item.id === projectId)
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
        onDelete={(taskId) => {
          const task = tasks.find((item) => item.id === taskId)
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
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Settings2Icon className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage profile, account, and notification preferences.</p>
        </div>
      </div>

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
        {Array.from({ length: 5 }).map((_, index) => (
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
      <Drawer open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="size-5 text-destructive" />
              Confirm delete
            </DrawerTitle>
            <DrawerDescription>
              {deleteTarget?.type === "project" &&
                `Delete "${deleteTarget.name}"? This will also remove its related tasks from your dashboard.`}
              {deleteTarget?.type === "task" &&
                `Delete "${deleteTarget.name}"? This action cannot be undone.`}
              {deleteTarget?.type === "account" &&
                `Delete ${deleteTarget.name}? This is a protected action and needs a connected account deletion API.`}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting && <Loader2Icon className="size-4 animate-spin" />}
              Delete
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" disabled={isDeleting}>
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
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
