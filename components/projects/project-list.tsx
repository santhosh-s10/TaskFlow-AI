"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EditIcon,
  EyeIcon,
  FolderKanbanIcon,
  MoreHorizontalIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"

import type { Project, Task } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface ProjectListProps {
  projects: Project[]
  tasks?: Task[]
  filters?: {
    query: string
    status: Project["status"] | "all"
    priority: Project["priority"] | "all"
  }
  pagination?: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    onPageChange: (page: number) => void
  }
  isLoading?: boolean
  onFiltersChange?: (filters: {
    query: string
    status: Project["status"] | "all"
    priority: Project["priority"] | "all"
  }) => void
  onEdit?: (project: Project) => void
  onDelete?: (projectId: string) => void
  onView?: (project: Project) => void
}

const statusLabels: Record<Project["status"], string> = {
  planning: "Planning",
  "in-progress": "In progress",
  completed: "Completed",
  "on-hold": "On hold",
}

const priorityLabels: Record<Project["priority"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

const statusClasses: Record<Project["status"], string> = {
  planning: "bg-secondary text-secondary-foreground",
  "in-progress": "bg-primary/10 text-primary",
  completed: "bg-foreground text-background",
  "on-hold": "bg-muted text-muted-foreground",
}

const priorityClasses: Record<Project["priority"], string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-accent text-accent-foreground",
  high: "bg-destructive/10 text-destructive",
}

export function ProjectList({
  projects,
  tasks = [],
  filters,
  pagination,
  isLoading = false,
  onFiltersChange,
  onEdit,
  onDelete,
  onView,
}: ProjectListProps) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<Project["status"] | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<Project["priority"] | "all">("all")
  const activeQuery = filters?.query ?? query
  const activeStatusFilter = filters?.status ?? statusFilter
  const activePriorityFilter = filters?.priority ?? priorityFilter

  const updateFilters = (nextFilters: {
    query?: string
    status?: Project["status"] | "all"
    priority?: Project["priority"] | "all"
  }) => {
    const mergedFilters = {
      query: nextFilters.query ?? activeQuery,
      status: nextFilters.status ?? activeStatusFilter,
      priority: nextFilters.priority ?? activePriorityFilter,
    }

    if (onFiltersChange) {
      onFiltersChange(mergedFilters)
      return
    }

    setQuery(mergedFilters.query)
    setStatusFilter(mergedFilters.status)
    setPriorityFilter(mergedFilters.priority)
  }

  const filteredProjects = useMemo(() => {
    if (pagination) {
      return projects
    }

    const normalizedQuery = activeQuery.trim().toLowerCase()

    return projects.filter((project) => {
      const matchesSearch =
        !normalizedQuery ||
        project.name.toLowerCase().includes(normalizedQuery) ||
        project.description.toLowerCase().includes(normalizedQuery)
      const matchesStatus = activeStatusFilter === "all" || project.status === activeStatusFilter
      const matchesPriority =
        activePriorityFilter === "all" || project.priority === activePriorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [activePriorityFilter, activeQuery, activeStatusFilter, pagination, projects])

  const getProjectTasks = (projectId: string) => {
    return tasks.filter((task) => task.projectId === projectId)
  }

  const getProjectProgress = (projectId: string) => {
    const projectTasks = getProjectTasks(projectId)
    if (projectTasks.length === 0) {
      return 0
    }

    const completedTasks = projectTasks.filter((task) => task.status === "completed").length
    return Math.round((completedTasks / projectTasks.length) * 100)
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={activeQuery}
              onChange={(event) => updateFilters({ query: event.target.value })}
              placeholder="Search projects..."
              className="pl-9"
            />
          </div>
          <Select
            value={activeStatusFilter}
            onValueChange={(value) => updateFilters({ status: value as Project["status"] | "all" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in-progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on-hold">On hold</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={activePriorityFilter}
            onValueChange={(value) => updateFilters({ priority: value as Project["priority"] | "all" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className={cn("grid gap-3 transition-opacity lg:hidden", isLoading && "opacity-60")} aria-busy={isLoading}>
          {filteredProjects.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              <FolderKanbanIcon className="mx-auto mb-2 size-8 text-primary" />
              <p className="font-medium text-foreground">
                {isLoading ? "Loading projects..." : "No projects found"}
              </p>
              <p className="mt-1 text-sm">
                {isLoading
                  ? "Fetching the next set of project rows."
                  : "Adjust the filters or create a new project to start planning work."}
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const projectTasks = getProjectTasks(project.id)
              const progress = getProjectProgress(project.id)

              return (
                <div key={project.id} className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <h3 className="break-words font-medium leading-snug">{project.name}</h3>
                      <p className="line-clamp-3 break-words text-sm text-muted-foreground">
                        {project.description}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label="Open project actions">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(project)}>
                            <EyeIcon className="size-4" />
                            View
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(project)}>
                            <EditIcon className="size-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(project.id)}
                            className="text-destructive"
                          >
                            <Trash2Icon className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={statusClasses[project.status]}>
                      {statusLabels[project.status]}
                    </Badge>
                    <Badge className={priorityClasses[project.priority]}>
                      {priorityLabels[project.priority]}
                    </Badge>
                    <Badge variant="outline">
                      {projectTasks.length} {projectTasks.length === 1 ? "task" : "tasks"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Completion</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div
                    className={cn(
                      "flex items-center gap-2 text-sm",
                      new Date(project.dueDate) < new Date() &&
                        project.status !== "completed" &&
                        "text-destructive"
                    )}
                  >
                    <CalendarDaysIcon className="size-4" />
                    {format(new Date(project.dueDate), "MMM dd, yyyy")}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className={cn("hidden transition-opacity lg:block", isLoading && "opacity-60")} aria-busy={isLoading}>
          <Table className="table-fixed border-separate border-spacing-0">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[32%] whitespace-normal">Project</TableHead>
                <TableHead className="w-[13%] whitespace-normal">Status</TableHead>
                <TableHead className="w-[12%] whitespace-normal">Priority</TableHead>
                <TableHead className="w-[20%] whitespace-normal">Progress</TableHead>
                <TableHead className="w-[15%] whitespace-normal">Due date</TableHead>
                <TableHead className="w-[72px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-muted-foreground">
                      <FolderKanbanIcon className="size-8 text-primary" />
                      <p className="font-medium text-foreground">
                        {isLoading ? "Loading projects..." : "No projects found"}
                      </p>
                      <p className="text-sm">
                        {isLoading
                          ? "Fetching the next set of project rows."
                          : "Adjust the filters or create a new project to start planning work."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => {
                  const projectTasks = getProjectTasks(project.id)
                  const progress = getProjectProgress(project.id)

                  return (
                    <TableRow key={project.id}>
                    <TableCell className="whitespace-normal break-words">
                      <div className="space-y-1">
                        <div className="font-medium leading-snug">{project.name}</div>
                        <div className="text-sm leading-snug text-muted-foreground">
                          {project.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {projectTasks.length} {projectTasks.length === 1 ? "task" : "tasks"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <Badge className={statusClasses[project.status]}>
                        {statusLabels[project.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <Badge className={priorityClasses[project.priority]}>
                        {priorityLabels[project.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Completion</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <div
                        className={cn(
                          "flex items-center gap-2 text-sm",
                          new Date(project.dueDate) < new Date() &&
                            project.status !== "completed" &&
                            "text-destructive"
                        )}
                      >
                        <CalendarDaysIcon className="size-4" />
                        {format(new Date(project.dueDate), "MMM dd, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Open project actions">
                            <MoreHorizontalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(project)}>
                              <EyeIcon className="size-4" />
                              View
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(project)}>
                              <EditIcon className="size-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(project.id)}
                              className="text-destructive"
                            >
                              <Trash2Icon className="size-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        {pagination && (
          <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing {filteredProjects.length} of {pagination.totalItems} projects
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading || pagination.page <= 1}
                onClick={() => pagination.onPageChange(pagination.page - 1)}
              >
                <ChevronLeftIcon className="size-4" />
                Previous
              </Button>
              <span className="min-w-24 text-center">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading || pagination.page >= pagination.totalPages}
                onClick={() => pagination.onPageChange(pagination.page + 1)}
              >
                Next
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
