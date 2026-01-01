"use client"

import Link from "next/link"
import { Activity, BarChart3, Settings, ChevronDown, type LucideIcon } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

type NavItemBase = {
  title: string
  href: string
  icon: LucideIcon
  badge?: string | null
  disabled?: boolean
}

type NavItemWithSubmenu = NavItemBase & {
  submenu: {
    title: string
    href: string
    symbol: string
  }[]
}

type NavItemSimple = NavItemBase

type NavItem = NavItemWithSubmenu | NavItemSimple

const navItems: NavItem[] = [
  {
    title: "Signals",
    href: "/",
    icon: Activity,
    badge: null,
    disabled: false,
    submenu: [
      {
        title: "Bitcoin",
        href: "/signals/bitcoin",
        symbol: "BTCUSDC",
      },
    ],
  },
  {
    title: "Analytics",
    href: "#",
    icon: BarChart3,
    badge: "WIP",
    disabled: true,
  },
]

const settingsItems: NavItemSimple[] = [
  {
    title: "Settings",
    href: "#",
    icon: Settings,
    badge: "WIP",
    disabled: true,
  },
]

function hasSubmenu(item: NavItem): item is NavItemWithSubmenu {
  return 'submenu' in item
}

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
              {navItems.map((item) => {
                if (hasSubmenu(item)) {
                  return (
                    <Collapsible key={item.href} defaultOpen className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild suppressHydrationWarning>
                          <SidebarMenuButton disabled={item.disabled}>
                            <item.icon />
                            <span>{item.title}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                                {item.badge}
                              </Badge>
                            )}
                            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent suppressHydrationWarning>
                          <SidebarMenuSub>
                            {item.submenu.map((subitem) => (
                              <SidebarMenuSubItem key={subitem.href}>
                                <SidebarMenuSubButton asChild>
                                  <Link href={subitem.href}>
                                    <span>{subitem.title}</span>
                                    <span className="ml-auto text-xs text-muted-foreground">{subitem.symbol}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                return (
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
                )
              })}
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
