"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EditIcon,
  EyeIcon,
  ListChecksIcon,
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
import { Checkbox } from "@/components/ui/checkbox"
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

interface TaskListProps {
  tasks: Task[]
  projects?: Project[]
  filters?: {
    query: string
    status: Task["status"] | "all"
    priority: Task["priority"] | "all"
    projectId: string
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
    status: Task["status"] | "all"
    priority: Task["priority"] | "all"
    projectId: string
  }) => void
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onView?: (task: Task) => void
  onToggleComplete?: (taskId: string, completed: boolean) => void
}

const statusLabels: Record<Task["status"], string> = {
  todo: "To do",
  "in-progress": "In progress",
  completed: "Completed",
}

const priorityLabels: Record<Task["priority"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

const statusClasses: Record<Task["status"], string> = {
  todo: "bg-muted text-muted-foreground",
  "in-progress": "bg-primary/10 text-primary",
  completed: "bg-foreground text-background",
}

const priorityClasses: Record<Task["priority"], string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-accent text-accent-foreground",
  high: "bg-destructive/10 text-destructive",
}

export function TaskList({
  tasks,
  projects = [],
  filters,
  pagination,
  isLoading = false,
  onFiltersChange,
  onEdit,
  onDelete,
  onView,
  onToggleComplete,
}: TaskListProps) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<Task["status"] | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<Task["priority"] | "all">("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const activeQuery = filters?.query ?? query
  const activeStatusFilter = filters?.status ?? statusFilter
  const activePriorityFilter = filters?.priority ?? priorityFilter
  const activeProjectFilter = filters?.projectId ?? projectFilter

  const updateFilters = (nextFilters: {
    query?: string
    status?: Task["status"] | "all"
    priority?: Task["priority"] | "all"
    projectId?: string
  }) => {
    const mergedFilters = {
      query: nextFilters.query ?? activeQuery,
      status: nextFilters.status ?? activeStatusFilter,
      priority: nextFilters.priority ?? activePriorityFilter,
      projectId: nextFilters.projectId ?? activeProjectFilter,
    }

    if (onFiltersChange) {
      onFiltersChange(mergedFilters)
      return
    }

    setQuery(mergedFilters.query)
    setStatusFilter(mergedFilters.status)
    setPriorityFilter(mergedFilters.priority)
    setProjectFilter(mergedFilters.projectId)
  }

  const projectNameById = useMemo(() => {
    return new Map(projects.map((project) => [project.id, project.name]))
  }, [projects])

  const getProjectName = (projectId: string) => {
    return projectNameById.get(projectId) || "Unknown project"
  }

  const isOverdue = (task: Task) => {
    return new Date(task.dueDate) < new Date() && task.status !== "completed"
  }

  const filteredTasks = useMemo(() => {
    if (pagination) {
      return tasks
    }

    const normalizedQuery = activeQuery.trim().toLowerCase()

    return tasks.filter((task) => {
      const projectName = projectNameById.get(task.projectId) || "Unknown project"
      const matchesSearch =
        !normalizedQuery ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        task.description.toLowerCase().includes(normalizedQuery) ||
        projectName.toLowerCase().includes(normalizedQuery) ||
        task.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
      const matchesStatus = activeStatusFilter === "all" || task.status === activeStatusFilter
      const matchesPriority = activePriorityFilter === "all" || task.priority === activePriorityFilter
      const matchesProject = activeProjectFilter === "all" || task.projectId === activeProjectFilter

      return matchesSearch && matchesStatus && matchesPriority && matchesProject
    })
  }, [
    activePriorityFilter,
    activeProjectFilter,
    activeQuery,
    activeStatusFilter,
    pagination,
    projectNameById,
    tasks,
  ])

  const openTasks = tasks.filter((task) => task.status !== "completed").length
  const overdueTasks = tasks.filter(isOverdue).length

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{openTasks} open</Badge>
          <Badge variant={overdueTasks > 0 ? "destructive" : "secondary"}>
            {overdueTasks} overdue
          </Badge>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_220px]">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={activeQuery}
              onChange={(event) => updateFilters({ query: event.target.value })}
              placeholder="Search tasks, tags, projects..."
              className="pl-9"
            />
          </div>
          <Select
            value={activeStatusFilter}
            onValueChange={(value) => updateFilters({ status: value as Task["status"] | "all" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="todo">To do</SelectItem>
              <SelectItem value="in-progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={activePriorityFilter}
            onValueChange={(value) => updateFilters({ priority: value as Task["priority"] | "all" })}
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
          <Select value={activeProjectFilter} onValueChange={(value) => updateFilters({ projectId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={cn("grid gap-3 transition-opacity lg:hidden", isLoading && "opacity-60")} aria-busy={isLoading}>
          {filteredTasks.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              <ListChecksIcon className="mx-auto mb-2 size-8 text-primary" />
              <p className="font-medium text-foreground">
                {isLoading ? "Loading tasks..." : "No tasks found"}
              </p>
              <p className="mt-1 text-sm">
                {isLoading
                  ? "Fetching the next set of task rows."
                  : "Try a different search, clear filters, or create a task for a project."}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={cn("space-y-4 rounded-lg border p-4", task.status === "completed" && "opacity-70")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    {onToggleComplete && (
                      <Checkbox
                        checked={task.status === "completed"}
                        aria-label={`Mark ${task.title} complete`}
                        onCheckedChange={(checked) => onToggleComplete(task.id, checked === true)}
                        className="mt-1"
                      />
                    )}
                    <div className="min-w-0 space-y-1">
                      <h3
                        className={cn(
                          "break-words font-medium leading-snug",
                          task.status === "completed" && "line-through",
                          isOverdue(task) && "text-destructive"
                        )}
                      >
                        {task.title}
                      </h3>
                      <p className="line-clamp-3 break-words text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="Open task actions">
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(task)}>
                          <EyeIcon className="size-4" />
                          View
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(task)}>
                          <EditIcon className="size-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(task.id)}
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
                  <Badge className={statusClasses[task.status]}>
                    {statusLabels[task.status]}
                  </Badge>
                  <Badge className={priorityClasses[task.priority]}>
                    {priorityLabels[task.priority]}
                  </Badge>
                  <Badge variant="outline">{getProjectName(task.projectId)}</Badge>
                </div>

                {task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <div className="break-all">Owner: {task.assignedTo || "Unassigned"}</div>
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      isOverdue(task) && "text-destructive"
                    )}
                  >
                    <CalendarIcon className="size-4" />
                    {format(new Date(task.dueDate), "MMM dd")}
                    {isOverdue(task) && <span className="text-xs">Overdue</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={cn("hidden transition-opacity lg:block", isLoading && "opacity-60")} aria-busy={isLoading}>
          <Table className="table-fixed border-separate border-spacing-0">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 whitespace-normal" />
                <TableHead className="w-[28%] whitespace-normal">Task</TableHead>
                <TableHead className="w-[16%] whitespace-normal">Project</TableHead>
                <TableHead className="w-[12%] whitespace-normal">Status</TableHead>
                <TableHead className="w-[12%] whitespace-normal">Priority</TableHead>
                <TableHead className="w-[16%] whitespace-normal">Owner</TableHead>
                <TableHead className="w-[12%] whitespace-normal">Due date</TableHead>
                <TableHead className="w-[72px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-muted-foreground">
                      <ListChecksIcon className="size-8 text-primary" />
                      <p className="font-medium text-foreground">
                        {isLoading ? "Loading tasks..." : "No tasks found"}
                      </p>
                      <p className="text-sm">
                        {isLoading
                          ? "Fetching the next set of task rows."
                          : "Try a different search, clear filters, or create a task for a project."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.id} className={cn(task.status === "completed" && "opacity-65")}>
                  <TableCell>
                    {onToggleComplete && (
                      <Checkbox
                        checked={task.status === "completed"}
                        aria-label={`Mark ${task.title} complete`}
                        onCheckedChange={(checked) => onToggleComplete(task.id, checked === true)}
                      />
                    )}
                  </TableCell>
                  <TableCell className="whitespace-normal break-words">
                    <div className="space-y-2">
                      <div
                        className={cn(
                          "font-medium",
                          task.status === "completed" && "line-through",
                          isOverdue(task) && "text-destructive"
                        )}
                      >
                        {task.title}
                      </div>
                      <div className="text-sm leading-snug text-muted-foreground">
                        {task.description}
                      </div>
                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map((tag) => (
                            <Badge key={tag} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words text-sm">{getProjectName(task.projectId)}</TableCell>
                  <TableCell className="whitespace-normal">
                    <Badge className={statusClasses[task.status]}>
                      {statusLabels[task.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <Badge className={priorityClasses[task.priority]}>
                      {priorityLabels[task.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-normal break-all text-sm">{task.assignedTo || "Unassigned"}</TableCell>
                  <TableCell className="whitespace-normal">
                    <div
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        isOverdue(task) && "text-destructive"
                      )}
                    >
                      <CalendarIcon className="size-4" />
                      {format(new Date(task.dueDate), "MMM dd")}
                      {isOverdue(task) && <span className="text-xs">Overdue</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label="Open task actions">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(task)}>
                            <EyeIcon className="size-4" />
                            View
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(task)}>
                            <EditIcon className="size-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(task.id)}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {pagination && (
          <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing {filteredTasks.length} of {pagination.totalItems} tasks
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
