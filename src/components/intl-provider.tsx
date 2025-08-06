"use client"

import { NextIntlClientProvider } from 'next-intl'
import { useEffect, useState } from 'react'
import { getCurrentLocale } from '@/lib/locale'

// Messages par défaut en attendant le chargement
const defaultMessages = {
  common: {
    loading: "Chargement...",
    save: "Enregistrer",
    cancel: "Annuler"
  }
}

export function IntlProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState(defaultMessages)
  const [locale, setLocale] = useState('fr')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadMessages() {
      try {
        const currentLocale = getCurrentLocale()
        setLocale(currentLocale)
        
        // Charger les messages pour la langue actuelle
        const messagesModule = await import(`../messages/${currentLocale}.json`)
        setMessages(messagesModule.default)
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error)
        // Utiliser les messages français par défaut en cas d'erreur
        try {
          const frMessages = await import('../messages/fr.json')
          setMessages(frMessages.default)
        } catch (fallbackError) {
          console.error('Erreur lors du chargement des messages de fallback:', fallbackError)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()

    // Écouter les changements de langue (rechargement de page)
    const handleStorageChange = () => {
      loadMessages()
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  if (isLoading) {
    return <div>Chargement...</div>
  }

  return (
    <NextIntlClientProvider 
      locale={locale} 
      messages={messages}
      timeZone="Europe/Paris"
    >
      {children}
    </NextIntlClientProvider>
  )
}