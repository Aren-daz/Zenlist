"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tag as TagIcon, User as UserIcon } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Clock, Plus, FolderKanban, Users, MessageSquare, Sparkles, Settings, BarChart2 } from "lucide-react"
import { io, Socket } from "socket.io-client"
import axios from "axios"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

type Task = {
  id: string
  title: string
  description?: string
  status: "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED"
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate?: string
  assignee?: { id: string; name: string }
  tags?: { id: string; name: string; color: string }[]
}

export default function ProjectSpace({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState<string>("")
  const [tasks, setTasks] = useState<Task[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "TODO" as Task["status"],
    priority: "MEDIUM" as Task["priority"],
    dueDate: "",
    assignedTo: "none",
    tagIds: [] as string[],
  })
  const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string }[]>([])
  const [availableTags, setAvailableTags] = useState<{ id: string; name: string; color: string }[]>([])

  useEffect(() => {
    params.then(p => setProjectId(p.id))
  }, [params])

  useEffect(() => {
    if (!projectId) return
    loadTasks()
    // charger assignables + tags
    ;(async () => {
      const usersRes = await fetch('/api/users')
      if (usersRes.ok) {
        const us = await usersRes.json()
        setAvailableUsers(us.map((u: any)=>({ id: u.id, name: u.name || u.email })))
      }
      const tagsRes = await fetch('/api/tags')
      if (tagsRes.ok) {
        const ts = await tagsRes.json()
        setAvailableTags(ts.map((t: any)=>({ id: t.id, name: t.name, color: t.color })))
      }
    })()
  }, [projectId])

  const loadTasks = async () => {
    const res = await fetch(`/api/tasks?projectId=${projectId}`)
    if (res.ok) {
      const data = await res.json()
      setTasks(data)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: Task["status"]) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          description: task.description || undefined,
          status: newStatus,
          priority: task.priority,
          dueDate: task.dueDate || undefined,
          projectId: projectId,
          assignedTo: task.assignee?.id || undefined,
        })
      })
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
      }
    } catch {}
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      title: formData.title.trim(),
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority,
      dueDate: formData.dueDate || undefined,
      projectId,
      assignedTo: formData.assignedTo === 'none' ? undefined : formData.assignedTo,
    }
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) {
      setIsDialogOpen(false)
      setFormData({ title: "", description: "", status: "TODO", priority: "MEDIUM", dueDate: "", assignedTo: 'none', tagIds: [] })
      loadTasks()
    }
  }

  const getStatusBadge = (status: Task["status"]) => {
    switch (status) {
      case "TODO": return <Badge variant="secondary">À faire</Badge>
      case "IN_PROGRESS": return <Badge>En cours</Badge>
      case "DONE": return <Badge variant="outline">Terminé</Badge>
      case "ARCHIVED": return <Badge variant="destructive">Archivé</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-5 h-5" />
          <h1 className="text-2xl font-bold">Tâches du projet</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle tâche
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Créer une tâche</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Titre</label>
                  <Input className="col-span-3" value={formData.title} onChange={(e)=>setFormData({...formData, title: e.target.value})} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Description</label>
                  <Textarea className="col-span-3" value={formData.description} onChange={(e)=>setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Statut</label>
                  <Select value={formData.status} onValueChange={(v)=>setFormData({...formData, status: v as Task["status"]})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Statut" />
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
                  <label className="text-right">Priorité</label>
                  <Select value={formData.priority} onValueChange={(v)=>setFormData({...formData, priority: v as Task["priority"]})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Basse</SelectItem>
                      <SelectItem value="MEDIUM">Moyenne</SelectItem>
                      <SelectItem value="HIGH">Haute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Échéance</label>
                  <Input type="date" className="col-span-3" value={formData.dueDate} onChange={(e)=>setFormData({...formData, dueDate: e.target.value})} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right flex items-center gap-1"><UserIcon className="w-4 h-4"/>Assigné à</label>
                  <Select value={formData.assignedTo} onValueChange={(v)=>setFormData({...formData, assignedTo: v})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {availableUsers.map((u)=> (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right flex items-center gap-1"><TagIcon className="w-4 h-4"/>Tags</label>
                  <div className="col-span-3 flex flex-wrap gap-2">
                    {availableTags.map(t => {
                      const active = formData.tagIds.includes(t.id)
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={()=> setFormData(s=> ({...s, tagIds: active ? s.tagIds.filter(id=>id!==t.id) : [...s.tagIds, t.id]}))}
                          className={`px-2 py-1 rounded border text-xs ${active ? 'bg-primary text-primary-foreground' : ''}`}
                          style={{ borderColor: t.color }}
                        >
                          {t.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Créer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="members" className="gap-1"><Users className="w-4 h-4"/> Membres</TabsTrigger>
          <TabsTrigger value="chat" className="gap-1"><MessageSquare className="w-4 h-4"/> Chat</TabsTrigger>
          <TabsTrigger value="suggestions" className="gap-1"><Sparkles className="w-4 h-4"/> Suggestions</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1"><Settings className="w-4 h-4"/> Paramètres</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1"><BarChart2 className="w-4 h-4"/> Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Liste des tâches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucune tâche dans ce projet.</div>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} className="p-3 border rounded-lg flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{t.title}</div>
                      {t.description && <div className="text-sm text-muted-foreground">{t.description}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(t.status)}
                      <Select value={t.status} onValueChange={(v)=>updateTaskStatus(t.id, v as Task["status"]) }>
                        <SelectTrigger className="w-36 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODO">À faire</SelectItem>
                          <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                          <SelectItem value="DONE">Terminé</SelectItem>
                          <SelectItem value="ARCHIVED">Archivé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <ProjectMembers projectId={projectId} />
        </TabsContent>

        <TabsContent value="chat">
          <ProjectChat projectId={projectId} />
        </TabsContent>

        <TabsContent value="suggestions">
          <ProjectSuggestions projectId={projectId} />
        </TabsContent>

        <TabsContent value="settings">
          <ProjectSettings projectId={projectId} />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader><CardTitle>Analytics</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Progression</div>
                  <Progress value={(tasks.filter(t=>t.status==='DONE').length / Math.max(1, tasks.length))*100} />
                </div>
                <div className="text-sm">Total: {tasks.length} | À faire: {tasks.filter(t=>t.status==='TODO').length} | En cours: {tasks.filter(t=>t.status==='IN_PROGRESS').length} | Terminé: {tasks.filter(t=>t.status==='DONE').length}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Chat flottant du projet */}
      <ProjectChatFloating projectId={projectId} />
    </div>
  )
}

function ProjectMembers({ projectId }: { projectId: string }) {
  const [members, setMembers] = useState<any[]>([])
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("member")
  useEffect(()=>{ if(projectId){ fetch(`/api/projects/${projectId}/members`).then(r=>r.json()).then(setMembers).catch(()=>{}) } },[projectId])
  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch(`/api/projects/${projectId}/members`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, role: role.toUpperCase() }) })
    setEmail(""); setRole("member"); fetch(`/api/projects/${projectId}/members`).then(r=>r.json()).then(setMembers)
  }
  return (
    <Card>
      <CardHeader><CardTitle>Membres</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <form className="flex gap-2" onSubmit={invite}>
          <Input placeholder="email@exemple.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Rôle" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Membre</SelectItem>
              <SelectItem value="viewer">Visualisateur</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit">Ajouter / Inviter</Button>
        </form>
        <div className="space-y-2">
          {members.map((m)=> (
            <div key={m.id} className="flex items-center justify-between p-2 border rounded">
              <div className="text-sm">{m.user.name || m.user.email}</div>
              <Badge variant="secondary">{m.role}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectChat({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<any[]>([])
  const [content, setContent] = useState("")
  useEffect(()=>{ if(projectId){ fetch(`/api/projects/${projectId}/messages`).then(r=>r.json()).then(setMessages).catch(()=>{}) } },[projectId])
  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!content.trim()) return
    const res = await fetch(`/api/projects/${projectId}/messages`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content }) })
    if(res.ok){ setContent(""); fetch(`/api/projects/${projectId}/messages`).then(r=>r.json()).then(setMessages) }
  }
  return (
    <Card>
      <CardHeader><CardTitle>Chat</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-[320px] overflow-auto space-y-2">
          {messages.map((m)=> (
            <div key={m.id} className="p-2 rounded border">
              <div className="text-xs text-muted-foreground">{m.user?.name || m.user?.email}</div>
              <div>{m.content}</div>
            </div>
          ))}
          {messages.length===0 && <div className="text-sm text-muted-foreground">Aucun message</div>}
        </div>
        <form className="flex gap-2" onSubmit={send}>
          <Input placeholder="Écrire un message..." value={content} onChange={(e)=>setContent(e.target.value)} />
          <Button type="submit">Envoyer</Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ProjectChatFloating({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [content, setContent] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [typing, setTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Record<string, { name?: string; at: number }>>({})
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(()=>{
    if (!projectId || !open) return
    const load = () => fetch(`/api/projects/${projectId}/messages`).then(r=>r.json()).then(setMessages).catch(()=>{})
    load()
    const s = io(typeof window !== 'undefined' ? window.location.origin : '', { path: '/api/socketio' })
    setSocket(s)
    s.emit('project:join', { projectId })
    s.on('project:message', (m:any)=> setMessages(prev=> [...prev, m]))
    s.on('project:typing', ({ userId, name, isTyping }: any) => {
      setTypingUsers(prev => {
        const now = Date.now()
        const next = { ...prev }
        if (isTyping) next[userId] = { name, at: now }
        else delete next[userId]
        return next
      })
    })
    const gc = setInterval(()=> {
      setTypingUsers(prev => {
        const now = Date.now(); const next: typeof prev = {}
        Object.entries(prev).forEach(([k,v]) => { if (now - v.at < 3000) next[k]=v })
        return next
      })
    }, 1500)
    return () => { s.close(); clearInterval(gc) }
  },[projectId, open])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!content.trim()) return
    const att: Array<{ name:string; url:string; type?:string }> = []
    for (const f of attachments) {
      // Obtenir un presign S3
      const presign = await fetch('/api/uploads/s3-presign', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ fileName: f.name, fileType: f.type, folder: `projects/${projectId}` }) }).then(r=>r.json())
      const form = new FormData()
      Object.entries(presign.fields).forEach(([k,v])=> form.append(k, String(v)))
      form.append('Content-Type', f.type)
      form.append('file', f)
      await axios.post(presign.url, form, { onUploadProgress: (ev)=>{ /* possibilité de barre de progression par fichier */ } })
      const fileUrl = `${presign.url}/${presign.fields.key}`
      att.push({ name: f.name, url: fileUrl, type: f.type })
    }
    const res = await fetch(`/api/projects/${projectId}/messages`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content, attachments: att }) })
    if(res.ok){ setContent(""); const data = await fetch(`/api/projects/${projectId}/messages`).then(r=>r.json()); setMessages(data) }
  }

  return (
    <div className="fixed right-6 bottom-6 z-50">
      {open && (
        <Card className="mb-3 w-[340px] max-h-[70vh] shadow-xl border">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Conversation du projet</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[46vh] overflow-auto space-y-2 mb-2">
              {messages.map((m)=> (
                <div key={m.id} className="p-2 rounded border">
                  <div className="text-xs text-muted-foreground">{m.user?.name || m.user?.email}</div>
                  <div>{m.content}</div>
                  {m.attachments && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(typeof m.attachments === 'string' ? JSON.parse(m.attachments) : m.attachments).map((a:any, idx:number)=> (
                        <a key={idx} href={a.url} target="_blank" className="text-xs underline">
                          {a.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {messages.length===0 && <div className="text-sm text-muted-foreground">Aucun message</div>}
            </div>
            <form className="flex flex-col gap-2" onSubmit={send}>
              <div className="flex gap-2">
                <Input placeholder="Écrire un message..." value={content} onChange={(e)=>{setContent(e.target.value); setTyping(e.target.value.length>0); socket?.emit('project:typing', { projectId, isTyping: e.target.value.length>0 })}} />
                <Button type="submit">Envoyer</Button>
              </div>
              <div className="flex items-center gap-2">
                <label className="px-2 py-1 border rounded cursor-pointer text-xs">Joindre
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e)=> {
                      const files = Array.from(e.target.files || [])
                      const MAX_FILES = 5
                      const MAX_SIZE_MB = 5
                      const accepted: File[] = []
                      let blocked = 0
                      for (const f of files) {
                        if (accepted.length >= MAX_FILES) { blocked++; continue }
                        if ((f.size/1024/1024) > MAX_SIZE_MB) { blocked++; continue }
                        accepted.push(f)
                      }
                      setAttachments(accepted)
                      if (blocked>0) {
                        alert(`${blocked} fichier(s) ignoré(s): limite ${MAX_FILES} fichiers et ${MAX_SIZE_MB}Mo par fichier`)
                      }
                    }}
                  />
                </label>
                {attachments.length>0 && <span className="text-xs text-muted-foreground">{attachments.length} fichier(s) prêt(s)</span>}
                <span className="ml-auto text-xs text-muted-foreground">
                  {Object.values(typingUsers).length>0 ? `${Object.values(typingUsers).map(u=>u.name||'Quelqu\'un').join(', ')} écrit...` : typing ? 'Vous écrivez...' : ''}
                </span>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      <Button size="icon" className="rounded-full w-12 h-12 shadow-lg" onClick={()=>setOpen(o=>!o)}>
        <MessageSquare className="w-5 h-5" />
      </Button>
    </div>
  )
}

function ProjectSuggestions({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<any[]>([])
  const [content, setContent] = useState("")
  useEffect(()=>{ if(projectId){ fetch(`/api/projects/${projectId}/suggestions`).then(r=>r.json()).then(setItems).catch(()=>{}) } },[projectId])
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!content.trim()) return
    const res = await fetch(`/api/projects/${projectId}/suggestions`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content }) })
    if(res.ok){ setContent(""); fetch(`/api/projects/${projectId}/suggestions`).then(r=>r.json()).then(setItems) }
  }
  const setStatus = async (id:string, status:'OPEN'|'ACCEPTED'|'REJECTED') => {
    await fetch(`/api/projects/${projectId}/suggestions?suggestionId=${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status }) })
    fetch(`/api/projects/${projectId}/suggestions`).then(r=>r.json()).then(setItems)
  }
  return (
    <Card>
      <CardHeader><CardTitle>Suggestions</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <form className="flex gap-2" onSubmit={submit}>
          <Input placeholder="Proposer une amélioration..." value={content} onChange={(e)=>setContent(e.target.value)} />
          <Button type="submit">Proposer</Button>
        </form>
        <div className="space-y-2">
          {items.map((s)=> (
            <div key={s.id} className="p-2 border rounded flex items-center justify-between">
              <div>{s.content}</div>
              <div className="flex gap-2 text-xs">
                <Badge variant={s.status==='OPEN'?'secondary':s.status==='ACCEPTED'?'outline':'destructive'}>{s.status}</Badge>
                <Button size="sm" variant="outline" onClick={()=>setStatus(s.id,'ACCEPTED')}>Accepter</Button>
                <Button size="sm" variant="outline" onClick={()=>setStatus(s.id,'REJECTED')}>Rejeter</Button>
              </div>
            </div>
          ))}
          {items.length===0 && <div className="text-sm text-muted-foreground">Aucune suggestion</div>}
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectSettings({ projectId }: { projectId: string }) {
  const [data, setData] = useState({ name: "", description: "", color: "#3b82f6" })
  useEffect(()=>{ if(projectId){ fetch(`/api/projects/${projectId}`).then(r=>r.json()).then((p)=> setData({ name: p.name, description: p.description || '', color: p.color || '#3b82f6' })) } },[projectId])
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch(`/api/projects/${projectId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) })
  }
  return (
    <Card>
      <CardHeader><CardTitle>Paramètres du projet</CardTitle></CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={save}>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right">Nom</label>
            <Input className="col-span-3" value={data.name} onChange={(e)=>setData({...data, name:e.target.value})} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right">Description</label>
            <Textarea className="col-span-3" value={data.description} onChange={(e)=>setData({...data, description:e.target.value})} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right">Couleur</label>
            <Input type="color" className="col-span-3" value={data.color} onChange={(e)=>setData({...data, color:e.target.value})} />
          </div>
          <Button type="submit">Enregistrer</Button>
        </form>
      </CardContent>
    </Card>
  )
}


