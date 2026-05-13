"use client"

import {
  ActivityIcon,
  MessageSquareIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SectionHeading } from "@/components/dashboard/section-heading"

const members = [
  {
    name: "Santhosh S",
    email: "santhosh@taskflow.ai",
    role: "Full Stack Developer",
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Santhosh%20S",
    status: "Online",
    workload: "8 tasks",
  },
  {
    name: "Maya Chen",
    email: "maya@taskflow.ai",
    role: "Product Designer",
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Maya%20Chen",
    status: "Reviewing",
    workload: "6 tasks",
  },
  {
    name: "Arjun Rao",
    email: "arjun@taskflow.ai",
    role: "Backend Engineer",
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Arjun%20Rao",
    status: "Focused",
    workload: "5 tasks",
  },
  {
    name: "Devika Nair",
    email: "devika@taskflow.ai",
    role: "QA Engineer",
    avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Devika%20Nair",
    status: "Testing",
    workload: "4 tasks",
  },
]

const comments = [
  {
    author: "Maya Chen",
    text: "Project and task tables look ready. I added a note to keep mobile overflow readable.",
    time: "12 min ago",
  },
  {
    author: "Arjun Rao",
    text: "MongoDB API routes are wired. Next step is validating imported seed data with a real user id.",
    time: "34 min ago",
  },
  {
    author: "Devika Nair",
    text: "QA checklist is open for auth redirects, task filters, and project deletion cascade.",
    time: "1 hr ago",
  },
]

const timeline = [
  {
    title: "Task Management Module updated",
    detail: "Search, project filter, status filter, priority filter, and completion toggles added.",
    time: "Today, 6:10 PM",
  },
  {
    title: "Project Management connected to MongoDB",
    detail: "Created projectscollections model and CRUD endpoints.",
    time: "Today, 5:25 PM",
  },
  {
    title: "Authentication protected routes",
    detail: "Dashboard access now requires a valid session.",
    time: "Yesterday, 8:40 PM",
  },
  {
    title: "Analytics scope approved",
    detail: "Completion, productivity trend, weekly performance, and project progress charts planned.",
    time: "Yesterday, 6:30 PM",
  },
]

export function TeamCollaboration() {
  return (
    <div className="space-y-6">
      <SectionHeading
        title="Team Collaboration"
        description="Mock collaboration workspace with team members, comments, and activity history."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {members.map((member) => (
          <Card key={member.email}>
            <CardContent className="flex items-start gap-3 py-4">
              <Avatar size="lg">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <p className="truncate font-medium">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.role}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">{member.status}</Badge>
                  <Badge variant="outline">{member.workload}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareIcon className="size-4 text-primary" />
              Comments
            </CardTitle>
            <CardDescription>Keep team discussion close to delivery work.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[220px_1fr_auto]">
              <Input placeholder="Member name" />
              <Textarea placeholder="Write a project update..." className="min-h-9" />
              <Button>
                <PlusIcon className="size-4" />
                Add
              </Button>
            </div>
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={`${comment.author}-${comment.time}`} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{comment.author}</p>
                    <span className="text-xs text-muted-foreground">{comment.time}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{comment.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="size-4 text-primary" />
              Activity Timeline
            </CardTitle>
            <CardDescription>Recent collaboration and delivery signals.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.map((event) => (
                <div key={event.title} className="relative border-l pl-4">
                  <div className="absolute -left-1.5 top-1.5 size-3 rounded-full bg-primary" />
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.detail}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{event.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="size-4 text-primary" />
            Collaboration Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <p>Use avatars and member status to make ownership visible.</p>
          <p>Use comments to capture blockers and decisions without leaving the dashboard.</p>
          <p>Use the timeline to show product-thinking progress, not only CRUD actions.</p>
        </CardContent>
      </Card>
    </div>
  )
}
