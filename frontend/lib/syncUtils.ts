// Utility for syncing localStorage with server data
export function syncLocalStorageWithServer<T>(
  localKey: string,
  serverData: T[],
  getId: (item: T) => string,
  onConflict?: (local: T[], server: T[]) => T[]
): T[] {
  try {
    const localData: T[] = JSON.parse(localStorage.getItem(localKey) || '[]')
    
    if (localData.length === 0) {
      // No local data, use server data
      localStorage.setItem(localKey, JSON.stringify(serverData))
      return serverData
    }
    
    if (onConflict) {
      const resolved = onConflict(localData, serverData)
      localStorage.setItem(localKey, JSON.stringify(resolved))
      return resolved
    }
    
    // Default: server data takes precedence
    localStorage.setItem(localKey, JSON.stringify(serverData))
    return serverData
  } catch {
    // If localStorage is unavailable, return server data
    return serverData
  }
}

export function clearUserLocalStorage(userId: string) {
  const keysToDelete = [
    `foodra_cart_${userId}`,
    `foodra_wishlist_${userId}`,
    `foodra_notifications_${userId}`
  ]
  
  keysToDelete.forEach(key => {
    try {
      localStorage.removeItem(key)
    } catch {
      // Ignore localStorage errors
    }
  })
}
