import { useEffect } from "react"

/**
 * Locks the page scroll when `active` is true.
 * Restores scroll position on unlock (prevents iOS snap-to-top).
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) {
      document.body.style.overflow = ""
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.width = ""
      return
    }
    const scrollY = window.scrollY
    document.body.style.overflow  = "hidden"
    document.body.style.position  = "fixed"
    document.body.style.top       = `-${scrollY}px`
    document.body.style.width     = "100%"
    return () => {
      document.body.style.overflow  = ""
      document.body.style.position  = ""
      document.body.style.top       = ""
      document.body.style.width     = ""
      window.scrollTo(0, scrollY)
    }
  }, [active])
}
