"use client"

import type { DashboardStats } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FolderIcon, CheckCircleIcon, ClockIcon, AlertTriangleIcon, ListTodoIcon } from "lucide-react"

interface DashboardStatsProps {
  stats: DashboardStats
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Total Projects",
      value: stats.totalProjects,
      description: "Active projects",
      icon: <FolderIcon className="h-4 w-4" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      description: "All tasks across projects",
      icon: <ListTodoIcon className="h-4 w-4" />,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Completed Tasks",
      value: stats.completedTasks,
      description: "Tasks marked as done",
      icon: <CheckCircleIcon className="h-4 w-4" />,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks,
      description: "Tasks to be completed",
      icon: <ClockIcon className="h-4 w-4" />,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Overdue Tasks",
      value: stats.overdueTasks,
      description: "Tasks past due date",
      icon: <AlertTriangleIcon className="h-4 w-4" />,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`${stat.bgColor} p-2 rounded-full`}>
              <div className={stat.color}>{stat.icon}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
