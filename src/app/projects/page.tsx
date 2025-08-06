"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { FolderKanban, Plus, Edit, Trash2, CheckCircle, Clock, AlertCircle, Target } from "lucide-react"
import { toast } from "sonner"

interface Project {
  id: string
  name: string
  description?: string
  color: string
  workspace?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
  stats: {
    total: number
    todo: number
    inProgress: number
    done: number
    archived: number
  }
}

const colorOptions = [
  { name: "Bleu", value: "#3b82f6" },
  { name: "Vert", value: "#10b981" },
  { name: "Rouge", value: "#ef4444" },
  { name: "Jaune", value: "#f59e0b" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Rose", value: "#ec4899" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Gris", value: "#6b7280" },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6"
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      } else {
        toast.error("Erreur lors de la récupération des projets")
      }
    } catch (error) {
      toast.error("Erreur lors de la récupération des projets")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingProject ? `/api/projects/${editingProject.id}` : "/api/projects"
      const method = editingProject ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingProject ? "Projet mis à jour avec succès" : "Projet créé avec succès")
        setIsDialogOpen(false)
        resetForm()
        fetchProjects()
      } else {
        toast.error("Erreur lors de l'opération")
      }
    } catch (error) {
      toast.error("Erreur lors de l'opération")
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description || "",
      color: project.color
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (projectId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce projet ? Cette action supprimera également toutes les tâches associées.")) {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          toast.success("Projet supprimé avec succès")
          fetchProjects()
        } else {
          toast.error("Erreur lors de la suppression")
        }
      } catch (error) {
        toast.error("Erreur lors de la suppression")
      }
    }
  }

  const resetForm = () => {
    setEditingProject(null)
    setFormData({
      name: "",
      description: "",
      color: "#3b82f6"
    })
  }

  const getProgressPercentage = (stats: Project['stats']) => {
    if (stats.total === 0) return 0
    return Math.round((stats.done / stats.total) * 100)
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
          <h1 className="text-3xl font-bold tracking-tight">Projets</h1>
          <p className="text-muted-foreground">
            Gérez vos projets et organisez vos tâches par catégorie
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={resetForm}>
              <Plus className="w-4 h-4" />
              Nouveau projet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingProject ? "Modifier le projet" : "Créer un nouveau projet"}
                </DialogTitle>
                <DialogDescription>
                  {editingProject 
                    ? "Modifiez les informations du projet ci-dessous."
                    : "Créez un nouveau projet en remplissant le formulaire ci-dessous."
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
                  <Label htmlFor="color" className="text-right">
                    Couleur
                  </Label>
                  <div className="col-span-3 flex gap-2 flex-wrap">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color.value ? "border-foreground" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingProject ? "Mettre à jour" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun projet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Vous n'avez aucun projet pour le moment. Créez votre premier projet pour commencer à organiser vos tâches !
              </p>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(project)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(project.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {project.description && (
                  <CardDescription className="mt-2">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{project.stats.total}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">Terminées:</span>
                    <span className="font-medium">{project.stats.done}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-muted-foreground">À faire:</span>
                    <span className="font-medium">{project.stats.todo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span className="text-muted-foreground">En cours:</span>
                    <span className="font-medium">{project.stats.inProgress}</span>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progression</span>
                    <span className="font-medium">{getProgressPercentage(project.stats)}%</span>
                  </div>
                  <Progress value={getProgressPercentage(project.stats)} className="h-2" />
                </div>

                {/* Status badges */}
                <div className="flex flex-wrap gap-1">
                  {project.stats.todo > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {project.stats.todo} à faire
                    </Badge>
                  )}
                  {project.stats.inProgress > 0 && (
                    <Badge variant="default" className="text-xs">
                      {project.stats.inProgress} en cours
                    </Badge>
                  )}
                  {project.stats.done > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {project.stats.done} terminées
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}