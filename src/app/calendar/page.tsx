"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter } from "lucide-react"
import Link from "next/link"

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const [date, setDate] = useState<Date>(new Date())
  const [view, setView] = useState<"month" | "week" | "day">("month")
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated") {
      loadTasks()
    }
  }, [status])

  const loadTasks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/tasks?withDueDate=true")
      if (response.ok) {
        const data = await response.json()
        setTasks(data.map((task: any) => ({
          ...task,
          dueDate: new Date(task.dueDate)
        })))
      }
    } catch (error) {
      console.error("Failed to load tasks:", error)
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
              Vous devez être connecté pour accéder au calendrier
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "destructive"
      case "MEDIUM": return "secondary"
      case "LOW": return "outline"
      default: return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO": return "bg-red-500"
      case "IN_PROGRESS": return "bg-orange-500"
      case "DONE": return "bg-green-500"
      case "ARCHIVED": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate)
      return taskDate.toDateString() === date.toDateString()
    })
  }

  const renderMonthView = () => (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Calendrier des tâches</CardTitle>
          <CardDescription>
            Vue mensuelle de vos échéances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={(newDate) => newDate && setDate(newDate)}
            locale={fr}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tâches du {format(date, "d MMMM yyyy", { locale: fr })}</CardTitle>
          <CardDescription>
            Tâches prévues pour cette date
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getTasksForDate(date).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucune tâche prévue pour cette date
            </p>
          ) : (
            <div className="space-y-3">
              {getTasksForDate(date).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}></div>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.project?.name || 'Aucun projet'}</p>
                    </div>
                  </div>
                  <Badge variant={getPriorityColor(task.priority)}>
                    {task.priority === "HIGH" ? "Haute" : task.priority === "MEDIUM" ? "Moyenne" : "Basse"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendrier</h1>
          <p className="text-muted-foreground">
            Gérez vos échéances et planifiez vos tâches
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={(value: "month" | "week" | "day") => setView(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="day">Jour</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtrer
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle tâche
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {format(date, "MMMM yyyy", { locale: fr })}
          </h2>
          <Button variant="outline" size="sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm">
          Aujourd'hui
        </Button>
      </div>

      {/* Calendar View */}
      {view === "month" && renderMonthView()}
      {view === "week" && (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center">
              Vue semaine en cours de développement...
            </p>
          </CardContent>
        </Card>
      )}
      {view === "day" && (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center">
              Vue jour en cours de développement...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}