"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface LazyLoadProps {
  children: React.ReactNode
  placeholder?: React.ReactNode
  offset?: number
  className?: string
}

export function LazyLoad({
  children,
  placeholder,
  offset = 100,
  className = ""
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: `${offset}px`
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [offset])

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : placeholder || <div className="h-32 bg-muted animate-pulse rounded" />}
    </div>
  )
}

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
}

export function LazyImage({
  src,
  alt,
  className = "",
  placeholder,
  onLoad,
  onError
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src)
          observer.disconnect()
        }
      },
      {
        rootMargin: "50px"
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [src])

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          {placeholder ? (
            <img src={placeholder} alt="" className="w-full h-full object-cover opacity-50" />
          ) : (
            <div className="text-muted-foreground">Chargement...</div>
          )}
        </div>
      )}
      
      {hasError ? (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Erreur de chargement</div>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={imageSrc || ""}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  )
}

// Hook for lazy loading data
export function useLazyData<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const loadData = useCallback(async () => {
    if (loaded) return

    setLoading(true)
    setError(null)

    try {
      const result = await fetchFunction()
      setData(result)
      setLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [fetchFunction, loaded])

  useEffect(() => {
    loadData()
  }, dependencies)

  return { data, loading, error, loaded, refetch: loadData }
}

// Example usage component
export function LazyLoadExample() {
  const realDataFetch = async () => {
    // Fetch real data from API
    const response = await fetch("/api/stats")
    if (!response.ok) {
      throw new Error("Failed to fetch data")
    }
    return await response.json()
  }

  const { data, loading, error } = useLazyData(realDataFetch)

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Exemple de chargement différé</h2>
        <p className="text-muted-foreground">
          Faites défiler vers le bas pour voir le contenu se charger
        </p>
      </div>

      {/* Spacer to demonstrate lazy loading */}
      <div className="space-y-4">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground">Contenu de remplissage {i + 1}</span>
          </div>
        ))}
      </div>

      {/* Lazy loaded content */}
      <LazyLoad
        placeholder={
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Chargement du contenu...</p>
            </div>
          </div>
        }
      >
        <Card className="h-64">
          <CardHeader>
            <CardTitle>
              {loading ? "Chargement..." : "Statistiques de l'application"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-red-500">Erreur: {error}</p>
            ) : loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="space-y-2">
                <p>Statistiques chargées dynamiquement depuis l'API</p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{data?.totalTasks || 0}</div>
                    <div className="text-sm text-muted-foreground">Tâches totales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{data?.completedTasks || 0}</div>
                    <div className="text-sm text-muted-foreground">Tâches terminées</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Chargé à: {new Date().toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </LazyLoad>

      {/* Lazy image example */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Exemple d'image chargée paresseusement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LazyImage
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
            alt="Mountain landscape"
            className="h-64 rounded-lg"
            placeholder="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop&blur=2"
          />
          <LazyImage
            src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop"
            alt="Ocean view"
            className="h-64 rounded-lg"
            placeholder="https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=100&h=100&fit=crop&blur=2"
          />
        </div>
      </div>
    </div>
  )
}