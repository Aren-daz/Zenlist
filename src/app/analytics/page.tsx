"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Clock, AlertCircle, Archive, Target, TrendingUp, Calendar, BarChart3, PieChart, Activity } from "lucide-react"

interface TaskStats {
  total: number
  completed: number
  inProgress: number
  todo: number
  archived: number
}

interface ProjectStats {
  id: string
  name: string
  color: string
  taskCount: number
  completedTasks: number
}

interface HabitStats {
  total: number
  completedToday: number
  totalEntries: number
  averageStreak: number
}

export default function AnalyticsPage() {
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    archived: 0
  })
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([])
  const [habitStats, setHabitStats] = useState<HabitStats>({
    total: 0,
    completedToday: 0,
    totalEntries: 0,
    averageStreak: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      // Récupérer les statistiques des tâches
      const tasksResponse = await fetch("/api/tasks")
      if (tasksResponse.ok) {
        const tasks = await tasksResponse.json()
        const stats: TaskStats = {
          total: tasks.length,
          completed: tasks.filter((t: any) => t.status === "DONE").length,
          inProgress: tasks.filter((t: any) => t.status === "IN_PROGRESS").length,
          todo: tasks.filter((t: any) => t.status === "TODO").length,
          archived: tasks.filter((t: any) => t.status === "ARCHIVED").length
        }
        setTaskStats(stats)
      }

      // Récupérer les statistiques des projets
      const projectsResponse = await fetch("/api/projects")
      if (projectsResponse.ok) {
        const projects = await projectsResponse.json()
        const projectsWithStats = await Promise.all(
          projects.map(async (project: any) => {
            const tasksResponse = await fetch(`/api/tasks?projectId=${project.id}`)
            const tasks = tasksResponse.ok ? await tasksResponse.json() : []
            
            return {
              id: project.id,
              name: project.name,
              color: project.color,
              taskCount: tasks.length,
              completedTasks: tasks.filter((t: any) => t.status === "DONE").length
            }
          })
        )
        setProjectStats(projectsWithStats)
      }

      // Récupérer les statistiques des habitudes
      const habitsResponse = await fetch("/api/habits")
      if (habitsResponse.ok) {
        const habits = await habitsResponse.json()
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        let completedToday = 0
        let totalEntries = 0
        let totalStreak = 0
        let habitsWithStreak = 0

        for (const habit of habits) {
          const entriesResponse = await fetch(`/api/habits/${habit.id}/entries`)
          const entries = entriesResponse.ok ? await entriesResponse.json() : []
          
          totalEntries += entries.length
          
          // Vérifier si complété aujourd'hui
          const completedTodayCheck = entries.some((entry: any) => {
            const entryDate = new Date(entry.completedAt)
            entryDate.setHours(0, 0, 0, 0)
            return entryDate.getTime() === today.getTime()
          })
          
          if (completedTodayCheck) completedToday++

          // Calculer la série actuelle
          if (entries.length > 0) {
            const sortedEntries = entries.sort((a: any, b: any) => 
              new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
            )

            let streak = 0
            let currentDate = new Date()
            currentDate.setHours(0, 0, 0, 0)

            for (const entry of sortedEntries) {
              const entryDate = new Date(entry.completedAt)
              entryDate.setHours(0, 0, 0, 0)

              const diffDays = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
              
              if (diffDays === streak) {
                streak++
              } else {
                break
              }
            }
            
            if (streak > 0) {
              totalStreak += streak
              habitsWithStreak++
            }
          }
        }

        const averageStreak = habitsWithStreak > 0 ? Math.round(totalStreak / habitsWithStreak) : 0

        setHabitStats({
          total: habits.length,
          completedToday,
          totalEntries,
          averageStreak
        })
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCompletionRate = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  const getProjectCompletionRate = (project: ProjectStats) => {
    return getCompletionRate(project.completedTasks, project.taskCount)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Suivez votre productivité et vos progrès
        </p>
      </div>

      {/* Stats principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches totales</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {getCompletionRate(taskStats.completed, taskStats.total)}% complétées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches actives</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.todo + taskStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              {taskStats.todo} à faire, {taskStats.inProgress} en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Habitudes</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{habitStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {habitStats.completedToday} complétées aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Série moyenne</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{habitStats.averageStreak}</div>
            <p className="text-xs text-muted-foreground">
              jours consécutifs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et analyses détaillées */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Tâches
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <PieChart className="w-4 h-4" />
            Projets
          </TabsTrigger>
          <TabsTrigger value="habits" className="gap-2">
            <Target className="w-4 h-4" />
            Habitudes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Répartition des statuts
                </CardTitle>
                <CardDescription>
                  Distribution des tâches par statut
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Terminées</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{taskStats.completed}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {getCompletionRate(taskStats.completed, taskStats.total)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-500" />
                      <span>En cours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{taskStats.inProgress}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {getCompletionRate(taskStats.inProgress, taskStats.total)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span>À faire</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{taskStats.todo}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {getCompletionRate(taskStats.todo, taskStats.total)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Archive className="w-4 h-4 text-gray-500" />
                      <span>Archivées</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{taskStats.archived}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {getCompletionRate(taskStats.archived, taskStats.total)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Indicateurs de performance
                </CardTitle>
                <CardDescription>
                  Mesures clés de votre productivité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Taux de complétion</span>
                    <Badge className="bg-green-100 text-green-800">
                      {getCompletionRate(taskStats.completed, taskStats.total)}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Tâches actives</span>
                    <Badge variant="secondary">
                      {taskStats.todo + taskStats.inProgress}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Efficacité</span>
                    <Badge className={taskStats.inProgress > taskStats.todo ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                      {taskStats.inProgress > taskStats.todo ? "En progression" : "Bien géré"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4">
            {projectStats.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <PieChart className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun projet</h3>
                  <p className="text-muted-foreground text-center">
                    Créez des projets pour voir leurs statistiques ici
                  </p>
                </CardContent>
              </Card>
            ) : (
              projectStats.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </CardTitle>
                    <CardDescription>
                      Statistiques du projet
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{project.taskCount}</div>
                        <div className="text-sm text-muted-foreground">Tâches totales</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{project.completedTasks}</div>
                        <div className="text-sm text-muted-foreground">Tâches complétées</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {getProjectCompletionRate(project)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Taux de complétion</div>
                      </div>
                    </div>
                    
                    {/* Barre de progression */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progression</span>
                        <span>{getProjectCompletionRate(project)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProjectCompletionRate(project)}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="habits" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Vue d'ensemble
                </CardTitle>
                <CardDescription>
                  Statistiques générales des habitudes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total d'habitudes</span>
                    <Badge variant="outline">{habitStats.total}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Complétées aujourd'hui</span>
                    <Badge className="bg-green-100 text-green-800">
                      {habitStats.completedToday}/{habitStats.total}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Total des entrées</span>
                    <Badge variant="secondary">{habitStats.totalEntries}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Série moyenne</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {habitStats.averageStreak} jours
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Taux de complétion quotidien</span>
                    <Badge className={habitStats.completedToday === habitStats.total && habitStats.total > 0 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                      {habitStats.total > 0 ? Math.round((habitStats.completedToday / habitStats.total) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Performances
                </CardTitle>
                <CardDescription>
                  Analyse de votre régularité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {habitStats.averageStreak}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Jours de série moyenne
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {habitStats.totalEntries}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Actions accomplies
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {habitStats.total > 0 ? Math.round(habitStats.totalEntries / habitStats.total) : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Entrées par habitude
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}