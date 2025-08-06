"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface VirtualListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemHeight: number
  containerHeight: number
  onLoadMore?: () => void
  hasMore?: boolean
  loading?: boolean
  className?: string
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  onLoadMore,
  hasMore = false,
  loading = false,
  className = ""
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      setScrollTop(scrollTop)

      // Check if we should load more items
      if (
        onLoadMore &&
        hasMore &&
        !loading &&
        scrollHeight - scrollTop - clientHeight < itemHeight * 3
      ) {
        onLoadMore()
      }
    }
  }, [onLoadMore, hasMore, loading, itemHeight])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  )

  const offsetY = startIndex * itemHeight
  const visibleItems = items.slice(startIndex, endIndex)

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: items.length * itemHeight, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: offsetY,
            width: "100%",
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
      
      {loading && (
        <div className="flex justify-center p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      )}
      
      {hasMore && !loading && (
        <div className="flex justify-center p-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
          >
            Charger plus
          </Button>
        </div>
      )}
    </div>
  )
}

// Example usage component - to be replaced with real data
interface ExampleItem {
  id: string
  title: string
  description: string
  status: string
  priority: string
}

export function VirtualListExample() {
  const [items, setItems] = useState<ExampleItem[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const loadMoreItems = useCallback(() => {
    if (loading || !hasMore) return

    setLoading(true)
    
    // Load real data from API
    fetch(`/api/tasks?page=${page}&limit=20`)
      .then(response => response.json())
      .then(data => {
        setItems(prev => [...prev, ...data])
        setPage(prev => prev + 1)
        setLoading(false)
        
        // Check if there are more items
        if (data.length < 20) {
          setHasMore(false)
        }
      })
      .catch(error => {
        console.error("Failed to load items:", error)
        setLoading(false)
      })
  }, [loading, hasMore, page])

  useEffect(() => {
    // Load initial items
    fetch("/api/tasks?page=1&limit=20")
      .then(response => response.json())
      .then(data => {
        setItems(data)
        if (data.length < 20) {
          setHasMore(false)
        }
      })
      .catch(error => {
        console.error("Failed to load initial items:", error)
      })
  }, [])

  const renderItem = (item: ExampleItem, index: number) => (
    <Card key={item.id} className="m-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{item.title}</CardTitle>
          <div className="flex gap-2">
            <span className={`px-2 py-1 rounded text-xs ${
              item.status === "TODO" ? "bg-red-100 text-red-800" :
              item.status === "IN_PROGRESS" ? "bg-orange-100 text-orange-800" :
              "bg-green-100 text-green-800"
            }`}>
              {item.status}
            </span>
            <span className={`px-2 py-1 rounded text-xs ${
              item.priority === "HIGH" ? "bg-red-100 text-red-800" :
              item.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-800" :
              "bg-gray-100 text-gray-800"
            }`}>
              {item.priority}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>{item.description}</CardDescription>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Liste virtuelle avec chargement différé</h2>
        <div className="text-sm text-muted-foreground">
          {items.length} éléments chargés
        </div>
      </div>
      
      <VirtualList
        items={items}
        renderItem={renderItem}
        itemHeight={120}
        containerHeight={600}
        onLoadMore={loadMoreItems}
        hasMore={hasMore}
        loading={loading}
        className="border rounded-lg"
      />
    </div>
  )
}