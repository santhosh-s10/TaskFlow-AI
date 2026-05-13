"use client"

import {
  Area,
  AreaChart,
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
import { SectionHeading } from "@/components/dashboard/section-heading"

interface AnalyticsDashboardProps {
  projects: Project[]
  tasks: Task[]
}

const completionConfig = {
  completed: { label: "Completed", color: "hsl(var(--primary))" },
  active: { label: "Active", color: "var(--chart-2)" },
  pending: { label: "Pending", color: "var(--chart-4)" },
} satisfies ChartConfig

const projectCompletionConfig = {
  completed: { label: "Completed", color: "hsl(var(--primary))" },
  inProgress: { label: "In progress", color: "var(--chart-2)" },
  planning: { label: "Planning", color: "var(--chart-4)" },
  onHold: { label: "On hold", color: "var(--chart-5)" },
} satisfies ChartConfig

const trendConfig = {
  productivity: { label: "Productivity", color: "hsl(var(--primary))" },
  completed: { label: "Completed", color: "var(--chart-2)" },
} satisfies ChartConfig

const weeklyConfig = {
  planned: { label: "Planned", color: "var(--chart-4)" },
  completed: { label: "Completed", color: "hsl(var(--primary))" },
} satisfies ChartConfig

const progressConfig = {
  progress: { label: "Progress", color: "hsl(var(--primary))" },
} satisfies ChartConfig

function isInRange(value: string, start: Date, end: Date) {
  const date = new Date(value)
  return date >= start && date <= end
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function buildTrendData(tasks: Task[]) {
  const now = endOfDay(new Date())

  return Array.from({ length: 6 }, (_, index) => {
    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() - (5 - index) * 7)
    const weekStart = startOfDay(new Date(weekEnd))
    weekStart.setDate(weekEnd.getDate() - 6)

    const created = tasks.filter((task) => isInRange(task.createdAt, weekStart, weekEnd)).length
    const completed = tasks.filter(
      (task) => task.status === "completed" && isInRange(task.updatedAt, weekStart, weekEnd)
    ).length
    const productivity = created > 0 ? Math.round((completed / created) * 100) : completed > 0 ? 100 : 0

    return {
      week: `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      productivity,
      completed,
    }
  })
}

function buildWeeklyData(tasks: Task[]) {
  const now = new Date()
  const start = startOfDay(now)
  start.setDate(now.getDate() - 6)

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    const dayStart = startOfDay(day)
    const dayEnd = endOfDay(day)

    return {
      day: day.toLocaleDateString("en-US", { weekday: "short" }),
      planned: tasks.filter((task) => isInRange(task.createdAt, dayStart, dayEnd)).length,
      completed: tasks.filter(
        (task) => task.status === "completed" && isInRange(task.updatedAt, dayStart, dayEnd)
      ).length,
    }
  })
}

export function AnalyticsDashboard({ projects, tasks }: AnalyticsDashboardProps) {
  const completedTasks = tasks.filter((task) => task.status === "completed").length
  const activeTasks = tasks.filter((task) => task.status === "in-progress").length
  const pendingTasks = tasks.filter((task) => task.status === "todo").length

  const completionData = [
    { name: "Completed", value: completedTasks, key: "completed" },
    { name: "Active", value: activeTasks, key: "active" },
    { name: "Pending", value: pendingTasks, key: "pending" },
  ]
  const projectCompletionData = [
    { name: "Completed", value: projects.filter((project) => project.status === "completed").length, key: "completed" },
    { name: "In progress", value: projects.filter((project) => project.status === "in-progress").length, key: "inProgress" },
    { name: "Planning", value: projects.filter((project) => project.status === "planning").length, key: "planning" },
    { name: "On hold", value: projects.filter((project) => project.status === "on-hold").length, key: "onHold" },
  ]
  const trendData = buildTrendData(tasks)
  const weeklyData = buildWeeklyData(tasks)

  const projectProgressData = projects.slice(0, 8).map((project) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id)
    const completed = projectTasks.filter((task) => task.status === "completed").length
    const progress =
      projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0

    return {
      name: project.name.length > 18 ? `${project.name.slice(0, 18)}...` : project.name,
      progress,
    }
  })

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Analytics Dashboard"
        description="Live completion, productivity trend, weekly performance, and project progress charts."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Completion Chart</CardTitle>
            <CardDescription>Completed, active, planning, and paused projects.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={projectCompletionConfig} className="h-[280px] w-full">
              <PieChart>
                <Pie data={projectCompletionData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92}>
                  {projectCompletionData.map((item) => (
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
            <CardDescription>Completion percentage by project.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={progressConfig} className="h-[280px] w-full">
              <BarChart data={projectProgressData} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={120} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="progress" fill="var(--color-progress)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Completion Chart</CardTitle>
            <CardDescription>Completed, active, and pending task split.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={completionConfig} className="h-[280px] w-full">
              <PieChart>
                <Pie data={completionData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92}>
                  {completionData.map((item) => (
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
            <CardTitle>Productivity Trend</CardTitle>
            <CardDescription>Weekly productivity percentage over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendConfig} className="h-[280px] w-full">
              <AreaChart data={trendData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="productivity"
                  type="natural"
                  fill="var(--color-productivity)"
                  fillOpacity={0.18}
                  stroke="var(--color-productivity)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
            <CardDescription>Planned work versus completed work.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={weeklyConfig} className="h-[280px] w-full">
              <BarChart data={weeklyData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="planned" fill="var(--color-planned)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
