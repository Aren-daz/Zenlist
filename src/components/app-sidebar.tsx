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
  SidebarFooter,
  SidebarTrigger
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

function buildMenuItems(tNav: ReturnType<typeof useTranslations>) {
  return [
    { title: tNav('dashboard'), url: '/', icon: Home },
    { title: tNav('tasks'), url: '/tasks', icon: CheckSquare },
    { title: tNav('projects'), url: '/projects', icon: FolderKanban },
    { title: tNav('team'), url: '/team', icon: Users },
    { title: tNav('tags'), url: '/tags', icon: Tag },
    { title: tNav('calendar'), url: '/calendar', icon: Calendar },
    { title: tNav('habits'), url: '/habits', icon: Star },
    { title: tNav('analytics'), url: '/analytics', icon: TrendingUp },
    { title: tNav('settings'), url: '/settings', icon: Settings },
  ]
}

export function AppSidebar() {
  const { data: session, status } = useSession()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const tNav = useTranslations('navigation')
  const tTasks = useTranslations('tasks')
  const tAuth = useTranslations('auth')
  const tCommon = useTranslations('common')
  const menuItems = buildMenuItems(tNav)

  return (
    <>
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b p-4">
          {/* Vue étendue: disposition en ligne */}
          <div className="flex items-center justify-between group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">Zenlist</h1>
            </div>
            <div className="flex items-center gap-2">
              <SidebarTrigger className="inline-flex" aria-label="Basculer la barre latérale" />
              <ThemeToggle />
              <NotificationCenter />
            </div>
          </div>
          {/* Vue rétractée (icônes): disposition en colonne */}
          <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-3">
            {/* Logo */}
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            {/* Bouton pour étendre/rétracter */}
            <SidebarTrigger className="inline-flex" aria-label="Basculer la barre latérale" />
            {/* Mode thème */}
            <ThemeToggle />
            {/* Notifications */}
            <NotificationCenter />
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
                          <Link href="/tasks?openNew=1" className="flex items-center gap-2 w-full">
                            <Plus className="w-4 h-4" />
                          <span>{tTasks('newTask')}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <button 
                          className="flex items-center gap-2 w-full"
                          onClick={() => setIsSearchOpen(true)}
                        >
                          <Search className="w-4 h-4" />
                          <span>{tCommon('search')}</span>
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
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
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
                className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
                onClick={() => signOut()}
              >
                <LogOut className="w-4 h-4" />
                <span className="group-data-[collapsible=icon]:hidden">{tAuth('signout')}</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button asChild size="sm" className="w-full group-data-[collapsible=icon]:justify-center">
                <Link href="/auth/signin"><span className="group-data-[collapsible=icon]:hidden">Se connecter</span><span className="sr-only group-data-[collapsible=icon]:not-sr-only">→</span></Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full group-data-[collapsible=icon]:justify-center">
                <Link href="/auth/signup"><span className="group-data-[collapsible=icon]:hidden">Créer un compte</span><span className="sr-only group-data-[collapsible=icon]:not-sr-only">＋</span></Link>
              </Button>
            </div>
          )}
          <div className="text-xs text-muted-foreground text-center mt-2 group-data-[collapsible=icon]:hidden">Zenlist v3.2.4</div>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}