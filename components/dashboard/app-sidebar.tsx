"use client"

import Link from "next/link"
import { Activity, BarChart3, Settings } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

const navItems = [
  {
    title: "Signals",
    href: "/",
    icon: Activity,
    badge: null,
    disabled: false,
  },
  {
    title: "Analytics",
    href: "#",
    icon: BarChart3,
    badge: "WIP",
    disabled: true,
  },
]

const settingsItems = [
  {
    title: "Settings",
    href: "#",
    icon: Settings,
    badge: "WIP",
    disabled: true,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-3 px-4 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">A</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-sidebar-foreground">Aurum</span>
            <span className="text-xs text-muted-foreground">Trading Signals</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild disabled={item.disabled}>
                    <Link href={item.disabled ? '#' : item.href} className={item.disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}>
                      <item.icon />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild disabled={item.disabled}>
                    <Link href={item.disabled ? '#' : item.href} className={item.disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}>
                      <item.icon />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
