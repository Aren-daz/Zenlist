"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  User, 
  Tag, 
  FolderKanban,
  Clock,
  CheckCircle,
  AlertTriangle,
  Circle
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface SearchFilters {
  query: string
  status: string[]
  priority: string[]
  projects: string[]
  tags: string[]
  assignee: string[]
  dueDateFrom: string
  dueDateTo: string
  createdBy: string
}

interface SearchResult {
  id: string
  title: string
  description: string
  status: string
  priority: string
  dueDate?: string
  project?: { id: string; name: string; color: string }
  tags: Array<{ id: string; name: string; color: string }>
  assignee?: { id: string; name: string; avatar?: string }
  createdBy: { id: string; name: string; avatar?: string }
  createdAt: string
  type: "task" | "project" | "comment"
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    status: [],
    priority: [],
    projects: [],
    tags: [],
    assignee: [],
    dueDateFrom: "",
    dueDateTo: "",
    createdBy: ""
  })
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // State for dynamic data
  const [availableProjects, setAvailableProjects] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; name: string; avatar?: string }>>([])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      // Load filter data when search opens
      loadFilterData()
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const loadFilterData = async () => {
    try {
      // Load projects
      const projectsResponse = await fetch("/api/projects")
      if (projectsResponse.ok) {
        const projects = await projectsResponse.json()
        setAvailableProjects(projects.map((p: any) => ({
          id: p.id,
          name: p.name,
          color: p.color || "#3b82f6"
        })))
      }

      // Load tags
      const tagsResponse = await fetch("/api/tags")
      if (tagsResponse.ok) {
        const tags = await tagsResponse.json()
        setAvailableTags(tags.map((t: any) => ({
          id: t.id,
          name: t.name,
          color: t.color || "#6b7280"
        })))
      }

      // Load users
      const usersResponse = await fetch("/api/users")
      if (usersResponse.ok) {
        const users = await usersResponse.json()
        setAvailableUsers(users.map((u: any) => ({
          id: u.id,
          name: u.name || u.email,
          avatar: u.avatar
        })))
      }
    } catch (error) {
      console.error("Failed to load filter data:", error)
    }
  }

  const handleSearch = async () => {
    setIsLoading(true)
    try {
      // Build search query parameters
      const params = new URLSearchParams()
      if (searchQuery) params.append("q", searchQuery)
      if (filters.status.length > 0) params.append("status", filters.status.join(","))
      if (filters.priority.length > 0) params.append("priority", filters.priority.join(","))
      if (filters.projects.length > 0) params.append("projects", filters.projects.join(","))
      if (filters.tags.length > 0) params.append("tags", filters.tags.join(","))
      if (filters.assignee.length > 0) params.append("assignee", filters.assignee.join(","))
      if (filters.dueDateFrom) params.append("dueFrom", filters.dueDateFrom)
      if (filters.dueDateTo) params.append("dueTo", filters.dueDateTo)
      if (filters.createdBy) params.append("createdBy", filters.createdBy)

      const response = await fetch(`/api/search?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      } else {
        setResults([])
      }
    } catch (error) {
      console.error("Search failed:", error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "TODO":
        return <Circle className="w-4 h-4 text-gray-400" />
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4 text-orange-500" />
      case "DONE":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Circle className="w-4 h-4 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "destructive"
      case "MEDIUM":
        return "secondary"
      case "LOW":
        return "outline"
      default:
        return "outline"
    }
  }

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      query: "",
      status: [],
      priority: [],
      projects: [],
      tags: [],
      assignee: [],
      dueDateFrom: "",
      dueDateTo: "",
      createdBy: ""
    })
    setSearchQuery("")
    setResults([])
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "TODO": return "À faire"
      case "IN_PROGRESS": return "En cours"
      case "DONE": return "Terminé"
      case "ARCHIVED": return "Archivé"
      case "ACTIVE": return "Actif"
      default: return status
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "HIGH": return "Haute"
      case "MEDIUM": return "Moyenne"
      case "LOW": return "Basse"
      default: return priority
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher des tâches, projets, commentaires..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch()
                }
              }}
              className="flex-1"
              autoFocus
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b bg-muted/30">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Statut</label>
                <div className="space-y-1">
                  {["TODO", "IN_PROGRESS", "DONE"].map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filters.status.includes(status)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleFilterChange("status", [...filters.status, status])
                          } else {
                            handleFilterChange("status", filters.status.filter(s => s !== status))
                          }
                        }}
                      />
                      <label htmlFor={`status-${status}`} className="text-sm">
                        {getStatusText(status)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priorité</label>
                <div className="space-y-1">
                  {["HIGH", "MEDIUM", "LOW"].map((priority) => (
                    <div key={priority} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priority-${priority}`}
                        checked={filters.priority.includes(priority)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleFilterChange("priority", [...filters.priority, priority])
                          } else {
                            handleFilterChange("priority", filters.priority.filter(p => p !== priority))
                          }
                        }}
                      />
                      <label htmlFor={`priority-${priority}`} className="text-sm">
                        {getPriorityText(priority)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Projet</label>
                <Select onValueChange={(value) => {
                  if (value && !filters.projects.includes(value)) {
                    handleFilterChange("projects", [...filters.projects, value])
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.projects.map((projectId) => {
                    const project = availableProjects.find(p => p.id === projectId)
                    return project ? (
                      <Badge key={projectId} variant="secondary" className="text-xs">
                        {project.name}
                        <button
                          onClick={() => handleFilterChange("projects", filters.projects.filter(p => p !== projectId))}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Effacer les filtres
              </Button>
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? "Recherche..." : "Appliquer les filtres"}
              </Button>
            </div>
          </div>
        )}

        {/* Search Results */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              {results.length === 0 && !isLoading ? (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "Aucun résultat trouvé" : "Entrez un terme de recherche pour commencer"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((result) => (
                    <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(result.status)}
                              <h3 className="font-medium truncate">{result.title}</h3>
                              <Badge variant={getPriorityColor(result.priority)} className="text-xs">
                                {getPriorityText(result.priority)}
                              </Badge>
                              {result.type === "task" && (
                                <Badge variant="outline" className="text-xs">
                                  Tâche
                                </Badge>
                              )}
                              {result.type === "project" && (
                                <Badge variant="outline" className="text-xs">
                                  Projet
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {result.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {result.dueDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(result.dueDate), "dd MMM yyyy", { locale: fr })}
                                </div>
                              )}
                              {result.project && (
                                <div className="flex items-center gap-1">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: result.project.color }}
                                  />
                                  {result.project.name}
                                </div>
                              )}
                              {result.assignee && (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {result.assignee.name}
                                </div>
                              )}
                            </div>
                            {result.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {result.tags.map((tag) => (
                                  <Badge
                                    key={tag.id}
                                    variant="secondary"
                                    className="text-xs"
                                    style={{ backgroundColor: tag.color + "20", color: tag.color }}
                                  >
                                    {tag.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Results Footer */}
        {results.length > 0 && (
          <div className="p-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}</span>
              <Button variant="outline" size="sm">
                Exporter les résultats
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}