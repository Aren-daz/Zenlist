"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2, Tag } from "lucide-react"
import { toast } from "sonner"

interface Tag {
  id: string
  name: string
  color: string
  workspace?: {
    id: string
    name: string
  }
  tasks: {
    task: {
      id: string
      title: string
      status: string
    }
  }[]
  _count: {
    tasks: number
  }
  createdAt: string
  updatedAt: string
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    color: "#6b7280"
  })

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags")
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      } else {
        toast.error("Erreur lors de la récupération des tags")
      }
    } catch (error) {
      toast.error("Erreur lors de la récupération des tags")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingTag ? `/api/tags/${editingTag.id}` : "/api/tags"
      const method = editingTag ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingTag ? "Tag mis à jour avec succès" : "Tag créé avec succès")
        setIsDialogOpen(false)
        resetForm()
        fetchTags()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Erreur lors de l'opération")
      }
    } catch (error) {
      toast.error("Erreur lors de l'opération")
    }
  }

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      color: tag.color
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (tagId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce tag ?")) {
      try {
        const response = await fetch(`/api/tags/${tagId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          toast.success("Tag supprimé avec succès")
          fetchTags()
        } else {
          toast.error("Erreur lors de la suppression")
        }
      } catch (error) {
        toast.error("Erreur lors de la suppression")
      }
    }
  }

  const resetForm = () => {
    setEditingTag(null)
    setFormData({
      name: "",
      color: "#6b7280"
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
          <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground">
            Gérez vos tags pour organiser vos tâches
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={resetForm}>
              <Plus className="w-4 h-4" />
              Nouveau tag
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingTag ? "Modifier le tag" : "Créer un nouveau tag"}
                </DialogTitle>
                <DialogDescription>
                  {editingTag 
                    ? "Modifiez les informations du tag ci-dessous."
                    : "Créez un nouveau tag en remplissant le formulaire ci-dessous."
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
                  <Label htmlFor="color" className="text-right">
                    Couleur
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1"
                      placeholder="#6b7280"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingTag ? "Mettre à jour" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tags Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tags.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Tag className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun tag</h3>
              <p className="text-muted-foreground text-center mb-4">
                Vous n'avez aucun tag pour le moment. Créez votre premier tag pour commencer !
              </p>
            </CardContent>
          </Card>
        ) : (
          tags.map((tag) => (
            <Card key={tag.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <CardTitle className="text-lg">{tag.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(tag)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tag.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tâches associées</span>
                    <Badge variant="secondary">{tag._count.tasks}</Badge>
                  </div>
                  {tag.workspace && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Workspace</span>
                      <span className="font-medium">{tag.workspace.name}</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Créé le {new Date(tag.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}