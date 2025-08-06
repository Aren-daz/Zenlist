"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Settings,
  AlertCircle,
  Info,
  CheckCircle,
  X
} from "lucide-react"
import { io, Socket } from "socket.io-client"

interface Notification {
  id: string
  type: "task_assigned" | "task_completed" | "task_updated" | "comment_added" | "system"
  title: string
  message: string
  userId: string
  read: boolean
  createdAt: string
  data?: any
}

export function NotificationCenter() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (session?.user?.id) {
      // Initialize socket connection
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
        auth: {
          userId: session.user.id
        }
      })
      
      setSocket(newSocket)

      // Load initial notifications
      loadNotifications()

      // Listen for new notifications
      newSocket.on("notification", (notification: Notification) => {
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + 1)
      })

      return () => {
        newSocket.close()
      }
    }
  }, [session?.user?.id])

  const loadNotifications = async () => {
    try {
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: Notification) => !n.read).length)
      }
    } catch (error) {
      console.error("Failed to load notifications:", error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST"
      })
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST"
      })
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE"
      })
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      const deleted = notifications.find(n => n.id === notificationId)
      if (deleted && !deleted.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Failed to delete notification:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
        return <AlertCircle className="w-4 h-4 text-blue-500" />
      case "task_completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "task_updated":
        return <Info className="w-4 h-4 text-orange-500" />
      case "comment_added":
        return <Info className="w-4 h-4 text-purple-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "À l'instant"
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`
  }

  if (!session) return null

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-80 z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-8 w-8 p-0"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : "Aucune nouvelle notification"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors ${
                        !notification.read ? "bg-muted/30" : ""
                      }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium line-clamp-1">
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {notification.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatTime(notification.createdAt)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                                className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          {!notification.read && (
                            <div className="flex items-center gap-1 mt-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-xs text-blue-600">Non lu</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <div className="p-3 border-t">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <Settings className="w-4 h-4" />
              Paramètres de notification
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}