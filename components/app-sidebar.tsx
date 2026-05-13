"use client"

import * as React from "react"
import { useSession } from "next-auth/react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { BrandMark } from "@/components/brand-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, Settings2Icon } from "lucide-react"

const data = {
  user: {
    name: "John Doe",
    email: "john@taskflow.ai",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: (
        <LayoutDashboardIcon
        />
      ),
    },
    {
      title: "Projects",
      url: "/dashboard?tab=projects",
      icon: (
        <FolderIcon
        />
      ),
    },
    {
      title: "Tasks",
      url: "/dashboard?tab=tasks",
      icon: (
        <ListIcon
        />
      ),
    },
    {
      title: "Team",
      url: "/dashboard?tab=team",
      icon: (
        <UsersIcon
        />
      ),
    },
    {
      title: "Analytics",
      url: "/dashboard?tab=analytics",
      icon: (
        <ChartBarIcon
        />
      ),
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard?tab=settings",
      icon: (
        <Settings2Icon
        />
      ),
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const name = session?.user?.name || "TaskFlow user"
  const email = session?.user?.email || "Signed in"
  const avatar = session?.user?.image || ""

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <BrandMark className="size-7 rounded-md" />
                <span className="text-base font-semibold">TaskFlow AI</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name, email, avatar }} />
      </SidebarFooter>
    </Sidebar>
  )
}
