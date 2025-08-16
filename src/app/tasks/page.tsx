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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Plus, Edit, Trash2, CheckCircle, Clock, AlertCircle, Archive, FolderKanban, List, LayoutGrid, Calendar, Tag, X, MessageCircle, Send } from "lucide-react"
import { enhancedToast } from "@/lib/enhanced-toast"
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

interface Task {
  id: string
  title: string
  description?: string
  status: "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED"
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate?: string
  project?: {
    id: string
    name: string
    color: string
  }
  assignee?: {
    id: string
    name: string
    email: string
  }
  creator: {
    id: string
    name: string
    email: string
  }
  tags?: {
    id: string
    name: string
    color: string
  }[]
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  name: string
  color: string
}

interface Tag {
  id: string
  name: string
  color: string
}

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

// Composant pour gérer les commentaires d'une tâche - déplacé à l'extérieur pour éviter les re-renders
const CommentSection = ({ 
  task, 
  taskComments, 
  newComment, 
  setNewComment, 
  editingComment, 
  setEditingComment, 
  expandedTaskId, 
  setExpandedTaskId, 
  addComment, 
  updateComment, 
  deleteComment, 
  fetchComments 
}: { 
  task: Task
  taskComments: { [taskId: string]: Comment[] }
  newComment: { [taskId: string]: string }
  setNewComment: React.Dispatch<React.SetStateAction<{ [taskId: string]: string }>>
  editingComment: { [commentId: string]: string }
  setEditingComment: React.Dispatch<React.SetStateAction<{ [commentId: string]: string }>>
  expandedTaskId: string | null
  setExpandedTaskId: React.Dispatch<React.SetStateAction<string | null>>
  addComment: (taskId: string) => void
  updateComment: (commentId: string, taskId: string) => void
  deleteComment: (commentId: string, taskId: string) => void
  fetchComments: (taskId: string) => void
}) => {
  const comments = taskComments[task.id] || []
  const isExpanded = expandedTaskId === task.id

  const toggleTaskExpansion = (taskId: string) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null)
    } else {
      setExpandedTaskId(taskId)
      if (!taskComments[taskId]) {
        fetchComments(taskId)
      }
    }
  }

  return (
    <div className="mt-4 border-t pt-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleTaskExpansion(task.id)}
        className="gap-1 mb-3"
      >
        <MessageCircle className="w-4 h-4" />
        Commentaires ({comments.length})
        <span className="ml-1">{isExpanded ? "▲" : "▼"}</span>
      </Button>

      {isExpanded && (
        <div className="space-y-4">
          {/* Ajouter un commentaire */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Ajouter un commentaire..."
              value={newComment[task.id] || ""}
              onChange={(e) => setNewComment(prev => ({ ...prev, [task.id]: e.target.value }))}
              className="min-h-[60px]"
              rows={2}
            />
            <Button
              size="sm"
              onClick={() => addComment(task.id)}
              disabled={!newComment[task.id]?.trim()}
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Liste des commentaires */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Aucun commentaire pour cette tâche
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {comment.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{comment.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingComment(prev => ({ 
                          ...prev, 
                          [comment.id]: editingComment[comment.id] ? "" : comment.content 
                        }))}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteComment(comment.id, task.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {editingComment[comment.id] ? (
                    <div className="flex gap-2">
                      <Textarea
                        value={editingComment[comment.id]}
                        onChange={(e) => setEditingComment(prev => ({ 
                          ...prev, 
                          [comment.id]: e.target.value 
                        }))}
                        className="min-h-[60px]"
                        rows={2}
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          onClick={() => updateComment(comment.id, task.id)}
                          disabled={!editingComment[comment.id]?.trim()}
                        >
                          <Send className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingComment(prev => ({ 
                            ...prev, 
                            [comment.id]: "" 
                          }))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">{comment.content}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [taskComments, setTaskComments] = useState<{ [taskId: string]: Comment[] }>({})
  const [newComment, setNewComment] = useState<{ [taskId: string]: string }>({})
  const [editingComment, setEditingComment] = useState<{ [commentId: string]: string }>({})
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "TODO" as "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
    dueDate: "",
    projectId: "none",
    assignedTo: "none"
  })

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    // ouvrir la modale si query ?openNew=1
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (url.searchParams.get('openNew') === '1') {
        resetForm()
        setIsDialogOpen(true)
      }
    }
    fetchTasks()
    fetchProjects()
    fetchTags()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks")
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      } else {
        enhancedToast.error("Erreur lors de la récupération des tâches")
      }
    } catch (error) {
      enhancedToast.error("Erreur lors de la récupération des tâches")
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags")
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      }
    } catch (error) {
      console.error("Error fetching tags:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : "/api/tasks"
      const method = editingTask ? "PUT" : "POST"
      
      // Prepare the data for API - convert "none" to undefined for the API
      const apiData = {
        ...formData,
        projectId: formData.projectId === "none" ? undefined : formData.projectId,
        assignedTo: formData.assignedTo === "none" ? undefined : formData.assignedTo
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      })

      if (response.ok) {
        if (editingTask) {
          enhancedToast.taskUpdated(formData.title.trim())
        } else {
          enhancedToast.taskCreated(formData.title.trim())
        }
        setIsDialogOpen(false)
        resetForm()
        fetchTasks()
      } else {
        enhancedToast.taskError()
      }
    } catch (error) {
      enhancedToast.taskError()
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
      projectId: task.project?.id || "none",
      assignedTo: task.assignee?.id || "none"
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (taskId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          enhancedToast.taskDeleted()
          fetchTasks()
        } else {
          enhancedToast.error("Erreur lors de la suppression")
        }
      } catch (error) {
        enhancedToast.error("Erreur lors de la suppression")
      }
    }
  }

  const resetForm = () => {
    setEditingTask(null)
    setFormData({
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: "",
      projectId: "none",
      assignedTo: "none"
    })
  }

  // Handle drag end for moving tasks between columns
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED"

    // Find the task being moved
    const taskIndex = tasks.findIndex(task => task.id === taskId)
    if (taskIndex === -1) return

    const task = tasks[taskIndex]
    
    // If status hasn't changed, no need to update
    if (task.status === newStatus) return

    // Optimistically update the UI
    const updatedTasks = [...tasks]
    updatedTasks[taskIndex] = { ...task, status: newStatus }
    setTasks(updatedTasks)

    try {
      // Update the task status on the server - only send allowed fields
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: task.title,
          description: task.description || undefined,
          status: newStatus,
          priority: task.priority,
          dueDate: task.dueDate || undefined,
          projectId: task.project?.id || undefined,
          assignedTo: task.assignee?.id || undefined
        }),
      })

      if (!response.ok) {
        // Revert the optimistic update if the server request failed
        setTasks(tasks)
        try {
          const errorData = await response.json()
          console.error("API Error:", errorData)
          enhancedToast.error(errorData.error || "Erreur lors de la mise à jour du statut")
        } catch {
          enhancedToast.error("Erreur lors de la mise à jour du statut")
        }
      } else {
        enhancedToast.success("Statut mis à jour avec succès")
      }
    } catch (error) {
      // Revert the optimistic update if the request failed
      setTasks(tasks)
      console.error("Network Error:", error)
      enhancedToast.error("Erreur lors de la mise à jour du statut")
    }
  }

  const addTagToTask = async (taskId: string, tagId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tagId }),
      })

      if (response.ok) {
        enhancedToast.success("Tag ajouté avec succès")
        fetchTasks()
      } else {
        const errorData = await response.json()
        enhancedToast.error(errorData.error || "Erreur lors de l'ajout du tag")
      }
    } catch (error) {
      enhancedToast.error("Erreur lors de l'ajout du tag")
    }
  }

  const removeTagFromTask = async (taskId: string, tagId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/tags/${tagId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        enhancedToast.success("Tag supprimé avec succès")
        fetchTasks()
      } else {
        enhancedToast.error("Erreur lors de la suppression du tag")
      }
    } catch (error) {
      enhancedToast.error("Erreur lors de la suppression du tag")
    }
  }

  const fetchComments = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setTaskComments(prev => ({ ...prev, [taskId]: data }))
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const addComment = async (taskId: string) => {
    const content = newComment[taskId]
    if (!content?.trim()) return

    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        enhancedToast.success("Commentaire ajouté avec succès")
        setNewComment(prev => ({ ...prev, [taskId]: "" }))
        fetchComments(taskId)
      } else {
        enhancedToast.error("Erreur lors de l'ajout du commentaire")
      }
    } catch (error) {
      enhancedToast.error("Erreur lors de l'ajout du commentaire")
    }
  }

  const updateComment = async (commentId: string, taskId: string) => {
    const content = editingComment[commentId]
    if (!content?.trim()) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        enhancedToast.success("Commentaire mis à jour avec succès")
        setEditingComment(prev => ({ ...prev, [commentId]: "" }))
        fetchComments(taskId)
      } else {
        enhancedToast.error("Erreur lors de la mise à jour du commentaire")
      }
    } catch (error) {
      enhancedToast.error("Erreur lors de la mise à jour du commentaire")
    }
  }

  const deleteComment = async (commentId: string, taskId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) {
      try {
        const response = await fetch(`/api/comments/${commentId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          enhancedToast.success("Commentaire supprimé avec succès")
          fetchComments(taskId)
        } else {
          enhancedToast.error("Erreur lors de la suppression du commentaire")
        }
      } catch (error) {
        enhancedToast.error("Erreur lors de la suppression du commentaire")
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "TODO":
        return <Clock className="w-4 h-4" />
      case "IN_PROGRESS":
        return <AlertCircle className="w-4 h-4" />
      case "DONE":
        return <CheckCircle className="w-4 h-4" />
      case "ARCHIVED":
        return <Archive className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "secondary"
      case "IN_PROGRESS":
        return "default"
      case "DONE":
        return "outline"
      case "ARCHIVED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "destructive"
      case "MEDIUM":
        return "default"
      case "LOW":
        return "secondary"
      default:
        return "default"
    }
  }



  // Composant pour gérer les tags d'une tâche
  const TagManager = ({ task, availableTags }: { task: Task; availableTags: Tag[] }) => {
    const [isAddingTag, setIsAddingTag] = useState(false)
    const [selectedTagId, setSelectedTagId] = useState("")

    const handleAddTag = () => {
      if (selectedTagId) {
        addTagToTask(task.id, selectedTagId)
        setIsAddingTag(false)
        setSelectedTagId("")
      }
    }

    const taskTags = task.tags || []
    const unusedTags = availableTags.filter(tag => !taskTags.some(taskTag => taskTag.id === tag.id))

    return (
      <div className="flex flex-wrap gap-2">
        {taskTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="outline"
            className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground group"
            style={{ backgroundColor: tag.color + "20", borderColor: tag.color }}
            onClick={() => removeTagFromTask(task.id, tag.id)}
          >
            <Tag className="w-3 h-3" />
            {tag.name}
            <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Badge>
        ))}
        
        {isAddingTag && unusedTags.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={selectedTagId} onValueChange={setSelectedTagId}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                {unusedTags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAddTag} disabled={!selectedTagId}>
              Ajouter
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAddingTag(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {!isAddingTag && unusedTags.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingTag(true)}
            className="gap-1"
          >
            <Tag className="w-3 h-3" />
            Ajouter tag
          </Button>
        )}
      </div>
    )
  }

  // Composant draggable pour les tâches dans la vue Kanban
  const DraggableTask = ({ task }: { task: Task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging,
    } = useDraggable({ id: task.id })

    const style = {
      transform: CSS.Translate.toString(transform),
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="cursor-grab hover:shadow-sm transition-shadow active:cursor-grabbing"
      >
        <CardContent className="p-3">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-1 flex-wrap">
              <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">
                {task.priority === "HIGH" && "Haute"}
                {task.priority === "MEDIUM" && "Moyenne"}
                {task.priority === "LOW" && "Basse"}
              </Badge>
              {task.project && (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ backgroundColor: task.project.color + "20", borderColor: task.project.color }}
                >
                  {task.project.name}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              {task.dueDate && (
                <span className="text-xs text-muted-foreground">
                  {new Date(task.dueDate).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
              )}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(task)}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(task.id)}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Composant droppable pour les colonnes du Kanban
  const DroppableColumn = ({ status, children, title, count }: { 
    status: string; 
    children: React.ReactNode; 
    title: string; 
    count: number;
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: status,
    })

    return (
      <Card className={`h-fit transition-colors ${isOver ? 'bg-muted/50 border-primary' : ''}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            {getStatusIcon(status)}
            {title}
            <Badge variant="secondary" className="ml-auto">
              {count}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent 
          ref={setNodeRef}
          className="space-y-3 min-h-[200px]"
        >
          {children}
        </CardContent>
      </Card>
    )
  }

  // Grouper les tâches par statut pour la vue Kanban
  const getTasksByStatus = () => {
    return {
      TODO: tasks.filter(task => task.status === "TODO"),
      IN_PROGRESS: tasks.filter(task => task.status === "IN_PROGRESS"),
      DONE: tasks.filter(task => task.status === "DONE"),
      ARCHIVED: tasks.filter(task => task.status === "ARCHIVED")
    }
  }

  // Grouper les tâches par date pour la vue Calendrier
  const getTasksByDate = () => {
    const tasksByDate: { [key: string]: Task[] } = {}
    
    tasks.forEach(task => {
      if (task.dueDate) {
        const date = new Date(task.dueDate).toDateString()
        if (!tasksByDate[date]) {
          tasksByDate[date] = []
        }
        tasksByDate[date].push(task)
      }
    })
    
    return tasksByDate
  }

  const tasksByStatus = getTasksByStatus()
  const tasksByDate = getTasksByDate()

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
      {/* Raccourci clavier global: Ctrl/Cmd+N */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              document.addEventListener('keydown', function(e){
                var key = (e.key || '').toLowerCase();
                if((e.ctrlKey||e.metaKey) && key==='n'){
                  e.preventDefault();
                  var btn = document.getElementById('new-task-button');
                  if(btn){ btn.click(); }
                }
              });
            })();
          `,
        }}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Gérez toutes vos tâches et restez organisé
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={resetForm} id="new-task-button">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit} id="new-task-form">
              <DialogHeader>
                <DialogTitle>
                  {editingTask ? "Modifier la tâche" : "Créer une nouvelle tâche"}
                </DialogTitle>
                <DialogDescription>
                  {editingTask 
                    ? "Modifiez les informations de la tâche ci-dessous."
                    : "Créez une nouvelle tâche en remplissant le formulaire ci-dessous."
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Titre *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  <Label htmlFor="project" className="text-right">
                    Projet
                  </Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun projet</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: project.color }}
                            />
                            {project.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Statut
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">À faire</SelectItem>
                      <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                      <SelectItem value="DONE">Terminé</SelectItem>
                      <SelectItem value="ARCHIVED">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="priority" className="text-right">
                    Priorité
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner une priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Basse</SelectItem>
                      <SelectItem value="MEDIUM">Moyenne</SelectItem>
                      <SelectItem value="HIGH">Haute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dueDate" className="text-right">
                    Date d'échéance
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingTask ? "Mettre à jour" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Views */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="gap-2">
            <List className="w-4 h-4" />
            Liste
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-2">
            <LayoutGrid className="w-4 h-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="w-4 h-4" />
            Calendrier
          </TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-4">
            {tasks.length === 0 ? (
              <Card role="alert" aria-live="polite">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune tâche</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Vous n'avez aucune tâche pour le moment. Créez votre première tâche pour commencer !
                  </p>
                </CardContent>
              </Card>
            ) : (
              tasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow" onContextMenu={(e)=>{
                  e.preventDefault();
                  const menu = document.getElementById(`task-menu-${task.id}`)
                  if (menu) {
                    menu.style.display = 'block'
                    menu.style.left = `${e.clientX}px`
                    menu.style.top = `${e.clientY}px`
                  }
                }}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status)}
                          <h3 className="text-lg font-semibold">{task.title}</h3>
                        </div>
                        {task.description && (
                          <p className="text-muted-foreground">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={getStatusColor(task.status) as any} className="gap-1">
                            {getStatusIcon(task.status)}
                            {task.status === "TODO" && "À faire"}
                            {task.status === "IN_PROGRESS" && "En cours"}
                            {task.status === "DONE" && "Terminé"}
                            {task.status === "ARCHIVED" && "Archivé"}
                          </Badge>
                          <Badge variant={getPriorityColor(task.priority) as any}>
                            {task.priority === "HIGH" && "Haute"}
                            {task.priority === "MEDIUM" && "Moyenne"}
                            {task.priority === "LOW" && "Basse"}
                          </Badge>
                          {task.project && (
                            <Badge 
                              variant="outline" 
                              className="gap-1"
                              style={{ backgroundColor: task.project.color + "20", borderColor: task.project.color }}
                            >
                              <FolderKanban className="w-3 h-3" />
                              {task.project.name}
                            </Badge>
                          )}
                          {task.dueDate && (
                            <Badge variant="outline" className="gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </Badge>
                          )}
                          <TagManager task={task} availableTags={tags} />
                        </div>
                        <CommentSection 
                          task={task}
                          taskComments={taskComments}
                          newComment={newComment}
                          setNewComment={setNewComment}
                          editingComment={editingComment}
                          setEditingComment={setEditingComment}
                          expandedTaskId={expandedTaskId}
                          setExpandedTaskId={setExpandedTaskId}
                          addComment={addComment}
                          updateComment={updateComment}
                          deleteComment={deleteComment}
                          fetchComments={fetchComments}
                        />
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(task)}
                          className="gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Modifier
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(task.id)}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  {/* Simple menu contextuel natif minimal */}
                  <div id={`task-menu-${task.id}`} className="fixed z-[1000] hidden bg-popover border rounded-md shadow-md text-sm" onMouseLeave={(e)=>{ (e.currentTarget as HTMLDivElement).style.display='none' }}>
                    <button className="block w-full text-left px-3 py-2 hover:bg-accent" onClick={()=>{ handleEdit(task); (document.getElementById(`task-menu-${task.id}`) as HTMLDivElement).style.display='none' }}>Modifier</button>
                    <button className="block w-full text-left px-3 py-2 hover:bg-accent" onClick={()=>{ handleDelete(task.id); (document.getElementById(`task-menu-${task.id}`) as HTMLDivElement).style.display='none' }}>Supprimer</button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Kanban View with Drag and Drop */}
        <TabsContent value="kanban" className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                <DroppableColumn
                  key={status}
                  status={status}
                  title={
                    status === "TODO" ? "À faire" :
                    status === "IN_PROGRESS" ? "En cours" :
                    status === "DONE" ? "Terminé" :
                    "Archivé"
                  }
                  count={statusTasks.length}
                >
                  {statusTasks.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4 min-h-[100px] flex items-center justify-center">
                      Aucune tâche
                    </div>
                  ) : (
                    statusTasks.map((task) => (
                      <DraggableTask key={task.id} task={task} />
                    ))
                  )}
                </DroppableColumn>
              ))}
            </div>
          </DndContext>
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-4">
          {Object.keys(tasksByDate).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune échéance</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Vous n'avez aucune tâche avec une date d'échéance. Ajoutez des dates d'échéance à vos tâches pour voir apparaître un calendrier.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {Object.entries(tasksByDate)
                .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                .map(([date, dateTasks]) => (
                  <Card key={date}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        {new Date(date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dateTasks.map((task) => (
                        <Card key={task.id} className="hover:shadow-sm transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(task.status)}
                                  <h4 className="font-medium">{task.title}</h4>
                                </div>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant={getStatusColor(task.status) as any} className="gap-1 text-xs">
                                    {getStatusIcon(task.status)}
                                    {task.status === "TODO" && "À faire"}
                                    {task.status === "IN_PROGRESS" && "En cours"}
                                    {task.status === "DONE" && "Terminé"}
                                    {task.status === "ARCHIVED" && "Archivé"}
                                  </Badge>
                                  <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">
                                    {task.priority === "HIGH" && "Haute"}
                                    {task.priority === "MEDIUM" && "Moyenne"}
                                    {task.priority === "LOW" && "Basse"}
                                  </Badge>
                                  {task.project && (
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs gap-1"
                                      style={{ backgroundColor: task.project.color + "20", borderColor: task.project.color }}
                                    >
                                      <FolderKanban className="w-3 h-3" />
                                      {task.project.name}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(task)}
                                  className="gap-1"
                                >
                                  <Edit className="w-4 h-4" />
                                  Modifier
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(task.id)}
                                  className="gap-1 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Supprimer
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}