"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [resetOpen, setResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        router.push("/")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sign in</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Dialog open={resetOpen} onOpenChange={setResetOpen}>
              <DialogTrigger asChild>
                <Button variant="link" className="text-sm">Mot de passe oublié ?</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                  <DialogDescription>
                    En environnement sans e-mail, un lien est généré et affiché ici pour que vous puissiez réinitialiser votre mot de passe.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email du compte</Label>
                    <div className="flex gap-2">
                      <Input id="reset-email" type="email" value={resetEmail} onChange={(e)=>setResetEmail(e.target.value)} placeholder="votre@email.com" />
                      <Button
                        type="button"
                        disabled={resetLoading || !resetEmail}
                        onClick={async ()=>{
                          try {
                            setResetLoading(true)
                            const res = await fetch('/api/auth/password/reset/request', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: resetEmail }) })
                            const data = await res.json()
                            if (res.ok) {
                              if (data.token) {
                                setResetToken(data.token)
                                toast.success('Lien généré. Utilisez le token ci-dessous pour réinitialiser.')
                              } else {
                                toast.success('Si le compte existe, un lien a été généré.')
                              }
                            } else {
                              toast.error(data.error || 'Échec de la demande')
                            }
                          } catch (e) {
                            toast.error('Erreur réseau')
                          } finally {
                            setResetLoading(false)
                          }
                        }}
                      >
                        {resetLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Demander'}
                      </Button>
                    </div>
                  </div>
                  {resetToken && (
                    <div className="space-y-2">
                      <Label>Token généré (copiez-le)</Label>
                      <div className="flex gap-2">
                        <Input value={resetToken} readOnly />
                        <Button type="button" variant="outline" onClick={()=>{ navigator.clipboard.writeText(resetToken); toast.success('Token copié'); }}>Copier</Button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="reset-token">Token</Label>
                    <Input id="reset-token" value={resetToken} onChange={(e)=>setResetToken(e.target.value)} placeholder="Collez le token reçu" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <Input id="new-password" type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} placeholder="Nouveau mot de passe" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" disabled={resetLoading || !resetToken || !newPassword} onClick={async ()=>{
                    try {
                      setResetLoading(true)
                      const res = await fetch('/api/auth/password/reset/confirm', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token: resetToken, password: newPassword }) })
                      const data = await res.json()
                      if (res.ok) {
                        toast.success('Mot de passe mis à jour. Connectez-vous avec le nouveau mot de passe.')
                        setResetOpen(false)
                        setPassword("")
                      } else {
                        toast.error(data.error || 'Échec de la réinitialisation')
                      }
                    } catch {
                      toast.error('Erreur réseau')
                    } finally {
                      setResetLoading(false)
                    }
                  }}>
                    Réinitialiser
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}