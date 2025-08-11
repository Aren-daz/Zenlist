"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { useTranslations } from 'next-intl'
import { useChangeLocale, getCurrentLocale } from '@/lib/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Save,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe
} from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const { theme, setTheme } = useTheme()
  const { changeLocale, isPending } = useChangeLocale()
  const [isLoading, setIsLoading] = useState(false)
  
  // Traductions
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const tToast = useTranslations('toast')
  const tLanguages = useTranslations('languages')
  
  // États pour les formulaires
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: ""
  })
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    weeklyUpdates: false
  })
  
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false
  })
  
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "light",
    language: getCurrentLocale(),
    timezone: "europe-paris",
    compactView: false
  })

  // Charger les données initiales
  useEffect(() => {
    if (session?.user) {
      setProfileData(prev => ({
        ...prev,
        name: session.user.name || "",
        email: session.user.email || ""
      }))
    }
    
    // Charger le thème actuel
    setAppearanceSettings(prev => ({
      ...prev,
      theme: theme || "light"
    }))
  }, [session, theme])

  // Hydrater depuis la base (persistance) au montage / changement d'auth
  useEffect(() => {
    let mounted = true
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/users/profile', { cache: 'no-store' })
        if (!res.ok) return
        const u = await res.json()
        if (!mounted) return
        setProfileData(prev => ({
          ...prev,
          name: u?.name || prev.name,
          email: u?.email || prev.email,
          phone: u?.phone || "",
          location: u?.location || "",
          bio: u?.bio || "",
        }))
      } catch {}
    }
    loadProfile()
    return () => { mounted = false }
  }, [status])

  if (status === "loading") {
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
              Vous devez être connecté pour accéder aux paramètres
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

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      // Sauvegarder le profil via API
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })
      
      if (response.ok) {
        toast.success(tToast('profileUpdated'))
      } else {
        toast.error(tToast('profileError'))
      }
    } catch (error) {
      toast.error(tToast('profileError'))
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSaveNotifications = async () => {
    setIsLoading(true)
    try {
      // Sauvegarder les préférences de notifications
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings))
      toast.success(tToast('notificationsUpdated'))
    } catch (error) {
      toast.error(tToast('saveError'))
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSaveAppearance = async () => {
    setIsLoading(true)
    try {
      // Appliquer le thème
      setTheme(appearanceSettings.theme)
      
      // Changer la langue si elle a changé
      const currentLang = getCurrentLocale()
      if (appearanceSettings.language !== currentLang) {
        changeLocale(appearanceSettings.language)
      }
      
      // Sauvegarder les préférences d'apparence
      localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings))
      
      toast.success(tToast('appearanceUpdated'))
    } catch (error) {
      toast.error(tToast('saveError'))
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSavePassword = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error(tToast('passwordMismatch'))
      return
    }
    
    setIsLoading(true)
    try {
      // Changer le mot de passe via API
      const response = await fetch('/api/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: securityData.currentPassword,
          newPassword: securityData.newPassword
        })
      })
      
      if (response.ok) {
        toast.success(tToast('passwordUpdated'))
        setSecurityData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }))
      } else {
        toast.error(tToast('passwordError'))
      }
    } catch (error) {
      toast.error(tToast('passwordError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <Button onClick={handleSaveProfile} disabled={isLoading} className="gap-2">
          <Save className="w-4 h-4" />
          {isLoading ? tCommon('saving') : t('saveAll')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('profile.title')}</CardTitle>
            <CardDescription>
              {t('profile.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="text-2xl">
                    {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <form className="absolute bottom-0 right-0" onChange={async (e:any)=>{
                  const input = e.currentTarget.querySelector('input[type=file]') as HTMLInputElement
                  if (!input?.files?.[0]) return
                  const fd = new FormData()
                  fd.append('file', input.files[0])
                  const res = await fetch('/api/users/avatar', { method: 'POST', body: fd })
                  if (res.ok) {
                    toast.success('Avatar mis à jour')
                    try { await update() } catch {}
                    location.reload()
                  } else {
                    toast.error('Erreur lors du téléchargement')
                  }
                }}>
                  <input type="file" accept="image/*" className="hidden" id="avatar-input" />
                  <label htmlFor="avatar-input" className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-primary text-primary-foreground cursor-pointer">
                    <Camera className="w-4 h-4" />
                  </label>
                </form>
              </div>
              <div className="text-center">
                <h3 className="font-semibold">{session?.user?.name || "Utilisateur"}</h3>
                <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                <Badge variant="secondary" className="mt-2">
                  {t('profile.memberSince')} {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{session?.user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{t('profile.joinedOn')} {new Date().toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span>{tLanguages(appearanceSettings.language)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile" className="gap-2">
                  <User className="w-4 h-4" />
                  {t('profile.title')}
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                  <Bell className="w-4 h-4" />
                  {t('notifications.title')}
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <Shield className="w-4 h-4" />
                  {t('security.title')}
                </TabsTrigger>
                <TabsTrigger value="appearance" className="gap-2">
                  <Palette className="w-4 h-4" />
                  {t('appearance.title')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('profile.fullName')}</Label>
                    <Input 
                      id="name" 
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={t('profile.fullName')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('profile.email')}</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder={t('profile.email')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('profile.phone')}</Label>
                    <Input 
                      id="phone" 
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">{t('profile.location')}</Label>
                    <Input 
                      id="location" 
                      value={profileData.location}
                      onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder={t('profile.location')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">{t('profile.bio')}</Label>
                  <Textarea 
                    id="bio" 
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder={t('profile.bioPlaceholder')}
                    rows={3}
                  />
                </div>
                <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full">
                  {t('profile.save')}
                </Button>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevoir des notifications par email
                      </p>
                    </div>
                    <Switch 
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifications push</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevoir des notifications push dans le navigateur
                      </p>
                    </div>
                    <Switch 
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Rappels de tâches</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevoir des rappels pour les tâches à venir
                      </p>
                    </div>
                    <Switch 
                      checked={notificationSettings.taskReminders}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, taskReminders: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mises à jour hebdomadaires</Label>
                      <p className="text-sm text-muted-foreground">
                        Résumé hebdomadaire de votre activité
                      </p>
                    </div>
                    <Switch 
                      checked={notificationSettings.weeklyUpdates}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, weeklyUpdates: checked }))}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveNotifications} disabled={isLoading} className="w-full">
                  Sauvegarder les notifications
                </Button>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Mot de passe actuel</Label>
                    <Input 
                      id="current-password" 
                      type="password"
                      value={securityData.currentPassword}
                      onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Entrez votre mot de passe actuel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <Input 
                      id="new-password" 
                      type="password"
                      value={securityData.newPassword}
                      onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Entrez votre nouveau mot de passe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                    <Input 
                      id="confirm-password" 
                      type="password"
                      value={securityData.confirmPassword}
                      onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirmez votre nouveau mot de passe"
                    />
                  </div>
                  <Button onClick={handleSavePassword} disabled={isLoading} className="w-full">
                    Mettre à jour le mot de passe
                  </Button>
                </div>
                <Separator />
              </TabsContent>

              <TabsContent value="appearance" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('appearance.theme')}</Label>
                    <Select 
                      value={appearanceSettings.theme} 
                      onValueChange={(value) => setAppearanceSettings(prev => ({ ...prev, theme: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{t('appearance.light')}</SelectItem>
                        <SelectItem value="dark">{t('appearance.dark')}</SelectItem>
                        <SelectItem value="system">{t('appearance.system')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('appearance.language')}</Label>
                    <Select 
                      value={appearanceSettings.language} 
                      onValueChange={(value) => setAppearanceSettings(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">{tLanguages('fr')}</SelectItem>
                        <SelectItem value="en">{tLanguages('en')}</SelectItem>
                        <SelectItem value="es">{tLanguages('es')}</SelectItem>
                        <SelectItem value="de">{tLanguages('de')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('appearance.timezone')}</Label>
                    <Select 
                      value={appearanceSettings.timezone} 
                      onValueChange={(value) => setAppearanceSettings(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="europe-paris">Europe/Paris</SelectItem>
                        <SelectItem value="america-new-york">America/New_York</SelectItem>
                        <SelectItem value="asia-tokyo">Asia/Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('appearance.compactView')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('appearance.compactViewDesc')}
                      </p>
                    </div>
                    <Switch 
                      checked={appearanceSettings.compactView}
                      onCheckedChange={(checked) => setAppearanceSettings(prev => ({ ...prev, compactView: checked }))}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveAppearance} disabled={isLoading || isPending} className="w-full">
                  {isPending ? tCommon('loading') : t('appearance.save')}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}