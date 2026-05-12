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

interface AnalyticsDashboardProps {
  projects: Project[]
  tasks: Task[]
}

const completionConfig = {
  completed: { label: "Completed", color: "hsl(var(--primary))" },
  active: { label: "Active", color: "var(--chart-2)" },
  pending: { label: "Pending", color: "var(--chart-4)" },
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

const trendData = [
  { week: "W1", productivity: 58, completed: 4 },
  { week: "W2", productivity: 64, completed: 6 },
  { week: "W3", productivity: 71, completed: 8 },
  { week: "W4", productivity: 78, completed: 10 },
  { week: "W5", productivity: 74, completed: 9 },
  { week: "W6", productivity: 86, completed: 12 },
]

const weeklyData = [
  { day: "Mon", planned: 8, completed: 6 },
  { day: "Tue", planned: 7, completed: 7 },
  { day: "Wed", planned: 9, completed: 5 },
  { day: "Thu", planned: 6, completed: 6 },
  { day: "Fri", planned: 8, completed: 7 },
  { day: "Sat", planned: 3, completed: 2 },
  { day: "Sun", planned: 2, completed: 1 },
]

export function AnalyticsDashboard({ projects, tasks }: AnalyticsDashboardProps) {
  const completedTasks = tasks.filter((task) => task.status === "completed").length
  const activeTasks = tasks.filter((task) => task.status === "in-progress").length
  const pendingTasks = tasks.filter((task) => task.status === "todo").length

  const completionData = [
    { name: "Completed", value: completedTasks, key: "completed" },
    { name: "Active", value: activeTasks, key: "active" },
    { name: "Pending", value: pendingTasks, key: "pending" },
  ]

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
      <div>
        <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Recharts-powered views for completion, productivity trend, weekly performance, and project progress.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
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
      </div>
    </div>
  )
}
