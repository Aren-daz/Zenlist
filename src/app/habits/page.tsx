"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Plus, Edit, Trash2, Star, CheckCircle, Target, TrendingUp, Calendar } from "lucide-react"
import { toast } from "sonner"

interface Habit {
  id: string
  name: string
  description?: string
  frequency: "DAILY" | "WEEKLY" | "MONTHLY"
  createdAt: string
  updatedAt: string
  _count: {
    entries: number
  }
}

interface HabitEntry {
  id: string
  habitId: string
  completedAt: string
  notes?: string
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitEntries, setHabitEntries] = useState<{ [habitId: string]: HabitEntry[] }>({})
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    frequency: "DAILY" as "DAILY" | "WEEKLY" | "MONTHLY"
  })

  useEffect(() => {
    fetchHabits()
  }, [])

  const fetchHabits = async () => {
    try {
      const response = await fetch("/api/habits")
      if (response.ok) {
        const data = await response.json()
        setHabits(data)
        // Récupérer les entrées pour chaque habitude
        data.forEach((habit: Habit) => {
          fetchHabitEntries(habit.id)
        })
      } else {
        toast.error("Erreur lors de la récupération des habitudes")
      }
    } catch (error) {
      toast.error("Erreur lors de la récupération des habitudes")
    } finally {
      setLoading(false)
    }
  }

  const fetchHabitEntries = async (habitId: string) => {
    try {
      const response = await fetch(`/api/habits/${habitId}/entries`)
      if (response.ok) {
        const data = await response.json()
        setHabitEntries(prev => ({ ...prev, [habitId]: data }))
      }
    } catch (error) {
      console.error("Error fetching habit entries:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingHabit ? `/api/habits/${editingHabit.id}` : "/api/habits"
      const method = editingHabit ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingHabit ? "Habitude mise à jour avec succès" : "Habitude créée avec succès")
        setIsDialogOpen(false)
        resetForm()
        fetchHabits()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Erreur lors de l'opération")
      }
    } catch (error) {
      toast.error("Erreur lors de l'opération")
    }
  }

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit)
    setFormData({
      name: habit.name,
      description: habit.description || "",
      frequency: habit.frequency
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (habitId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette habitude ?")) {
      try {
        const response = await fetch(`/api/habits/${habitId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          toast.success("Habitude supprimée avec succès")
          fetchHabits()
        } else {
          toast.error("Erreur lors de la suppression")
        }
      } catch (error) {
        toast.error("Erreur lors de la suppression")
      }
    }
  }

  const completeHabit = async (habitId: string, notes?: string) => {
    try {
      const response = await fetch(`/api/habits/${habitId}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes }),
      })

      if (response.ok) {
        toast.success("Habitude marquée comme complétée !")
        fetchHabitEntries(habitId)
      } else {
        toast.error("Erreur lors de l'enregistrement")
      }
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  const removeHabitEntry = async (entryId: string, habitId: string) => {
    try {
      const response = await fetch(`/api/habit-entries/${entryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Entrée supprimée avec succès")
        fetchHabitEntries(habitId)
      } else {
        toast.error("Erreur lors de la suppression")
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const resetForm = () => {
    setEditingHabit(null)
    setFormData({
      name: "",
      description: "",
      frequency: "DAILY" as "DAILY" | "WEEKLY" | "MONTHLY"
    })
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "DAILY":
        return "default"
      case "WEEKLY":
        return "secondary"
      case "MONTHLY":
        return "outline"
      default:
        return "default"
    }
  }

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case "DAILY":
        return "Quotidienne"
      case "WEEKLY":
        return "Hebdomadaire"
      case "MONTHLY":
        return "Mensuelle"
      default:
        return frequency
    }
  }

  const getStreakCount = (habitId: string) => {
    const entries = habitEntries[habitId] || []
    if (entries.length === 0) return 0

    const sortedEntries = entries.sort((a, b) => 
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

    return streak
  }

  const isCompletedToday = (habitId: string) => {
    const entries = habitEntries[habitId] || []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return entries.some(entry => {
      const entryDate = new Date(entry.completedAt)
      entryDate.setHours(0, 0, 0, 0)
      return entryDate.getTime() === today.getTime()
    })
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Habitudes</h1>
          <p className="text-muted-foreground">
            Suivez vos habitudes et améliorez votre quotidien
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={resetForm}>
              <Plus className="w-4 h-4" />
              Nouvelle habitude
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingHabit ? "Modifier l'habitude" : "Créer une nouvelle habitude"}
                </DialogTitle>
                <DialogDescription>
                  {editingHabit 
                    ? "Modifiez les informations de l'habitude ci-dessous."
                    : "Créez une nouvelle habitude en remplissant le formulaire ci-dessous."
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nom *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="frequency" className="text-right">
                    Fréquence
                  </Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData({ ...formData, frequency: value as any })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner une fréquence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Quotidienne</SelectItem>
                      <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                      <SelectItem value="MONTHLY">Mensuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingHabit ? "Mettre à jour" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total habitudes</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{habits.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complétées aujourd'hui</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {habits.filter(habit => isCompletedToday(habit.id)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meilleure série</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...habits.map(habit => getStreakCount(habit.id)), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habits Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {habits.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Star className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune habitude</h3>
              <p className="text-muted-foreground text-center mb-4">
                Vous n'avez aucune habitude pour le moment. Créez votre première habitude pour commencer !
              </p>
            </CardContent>
          </Card>
        ) : (
          habits.map((habit) => {
            const streak = getStreakCount(habit.id)
            const isCompleted = isCompletedToday(habit.id)
            const entries = habitEntries[habit.id] || []

            return (
              <Card key={habit.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">{habit.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(habit)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(habit.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {habit.description && (
                    <CardDescription>{habit.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Fréquence</span>
                      <Badge variant={getFrequencyColor(habit.frequency) as any}>
                        {getFrequencyText(habit.frequency)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Série actuelle</span>
                      <Badge variant="outline" className="gap-1">
                        <Target className="w-3 h-3" />
                        {streak} jours
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total complétions</span>
                      <span className="font-medium">{habit._count.entries}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => completeHabit(habit.id)}
                        disabled={isCompleted}
                        className="flex-1"
                        variant={isCompleted ? "outline" : "default"}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {isCompleted ? "Complété aujourd'hui" : "Marquer comme complété"}
                      </Button>
                    </div>

                    {entries.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Dernières complétions</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {entries.slice(-5).reverse().map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between text-xs bg-muted/50 rounded p-2">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="w-3 h-3" />
                                <span>{new Date(entry.completedAt).toLocaleDateString('fr-FR')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {entry.notes && (
                                  <span className="text-muted-foreground max-w-20 truncate">
                                    {entry.notes}
                                  </span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeHabitEntry(entry.id, habit.id)}
                                  className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}