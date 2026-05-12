"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { ProjectList } from "@/components/projects/project-list"
import { ProjectForm } from "@/components/projects/project-form"
import { TaskList } from "@/components/tasks/task-list"
import { TaskForm } from "@/components/tasks/task-form"
import { mockProjects, mockTasks } from "@/lib/mock-data"
import { Project, Task } from "@/types"

type ViewMode = 'list' | 'create' | 'edit'
type ActiveTab = 'overview' | 'projects' | 'tasks'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [projectViewMode, setProjectViewMode] = useState<ViewMode>('list')
  const [taskViewMode, setTaskViewMode] = useState<ViewMode>('list')
  const [editingProject, setEditingProject] = useState<Project | undefined>()
  const [editingTask, setEditingTask] = useState<Task | undefined>()

  const handleProjectSubmit = (projectData: Partial<Project>) => {
    if (editingProject) {
      setProjects(prev => prev.map(p => 
        p.id === editingProject.id 
          ? { ...p, ...projectData, updatedAt: new Date().toISOString() }
          : p
      ))
    } else {
      const newProject: Project = {
        id: Date.now().toString(),
        ...projectData as Omit<Project, 'id'>,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setProjects(prev => [...prev, newProject])
    }
    setProjectViewMode('list')
    setEditingProject(undefined)
  }

  const handleTaskSubmit = (taskData: Partial<Task>) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => 
        t.id === editingTask.id 
          ? { ...t, ...taskData, updatedAt: new Date().toISOString() }
          : t
      ))
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        ...taskData as Omit<Task, 'id'>,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setTasks(prev => [...prev, newTask])
    }
    setTaskViewMode('list')
    setEditingTask(undefined)
  }

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId))
    setTasks(prev => prev.filter(t => t.projectId !== projectId))
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const handleToggleTaskComplete = (taskId: string, completed: boolean) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: completed ? 'completed' : 'todo', updatedAt: new Date().toISOString() }
        : t
    ))
  }

  const calculateStats = () => {
    const completedTasks = tasks.filter(task => task.status === 'completed').length
    const pendingTasks = tasks.filter(task => task.status === 'todo').length
    const overdueTasks = tasks.filter(task => {
      const dueDate = new Date(task.dueDate)
      const today = new Date()
      return dueDate < today && task.status !== 'completed'
    }).length

    return {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks,
      overdueTasks,
    }
  }

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
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)} className="px-4 lg:px-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <DashboardStats stats={calculateStats()} />
                  
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Recent Projects</h3>
                      <ProjectList
                        projects={projects.slice(0, 5)}
                        onView={(project) => {
                          setEditingProject(project)
                          setActiveTab('projects')
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Recent Tasks</h3>
                      <TaskList
                        tasks={tasks.slice(0, 5)}
                        projects={projects}
                        onView={(task) => {
                          setEditingTask(task)
                          setActiveTab('tasks')
                        }}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="projects" className="space-y-6">
                  {projectViewMode === 'list' ? (
                    <ProjectList
                      projects={projects}
                      onCreate={() => setProjectViewMode('create')}
                      onEdit={(project) => {
                        setEditingProject(project)
                        setProjectViewMode('edit')
                      }}
                      onDelete={handleDeleteProject}
                      onView={(project) => {
                        setEditingProject(project)
                        setProjectViewMode('edit')
                      }}
                    />
                  ) : (
                    <ProjectForm
                      project={editingProject}
                      onSubmit={handleProjectSubmit}
                      onCancel={() => {
                        setProjectViewMode('list')
                        setEditingProject(undefined)
                      }}
                    />
                  )}
                </TabsContent>

                <TabsContent value="tasks" className="space-y-6">
                  {taskViewMode === 'list' ? (
                    <TaskList
                      tasks={tasks}
                      projects={projects}
                      onCreate={() => setTaskViewMode('create')}
                      onEdit={(task) => {
                        setEditingTask(task)
                        setTaskViewMode('edit')
                      }}
                      onDelete={handleDeleteTask}
                      onToggleComplete={handleToggleTaskComplete}
                      onView={(task) => {
                        setEditingTask(task)
                        setTaskViewMode('edit')
                      }}
                    />
                  ) : (
                    <TaskForm
                      task={editingTask}
                      projects={projects}
                      onSubmit={handleTaskSubmit}
                      onCancel={() => {
                        setTaskViewMode('list')
                        setEditingTask(undefined)
                      }}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
