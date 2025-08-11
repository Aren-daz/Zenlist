"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin,
  Settings,
  Activity,
  MessageSquare,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Search
} from "lucide-react"
import Link from "next/link"

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  status: "online" | "offline" | "busy"
  lastActive: string
  tasksAssigned: number
  tasksCompleted: number
  joinDate: string
}

interface TeamActivity {
  id: string
  userId: string
  userName: string
  action: string
  target: string
  timestamp: string
  type: "task" | "project" | "comment" | "system"
}

export default function TeamPage() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState("members")
  const [searchQuery, setSearchQuery] = useState("")
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamActivities, setTeamActivities] = useState<TeamActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [invite, setInvite] = useState({ email: "", role: "member" })

  useEffect(() => {
    if (status === "authenticated") {
      loadTeamData()
    }
  }, [status])

  const loadTeamData = async () => {
    setIsLoading(true)
    try {
      // Workspaces de l'utilisateur, prendre le premier
      const workspacesRes = await fetch("/api/workspaces")
      let workspaceId: string | null = null
      if (workspacesRes.ok) {
        const workspaces = await workspacesRes.json()
        workspaceId = workspaces?.[0]?.id || null
      }
      if (workspaceId) {
        const membersResponse = await fetch(`/api/workspaces/${workspaceId}/members`)
        if (membersResponse.ok) {
          const members = await membersResponse.json()
          setTeamMembers(members.map((m: any) => ({
            id: m.user.id,
            name: m.user.name || m.user.email,
            email: m.user.email,
            role: m.role,
            avatar: m.user.avatar,
            status: "offline",
            lastActive: "récemment",
            tasksAssigned: 0,
            tasksCompleted: 0,
            joinDate: new Date(m.joinedAt).toISOString(),
          })))
        }
      }

      // Load team activities (placeholder)
      const activitiesResponse = await fetch("/api/team/activities")
      if (activitiesResponse.ok) {
        const activities = await activitiesResponse.json()
        setTeamActivities(activities)
      }
    } catch (error) {
      console.error("Failed to load team data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Accès requis</CardTitle>
            <CardDescription>
              Vous devez être connecté pour accéder à l'équipe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/auth/signin">Se connecter</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500"
      case "busy": return "bg-orange-500"
      case "offline": return "bg-gray-400"
      default: return "bg-gray-400"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "online": return "En ligne"
      case "busy": return "Occupé"
      case "offline": return "Hors ligne"
      default: return "Inconnu"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin": return "destructive"
      case "Member": return "secondary"
      case "Viewer": return "outline"
      default: return "outline"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task": return <CheckCircle className="w-4 h-4 text-green-500" />
      case "comment": return <MessageSquare className="w-4 h-4 text-blue-500" />
      case "project": return <FileText className="w-4 h-4 text-purple-500" />
      case "system": return <Settings className="w-4 h-4 text-gray-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Équipe</h1>
          <p className="text-muted-foreground">
            Gérez votre équipe et collaborez efficacement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Search className="w-4 h-4" />
            Rechercher
          </Button>
          <form className="flex gap-2" onSubmit={async (e) => {
            e.preventDefault()
            try {
              const workspacesRes = await fetch("/api/workspaces")
              const workspaces = workspacesRes.ok ? await workspacesRes.json() : []
              const wid = workspaces?.[0]?.id
              if (!wid) return
              const res = await fetch(`/api/workspaces/${wid}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: invite.email, role: invite.role.toUpperCase() })
              })
              if (res.ok) {
                setInvite({ email: "", role: "member" })
                loadTeamData()
              }
            } catch {}
          }}>
            <Input placeholder="email@exemple.com" value={invite.email} onChange={(e)=>setInvite(v=>({...v,email:e.target.value}))} />
            <Select value={invite.role} onValueChange={(v)=>setInvite(s=>({...s, role: v}))}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Rôle" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Membre</SelectItem>
                <SelectItem value="viewer">Visualisateur</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="gap-2">
              <UserPlus className="w-4 h-4" />
              Inviter
            </Button>
          </form>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              {teamMembers.filter(m => m.status === "online").length} en ligne
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches assignées</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.reduce((sum, member) => sum + member.tasksAssigned, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total des tâches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de complétion</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                (teamMembers.reduce((sum, member) => sum + member.tasksCompleted, 0) /
                teamMembers.reduce((sum, member) => sum + member.tasksAssigned, 0)) * 100
              )}%
            </div>
            <p className="text-xs text-muted-foreground">
              Performance globale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activité récente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamActivities.length}</div>
            <p className="text-xs text-muted-foreground">
              Dernières 24h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Team Members */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Membres de l'équipe</CardTitle>
                <CardDescription>
                  {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Rechercher un membre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`}></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{member.name}</h3>
                          <Badge variant={getRoleColor(member.role)} className="text-xs">
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>{getStatusText(member.status)}</span>
                          <span>•</span>
                          <span>Actif {member.lastActive}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {member.tasksCompleted}/{member.tasksAssigned}
                      </div>
                      <div className="text-xs text-muted-foreground">Tâches</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Team Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activité de l'équipe</CardTitle>
            <CardDescription>
              Dernières activités des membres
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {teamActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.userName}</span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>{" "}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Fin */}
    </div>
  )
}