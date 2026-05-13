"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import {
  CalendarDaysIcon,
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
  onEdit,
  onDelete,
  onView,
}: ProjectListProps) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<Project["status"] | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<Project["priority"] | "all">("all")

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return projects.filter((project) => {
      const matchesSearch =
        !normalizedQuery ||
        project.name.toLowerCase().includes(normalizedQuery) ||
        project.description.toLowerCase().includes(normalizedQuery)
      const matchesStatus = statusFilter === "all" || project.status === statusFilter
      const matchesPriority =
        priorityFilter === "all" || project.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [priorityFilter, projects, query, statusFilter])

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
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects..."
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as Project["status"] | "all")}
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
            value={priorityFilter}
            onValueChange={(value) => setPriorityFilter(value as Project["priority"] | "all")}
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
                    <p className="font-medium text-foreground">No projects found</p>
                    <p className="text-sm">
                      Adjust the filters or create a new project to start planning work.
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
      </CardContent>
    </Card>
  )
}
