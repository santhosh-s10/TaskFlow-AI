"use client"

import { useState } from "react"
import { Project } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2Icon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface ProjectFormProps {
  project?: Project
  onSubmit: (project: Partial<Project>) => void
  onCancel: () => void
  isLoading?: boolean
}

type ProjectFormData = {
  name: string
  description: string
  status: Project['status']
  priority: Project['priority']
  dueDate: Date
}

export function ProjectForm({ project, onSubmit, onCancel, isLoading }: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'planning' as Project['status'],
    priority: project?.priority || 'medium' as Project['priority'],
    dueDate: project?.dueDate ? new Date(project.dueDate) : new Date(),
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: Partial<Record<keyof ProjectFormData, string>> = {}
    const trimmedName = formData.name.trim()
    const trimmedDescription = formData.description.trim()

    if (!trimmedName) {
      nextErrors.name = "Project name is required."
    } else if (trimmedName.length > 100) {
      nextErrors.name = "Project name must be 100 characters or fewer."
    }

    if (!trimmedDescription) {
      nextErrors.description = "Project description is required."
    } else if (trimmedDescription.length > 500) {
      nextErrors.description = "Description must be 500 characters or fewer."
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
      name: trimmedName,
      description: trimmedDescription,
      dueDate: formData.dueDate.toISOString().split('T')[0],
      ...(project ? { id: project.id } : {}),
    })
  }

  const handleInputChange = <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{project ? 'Edit Project' : 'Create New Project'}</CardTitle>
        <CardDescription>
          {project ? 'Update project information' : 'Fill in the details to create a new project'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter project name"
              aria-invalid={Boolean(errors.name)}
              required
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your project"
              rows={3}
              aria-invalid={Boolean(errors.description)}
              required
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value as Project['status'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value as Project['priority'])}
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
              {isLoading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
