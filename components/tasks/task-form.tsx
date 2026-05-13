"use client"

import { useState } from "react"
import { Task, Project } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Loader2Icon, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface TaskFormProps {
  task?: Task
  projects: Project[]
  onSubmit: (task: Partial<Task>) => void
  onCancel: () => void
  isLoading?: boolean
}

type TaskFormData = {
  title: string
  description: string
  status: Task['status']
  priority: Task['priority']
  projectId: string
  assignedTo: string
  tags: string[]
  dueDate: Date
}

export function TaskForm({ task, projects, onSubmit, onCancel, isLoading }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo' as Task['status'],
    priority: task?.priority || 'medium' as Task['priority'],
    projectId: task?.projectId || '',
    assignedTo: task?.assignedTo || '',
    tags: task?.tags || [] as string[],
    dueDate: task?.dueDate ? new Date(task.dueDate) : new Date(),
  })

  const [newTag, setNewTag] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: Partial<Record<keyof TaskFormData, string>> = {}
    const trimmedTitle = formData.title.trim()
    const trimmedDescription = formData.description.trim()
    const trimmedAssignedTo = formData.assignedTo.trim()

    if (!trimmedTitle) {
      nextErrors.title = "Task title is required."
    } else if (trimmedTitle.length > 120) {
      nextErrors.title = "Task title must be 120 characters or fewer."
    }

    if (!trimmedDescription) {
      nextErrors.description = "Task description is required."
    } else if (trimmedDescription.length > 500) {
      nextErrors.description = "Description must be 500 characters or fewer."
    }

    if (!formData.projectId) {
      nextErrors.projectId = "Select a project for this task."
    }

    if (!trimmedAssignedTo) {
      nextErrors.assignedTo = "Assignee email is required."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedAssignedTo)) {
      nextErrors.assignedTo = "Enter a valid assignee email address."
    }

    if (formData.tags.length === 0) {
      nextErrors.tags = "Add at least one tag."
    }

    if (!formData.dueDate || Number.isNaN(formData.dueDate.getTime())) {
      nextErrors.dueDate = "Choose a valid due date."
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    onSubmit({
      ...formData,
      title: trimmedTitle,
      description: trimmedDescription,
      assignedTo: trimmedAssignedTo,
      dueDate: formData.dueDate.toISOString().split('T')[0],
      ...(task ? { id: task.id } : {}),
    })
  }

  const handleInputChange = <K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      if (newTag.trim().length > 24) {
        setErrors(prev => ({ ...prev, tags: "Tags must be 24 characters or fewer." }))
        return
      }
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{task ? 'Edit Task' : 'Create New Task'}</CardTitle>
        <CardDescription>
          {task ? 'Update task information' : 'Fill in the details to create a new task'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter task title"
              aria-invalid={Boolean(errors.title)}
              required
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your task"
              rows={3}
              aria-invalid={Boolean(errors.description)}
              required
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => handleInputChange('projectId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && <p className="text-sm text-destructive">{errors.projectId}</p>}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value as Task['status'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value as Task['priority'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Input
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                placeholder="email@example.com"
                type="email"
                aria-invalid={Boolean(errors.assignedTo)}
                required
              />
              {errors.assignedTo && <p className="text-sm text-destructive">{errors.assignedTo}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
            {errors.tags && <p className="text-sm text-destructive">{errors.tags}</p>}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.dueDate}
                  onSelect={(date) => date && handleInputChange('dueDate', date)}
                />
              </PopoverContent>
            </Popover>
            {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2Icon className="size-4 animate-spin" />}
              {isLoading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
