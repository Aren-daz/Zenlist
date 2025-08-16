import { toast } from "sonner"
import React, { createElement } from "react"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  Settings,
  LogIn,
  LogOut,
  UserPlus,
  FolderPlus,
  Calendar,
  Tag,
  MessageSquare
} from "lucide-react"

type ToastType = 'success' | 'error' | 'warning' | 'info'
type ActionType = 
  | 'create' | 'update' | 'delete' 
  | 'login' | 'logout' | 'signup'
  | 'invite' | 'remove_member' | 'change_role'
  | 'save_settings'

interface EnhancedToastOptions {
  title?: string
  description?: string
  duration?: number
}

const getIcon = (type: ToastType, action?: ActionType) => {
  // Icônes spécifiques aux actions
  if (action) {
    switch (action) {
      case 'create':
        return Plus
      case 'update':
        return Edit3
      case 'delete':
        return Trash2
      case 'login':
        return LogIn
      case 'logout':
        return LogOut
      case 'signup':
        return UserPlus
      case 'invite':
        return Users
      case 'remove_member':
        return Users
      case 'change_role':
        return Users
      case 'save_settings':
        return Settings
      default:
        break
    }
  }

  // Icônes par défaut selon le type
  switch (type) {
    case 'success':
      return CheckCircle
    case 'error':
      return XCircle
    case 'warning':
      return AlertTriangle
    case 'info':
      return Info
    default:
      return Info
  }
}

const getColors = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        iconColor: 'text-green-600',
        borderColor: 'border-green-200',
        bgColor: 'bg-green-50'
      }
    case 'error':
      return {
        iconColor: 'text-red-600',
        borderColor: 'border-red-200',
        bgColor: 'bg-red-50'
      }
    case 'warning':
      return {
        iconColor: 'text-orange-600',
        borderColor: 'border-orange-200',
        bgColor: 'bg-orange-50'
      }
    case 'info':
      return {
        iconColor: 'text-blue-600',
        borderColor: 'border-blue-200',
        bgColor: 'bg-blue-50'
      }
    default:
      return {
        iconColor: 'text-gray-600',
        borderColor: 'border-gray-200',
        bgColor: 'bg-gray-50'
      }
  }
}

export const enhancedToast = {
  success: (message: string, options?: EnhancedToastOptions & { action?: ActionType }) => {
    const Icon = getIcon('success', options?.action)
    const colors = getColors('success')
    
    toast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: createElement(Icon, { 
        className: `w-5 h-5 ${colors.iconColor}` 
      }),
      className: `${colors.bgColor} ${colors.borderColor} border-l-4`,
    })
  },

  error: (message: string, options?: EnhancedToastOptions & { action?: ActionType }) => {
    const Icon = getIcon('error', options?.action)
    const colors = getColors('error')
    
    toast.error(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      icon: createElement(Icon, { 
        className: `w-5 h-5 ${colors.iconColor}` 
      }),
      className: `${colors.bgColor} ${colors.borderColor} border-l-4`,
    })
  },

  warning: (message: string, options?: EnhancedToastOptions & { action?: ActionType }) => {
    const Icon = getIcon('warning', options?.action)
    const colors = getColors('warning')
    
    toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: createElement(Icon, { 
        className: `w-5 h-5 ${colors.iconColor}` 
      }),
      className: `${colors.bgColor} ${colors.borderColor} border-l-4`,
    })
  },

  info: (message: string, options?: EnhancedToastOptions & { action?: ActionType }) => {
    const Icon = getIcon('info', options?.action)
    const colors = getColors('info')
    
    toast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: createElement(Icon, { 
        className: `w-5 h-5 ${colors.iconColor}` 
      }),
      className: `${colors.bgColor} ${colors.borderColor} border-l-4`,
    })
  },

  // Méthodes spécialisées pour les actions courantes
  taskCreated: (taskTitle?: string) => {
    enhancedToast.success("Tâche créée avec succès", {
      description: taskTitle ? `"${taskTitle}" a été ajoutée` : undefined,
      action: 'create'
    })
  },

  taskUpdated: (taskTitle?: string) => {
    enhancedToast.success("Tâche mise à jour", {
      description: taskTitle ? `"${taskTitle}" a été modifiée` : undefined,
      action: 'update'
    })
  },

  taskDeleted: (taskTitle?: string) => {
    enhancedToast.success("Tâche supprimée", {
      description: taskTitle ? `"${taskTitle}" a été supprimée` : undefined,
      action: 'delete'
    })
  },

  projectCreated: (projectName?: string) => {
    enhancedToast.success("Projet créé avec succès", {
      description: projectName ? `"${projectName}" est maintenant disponible` : undefined,
      action: 'create'
    })
  },

  projectUpdated: (projectName?: string) => {
    enhancedToast.success("Projet mis à jour", {
      description: projectName ? `"${projectName}" a été modifié` : undefined,
      action: 'update'
    })
  },

  projectDeleted: (projectName?: string) => {
    enhancedToast.success("Projet supprimé", {
      description: projectName ? `"${projectName}" a été supprimé` : undefined,
      action: 'delete'
    })
  },

  memberInvited: (email?: string) => {
    enhancedToast.success("Invitation envoyée", {
      description: email ? `Invitation envoyée à ${email}` : undefined,
      action: 'invite'
    })
  },

  memberRemoved: (name?: string) => {
    enhancedToast.success("Membre retiré", {
      description: name ? `${name} a été retiré de l'équipe` : undefined,
      action: 'remove_member'
    })
  },

  roleChanged: (name?: string, newRole?: string) => {
    enhancedToast.success("Rôle modifié", {
      description: name && newRole ? `${name} est maintenant ${newRole}` : undefined,
      action: 'change_role'
    })
  },

  settingsSaved: (section?: string) => {
    enhancedToast.success("Paramètres sauvegardés", {
      description: section ? `Les paramètres ${section} ont été mis à jour` : undefined,
      action: 'save_settings'
    })
  },

  loginSuccess: () => {
    enhancedToast.success("Connexion réussie", {
      description: "Bienvenue sur Zenlist",
      action: 'login'
    })
  },

  logoutSuccess: () => {
    enhancedToast.success("Déconnexion réussie", {
      description: "À bientôt sur Zenlist",
      action: 'logout'
    })
  },

  signupSuccess: () => {
    enhancedToast.success("Compte créé avec succès", {
      description: "Bienvenue sur Zenlist",
      action: 'signup'
    })
  },

  // Méthodes d'erreur courantes
  taskError: () => {
    enhancedToast.error("Erreur avec la tâche", {
      description: "Veuillez réessayer",
      action: 'update'
    })
  },

  projectError: () => {
    enhancedToast.error("Erreur avec le projet", {
      description: "Veuillez réessayer",
      action: 'update'
    })
  },

  networkError: () => {
    enhancedToast.error("Erreur de connexion", {
      description: "Vérifiez votre connexion internet",
    })
  },

  permissionError: () => {
    enhancedToast.error("Permission refusée", {
      description: "Vous n'avez pas les droits pour cette action",
    })
  }
}

export default enhancedToast
