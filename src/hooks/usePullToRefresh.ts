import { useEffect, useRef, useState } from 'react'

const THRESHOLD = 72   // px of pull needed to trigger refresh
const MAX_PULL   = 96  // max visual pull distance

export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ distance: 0, refreshing: false })

  // Keep stable refs so the effect doesn't need to re-register on every render
  const startYRef     = useRef(0)
  const pullingRef    = useRef(false)
  const distanceRef   = useRef(0)
  const refreshingRef = useRef(false)
  const onRefreshRef  = useRef(onRefresh)
  useEffect(() => { onRefreshRef.current = onRefresh }, [onRefresh])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function onTouchStart(e: TouchEvent) {
      if (el!.scrollTop <= 0) {
        startYRef.current = e.touches[0].clientY
        pullingRef.current = false
        distanceRef.current = 0
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (refreshingRef.current || el!.scrollTop > 0) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta > 0) {
        pullingRef.current = true
        e.preventDefault()
        distanceRef.current = Math.min(delta * 0.55, MAX_PULL)
        setIndicator({ distance: distanceRef.current, refreshing: false })
      }
    }

    async function onTouchEnd() {
      if (!pullingRef.current) return
      pullingRef.current = false
      if (distanceRef.current >= THRESHOLD) {
        refreshingRef.current = true
        setIndicator({ distance: 48, refreshing: true })
        try { await onRefreshRef.current() } finally {
          refreshingRef.current = false
          distanceRef.current = 0
          setIndicator({ distance: 0, refreshing: false })
        }
      } else {
        distanceRef.current = 0
        setIndicator({ distance: 0, refreshing: false })
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove',  onTouchMove,  { passive: false })
    el.addEventListener('touchend',   onTouchEnd,   { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove',  onTouchMove)
      el.removeEventListener('touchend',   onTouchEnd)
    }
  }, []) // empty — all mutable state via refs

  return { scrollRef, distance: indicator.distance, refreshing: indicator.refreshing }
}
