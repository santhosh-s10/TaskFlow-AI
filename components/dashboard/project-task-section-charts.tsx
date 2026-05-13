"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import type { Project, Task } from "@/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const projectStatusConfig = {
  planning: { label: "Planning", color: "var(--chart-4)" },
  inProgress: { label: "In progress", color: "hsl(var(--primary))" },
  completed: { label: "Completed", color: "var(--chart-2)" },
  onHold: { label: "On hold", color: "var(--chart-5)" },
} satisfies ChartConfig

const projectProgressConfig = {
  progress: { label: "Progress", color: "hsl(var(--primary))" },
} satisfies ChartConfig

const taskStatusConfig = {
  todo: { label: "To do", color: "var(--chart-4)" },
  inProgress: { label: "In progress", color: "hsl(var(--primary))" },
  completed: { label: "Completed", color: "var(--chart-2)" },
} satisfies ChartConfig

const taskPriorityConfig = {
  low: { label: "Low", color: "var(--chart-3)" },
  medium: { label: "Medium", color: "var(--chart-4)" },
  high: { label: "High", color: "var(--chart-1)" },
} satisfies ChartConfig

interface ProjectSectionChartsProps {
  projects: Project[]
  tasks: Task[]
}

interface TaskSectionChartsProps {
  tasks: Task[]
}

export function ProjectSectionCharts({ projects, tasks }: ProjectSectionChartsProps) {
  const statusData = [
    { name: "Planning", value: projects.filter((project) => project.status === "planning").length, key: "planning" },
    { name: "In progress", value: projects.filter((project) => project.status === "in-progress").length, key: "inProgress" },
    { name: "Completed", value: projects.filter((project) => project.status === "completed").length, key: "completed" },
    { name: "On hold", value: projects.filter((project) => project.status === "on-hold").length, key: "onHold" },
  ]

  const progressData = projects.slice(0, 6).map((project) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id)
    const completedTasks = projectTasks.filter((task) => task.status === "completed").length
    const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0

    return {
      name: project.name.length > 16 ? `${project.name.slice(0, 16)}...` : project.name,
      progress,
    }
  })

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Project Status</CardTitle>
          <CardDescription>Current project distribution by status.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={projectStatusConfig} className="h-[240px] w-full">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82}>
                {statusData.map((item) => (
                  <Cell key={item.key} fill={`var(--color-${item.key})`} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
          <CardDescription>Completion percentage for recent projects.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={projectProgressConfig} className="h-[240px] w-full">
            <BarChart data={progressData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={112} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="progress" fill="var(--color-progress)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

export function TaskSectionCharts({ tasks }: TaskSectionChartsProps) {
  const statusData = [
    { name: "To do", value: tasks.filter((task) => task.status === "todo").length, key: "todo" },
    { name: "In progress", value: tasks.filter((task) => task.status === "in-progress").length, key: "inProgress" },
    { name: "Completed", value: tasks.filter((task) => task.status === "completed").length, key: "completed" },
  ]

  const priorityData = [
    { priority: "Low", count: tasks.filter((task) => task.priority === "low").length, key: "low" },
    { priority: "Medium", count: tasks.filter((task) => task.priority === "medium").length, key: "medium" },
    { priority: "High", count: tasks.filter((task) => task.priority === "high").length, key: "high" },
  ]

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Task Status</CardTitle>
          <CardDescription>Open and completed work across all projects.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={taskStatusConfig} className="h-[240px] w-full">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82}>
                {statusData.map((item) => (
                  <Cell key={item.key} fill={`var(--color-${item.key})`} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task Priority</CardTitle>
          <CardDescription>Priority mix for the current workload.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={taskPriorityConfig} className="h-[240px] w-full">
            <BarChart data={priorityData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="priority" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {priorityData.map((item) => (
                  <Cell key={item.key} fill={`var(--color-${item.key})`} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
