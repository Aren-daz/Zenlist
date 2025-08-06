"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Zap, 
  Database, 
  Network, 
  MemoryStick, 
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from "lucide-react"

interface PerformanceMetrics {
  loadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  memoryUsage: number
  apiResponseTime: number
  cacheHitRate: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const measurePerformance = async () => {
    setLoading(true)
    
    // Simulate API response time measurement
    const apiStartTime = performance.now()
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50))
    const apiResponseTime = performance.now() - apiStartTime

    // Get Web Vitals
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType("paint")
    const lcp = performance.getEntriesByType("largest-contentful-paint")[0]
    const fid = performance.getEntriesByType("first-input")[0]

    // Calculate memory usage (approximation)
    const memoryUsage = Math.random() * 100 // Simulated memory usage in MB

    // Simulate cache hit rate
    const cacheHitRate = Math.random() * 100

    const newMetrics: PerformanceMetrics = {
      loadTime: navigation?.domComplete || 0,
      firstContentfulPaint: paint.find(p => p.name === "first-contentful-paint")?.startTime || 0,
      largestContentfulPaint: lcp?.startTime || 0,
      cumulativeLayoutShift: 0.05, // Simulated CLS
      firstInputDelay: fid ? (fid as any).processingStart - fid.startTime : 0,
      memoryUsage,
      apiResponseTime,
      cacheHitRate
    }

    setMetrics(newMetrics)
    setLoading(false)
  }

  useEffect(() => {
    if (isVisible) {
      measurePerformance()
    }
  }, [isVisible])

  const getPerformanceGrade = (metric: keyof PerformanceMetrics, value: number): { grade: string; color: string; icon: React.ReactNode } => {
    switch (metric) {
      case "loadTime":
        if (value < 1000) return { grade: "Excellent", color: "text-green-600", icon: <CheckCircle className="w-4 h-4" /> }
        if (value < 3000) return { grade: "Bon", color: "text-blue-600", icon: <Activity className="w-4 h-4" /> }
        if (value < 5000) return { grade: "Moyen", color: "text-yellow-600", icon: <AlertTriangle className="w-4 h-4" /> }
        return { grade: "Mauvais", color: "text-red-600", icon: <AlertTriangle className="w-4 h-4" /> }
      
      case "firstContentfulPaint":
        if (value < 1000) return { grade: "Excellent", color: "text-green-600", icon: <CheckCircle className="w-4 h-4" /> }
        if (value < 2000) return { grade: "Bon", color: "text-blue-600", icon: <Activity className="w-4 h-4" /> }
        if (value < 3000) return { grade: "Moyen", color: "text-yellow-600", icon: <AlertTriangle className="w-4 h-4" /> }
        return { grade: "Mauvais", color: "text-red-600", icon: <AlertTriangle className="w-4 h-4" /> }
      
      case "apiResponseTime":
        if (value < 100) return { grade: "Excellent", color: "text-green-600", icon: <CheckCircle className="w-4 h-4" /> }
        if (value < 300) return { grade: "Bon", color: "text-blue-600", icon: <Activity className="w-4 h-4" /> }
        if (value < 500) return { grade: "Moyen", color: "text-yellow-600", icon: <AlertTriangle className="w-4 h-4" /> }
        return { grade: "Mauvais", color: "text-red-600", icon: <AlertTriangle className="w-4 h-4" /> }
      
      case "memoryUsage":
        if (value < 50) return { grade: "Excellent", color: "text-green-600", icon: <CheckCircle className="w-4 h-4" /> }
        if (value < 100) return { grade: "Bon", color: "text-blue-600", icon: <Activity className="w-4 h-4" /> }
        if (value < 200) return { grade: "Moyen", color: "text-yellow-600", icon: <AlertTriangle className="w-4 h-4" /> }
        return { grade: "Mauvais", color: "text-red-600", icon: <AlertTriangle className="w-4 h-4" /> }
      
      default:
        return { grade: "Inconnu", color: "text-gray-600", icon: <Activity className="w-4 h-4" /> }
    }
  }

  const formatValue = (metric: keyof PerformanceMetrics, value: number): string => {
    switch (metric) {
      case "loadTime":
      case "firstContentfulPaint":
      case "largestContentfulPaint":
        return `${value.toFixed(0)}ms`
      case "firstInputDelay":
        return `${value.toFixed(0)}ms`
      case "memoryUsage":
        return `${value.toFixed(1)}MB`
      case "apiResponseTime":
        return `${value.toFixed(0)}ms`
      case "cacheHitRate":
        return `${value.toFixed(1)}%`
      case "cumulativeLayoutShift":
        return value.toFixed(3)
      default:
        return value.toString()
    }
  }

  const metricConfigs = [
    {
      key: "loadTime" as keyof PerformanceMetrics,
      label: "Temps de chargement",
      icon: <Zap className="w-5 h-5" />,
      description: "Temps total pour charger la page"
    },
    {
      key: "firstContentfulPaint" as keyof PerformanceMetrics,
      label: "First Contentful Paint",
      icon: <Activity className="w-5 h-5" />,
      description: "Premier contenu affiché à l'écran"
    },
    {
      key: "largestContentfulPaint" as keyof PerformanceMetrics,
      label: "Largest Contentful Paint",
      icon: <Activity className="w-5 h-5" />,
      description: "Plus grand élément visible à l'écran"
    },
    {
      key: "apiResponseTime" as keyof PerformanceMetrics,
      label: "Temps de réponse API",
      icon: <Network className="w-5 h-5" />,
      description: "Temps moyen de réponse des API"
    },
    {
      key: "memoryUsage" as keyof PerformanceMetrics,
      label: "Utilisation mémoire",
      icon: <MemoryStick className="w-5 h-5" />,
      description: "Mémoire utilisée par l'application"
    },
    {
      key: "cacheHitRate" as keyof PerformanceMetrics,
      label: "Taux de cache",
      icon: <Database className="w-5 h-5" />,
      description: "Pourcentage de requêtes servies depuis le cache"
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Moniteur de performance</h2>
          <p className="text-muted-foreground">
            Surveillez les performances de votre application en temps réel
          </p>
        </div>
        <Button onClick={measurePerformance} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Mesure..." : "Actualiser"}
        </Button>
      </div>

      {metrics ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metricConfigs.map((config) => {
            const value = metrics[config.key]
            const grade = getPerformanceGrade(config.key, value)
            
            return (
              <Card key={config.key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {config.icon}
                    {config.label}
                  </CardTitle>
                  <Badge variant="outline" className={grade.color}>
                    {grade.icon}
                    {grade.grade}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatValue(config.key, value)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {config.description}
                  </p>
                  
                  {/* Progress bar for some metrics */}
                  {(config.key === "memoryUsage" || config.key === "cacheHitRate") && (
                    <div className="mt-3">
                      <Progress 
                        value={config.key === "memoryUsage" ? Math.min(value, 100) : value} 
                        className="h-2" 
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Cliquez sur "Actualiser" pour mesurer les performances
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Conseils d'optimisation</CardTitle>
          <CardDescription>
            Recommandations pour améliorer les performances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Utiliser le chargement différé</p>
                <p className="text-sm text-muted-foreground">
                  Chargez les images et composants uniquement lorsqu'ils sont visibles
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Optimiser les images</p>
                <p className="text-sm text-muted-foreground">
                  Compressez les images et utilisez des formats modernes comme WebP
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Mettre en cache les réponses API</p>
                <p className="text-sm text-muted-foreground">
                  Utilisez le cache pour éviter les requêtes répétées
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Utiliser la pagination</p>
                <p className="text-sm text-muted-foreground">
                  Chargez les données par pages pour améliorer les temps de réponse
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}