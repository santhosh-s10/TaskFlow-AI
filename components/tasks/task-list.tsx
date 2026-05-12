"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import {
  CalendarIcon,
  EditIcon,
  EyeIcon,
  ListChecksIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"

import type { Project, Task } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onView?: (task: Task) => void
  onCreate?: () => void
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
  onEdit,
  onDelete,
  onView,
  onCreate,
  onToggleComplete,
}: TaskListProps) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<Task["status"] | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<Task["priority"] | "all">("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")

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
    const normalizedQuery = query.trim().toLowerCase()

    return tasks.filter((task) => {
      const projectName = projectNameById.get(task.projectId) || "Unknown project"
      const matchesSearch =
        !normalizedQuery ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        task.description.toLowerCase().includes(normalizedQuery) ||
        projectName.toLowerCase().includes(normalizedQuery) ||
        task.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
      const matchesStatus = statusFilter === "all" || task.status === statusFilter
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter
      const matchesProject = projectFilter === "all" || task.projectId === projectFilter

      return matchesSearch && matchesStatus && matchesPriority && matchesProject
    })
  }, [priorityFilter, projectFilter, projectNameById, query, statusFilter, tasks])

  const openTasks = tasks.filter((task) => task.status !== "completed").length
  const overdueTasks = tasks.filter(isOverdue).length

  return (
    <Card>
      <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <CardTitle>Task Management</CardTitle>
          <CardDescription>
            Search, filter, assign, prioritize, and complete tasks by project.
          </CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="secondary">{openTasks} open</Badge>
            <Badge variant={overdueTasks > 0 ? "destructive" : "secondary"}>
              {overdueTasks} overdue
            </Badge>
          </div>
        </div>
        {onCreate && (
          <Button onClick={onCreate}>
            <PlusIcon className="size-4" />
            New task
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_220px]">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks, tags, projects..."
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as Task["status"] | "all")}
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
            value={priorityFilter}
            onValueChange={(value) => setPriorityFilter(value as Task["priority"] | "all")}
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
          <Select value={projectFilter} onValueChange={setProjectFilter}>
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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Task</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead className="w-[72px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-muted-foreground">
                    <ListChecksIcon className="size-8 text-primary" />
                    <p className="font-medium text-foreground">No tasks found</p>
                    <p className="text-sm">
                      Try a different search, clear filters, or create a task for a project.
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
                  <TableCell>
                    <div className="min-w-60 space-y-2">
                      <div
                        className={cn(
                          "font-medium",
                          task.status === "completed" && "line-through",
                          isOverdue(task) && "text-destructive"
                        )}
                      >
                        {task.title}
                      </div>
                      <div className="line-clamp-1 text-sm text-muted-foreground">
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
                  <TableCell className="text-sm">{getProjectName(task.projectId)}</TableCell>
                  <TableCell>
                    <Badge className={statusClasses[task.status]}>
                      {statusLabels[task.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityClasses[task.priority]}>
                      {priorityLabels[task.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{task.assignedTo || "Unassigned"}</TableCell>
                  <TableCell>
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
      </CardContent>
    </Card>
  )
}
