/**
 * Wishlist / Price Alert utilities
 * Stored in localStorage — no backend needed
 */

export interface WishlistItem {
  productId: string
  productName: string
  image: string
  priceAtAdd: number
  alertPrice: number | null
  addedAt: string
}

const KEY = "foodra_wishlist"

export function getWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") } catch { return [] }
}

export function addToWishlist(item: Omit<WishlistItem, "addedAt">): void {
  const list = getWishlist().filter((w) => w.productId !== item.productId)
  list.unshift({ ...item, addedAt: new Date().toISOString() })
  localStorage.setItem(KEY, JSON.stringify(list))
  window.dispatchEvent(new Event("wishlistchange"))
}

export function removeFromWishlist(productId: string): void {
  const list = getWishlist().filter((w) => w.productId !== productId)
  localStorage.setItem(KEY, JSON.stringify(list))
  window.dispatchEvent(new Event("wishlistchange"))
}

export function isInWishlist(productId: string): boolean {
  return getWishlist().some((w) => w.productId === productId)
}

export function setAlertPrice(productId: string, alertPrice: number | null): void {
  const list = getWishlist().map((w) =>
    w.productId === productId ? { ...w, alertPrice } : w
  )
  localStorage.setItem(KEY, JSON.stringify(list))
  window.dispatchEvent(new Event("wishlistchange"))
}

/** Check if any wishlist item has dropped to/below its alert price */
export function checkPriceAlerts(currentPrices: Record<string, number>): WishlistItem[] {
  return getWishlist().filter(
    (w) => w.alertPrice !== null && (currentPrices[w.productId] ?? Infinity) <= w.alertPrice
  )
}
