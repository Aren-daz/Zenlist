"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Home,
  CheckSquare,
  FolderKanban,
  Calendar,
  TrendingUp,
  Settings,
  Plus,
  Search,
  Star,
  Tag,
  LogOut,
  Users
} from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { NotificationCenter } from "@/components/notification-center"
import { GlobalSearch } from "@/components/global-search"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"
import { useTranslations } from 'next-intl'

const menuItems = [
  {
    title: "Accueil",
    url: "/",
    icon: Home,
  },
  {
    title: "Mes tâches",
    url: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "Projets",
    url: "/projects",
    icon: FolderKanban,
  },
  {
    title: "Équipe",
    url: "/team",
    icon: Users,
  },
  {
    title: "Tags",
    url: "/tags",
    icon: Tag,
  },
  {
    title: "Calendrier",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Habitudes",
    url: "/habits",
    icon: Star,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: TrendingUp,
  },
  {
    title: "Paramètres",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const { data: session, status } = useSession()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const t = useTranslations('navigation')

  return (
    <>
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <Sidebar>
        <SidebarHeader className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">Zenlist</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationCenter />
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          {status === "authenticated" && (
            <>
              <SidebarGroup>
                <SidebarGroupLabel>Menu</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Link href={item.url} className="flex items-center gap-2">
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>Raccourcis</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <button className="flex items-center gap-2 w-full">
                          <Plus className="w-4 h-4" />
                          <span>Nouvelle tâche</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <button 
                          className="flex items-center gap-2 w-full"
                          onClick={() => setIsSearchOpen(true)}
                        >
                          <Search className="w-4 h-4" />
                          <span>Rechercher</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t p-4">
          {status === "authenticated" ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={session.user?.image || ""} />
                  <AvatarFallback>
                    {session.user?.name?.[0] || session.user?.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.user?.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session.user?.email}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start gap-2"
                onClick={() => signOut()}
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button asChild size="sm" className="w-full">
                <Link href="/auth/signin">Se connecter</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/auth/signup">Créer un compte</Link>
              </Button>
            </div>
          )}
          <div className="text-xs text-muted-foreground text-center mt-2">
            Zenlist v3.2.4
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}