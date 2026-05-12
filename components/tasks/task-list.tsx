"use client"

import { useState } from "react"
import { Task, Project } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, Edit, Trash2, Plus, Eye, Calendar } from "lucide-react"
import { format } from "date-fns"

interface TaskListProps {
  tasks: Task[]
  projects?: Project[]
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onView?: (task: Task) => void
  onCreate?: () => void
  onToggleComplete?: (taskId: string, completed: boolean) => void
}

const statusColors = {
  'todo': 'bg-gray-100 text-gray-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  'completed': 'bg-green-100 text-green-800',
}

const priorityColors = {
  'low': 'bg-gray-100 text-gray-800',
  'medium': 'bg-orange-100 text-orange-800',
  'high': 'bg-red-100 text-red-800',
}

export function TaskList({ 
  tasks, 
  projects, 
  onEdit, 
  onDelete, 
  onView, 
  onCreate, 
  onToggleComplete 
}: TaskListProps) {
  const getProjectName = (projectId: string) => {
    return projects?.find(p => p.id === projectId)?.name || 'Unknown Project'
  }

  const isOverdue = (task: Task) => {
    const dueDate = new Date(task.dueDate)
    const today = new Date()
    return dueDate < today && task.status !== 'completed'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Manage and track your tasks across all projects</CardDescription>
        </div>
        {onCreate && (
          <Button onClick={onCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id} className={task.status === 'completed' ? 'opacity-60' : ''}>
                <TableCell>
                  {onToggleComplete && (
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={(checked) => onToggleComplete(task.id, checked as boolean)}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <div className={`font-medium ${isOverdue(task) ? 'text-red-600' : ''}`}>
                      {task.title}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {task.description}
                    </div>
                    {task.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {task.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {getProjectName(task.projectId)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[task.status]}>
                    {task.status.replace('-', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={priorityColors[task.priority]}>
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {task.assignedTo || 'Unassigned'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className={`text-sm flex items-center gap-1 ${isOverdue(task) ? 'text-red-600' : ''}`}>
                    <Calendar className="h-3 w-3" />
                    {format(new Date(task.dueDate), 'MMM dd')}
                    {isOverdue(task) && <span className="text-xs">(Overdue)</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(task)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(task)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(task.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
