import "server-only"

import { createNotification } from "./notify"
import { getSupabaseAdminClient } from "./supabaseAdmin"
import { sendPriceAlertEmail } from "./email"

export async function notifyWishlistPriceDrop({
  productId,
  productName,
  currentPrice,
  previousPrice,
}: {
  productId: string
  productName: string
  currentPrice: number
  previousPrice?: number
}) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return

  const { data: matches, error } = await supabase
    .from("wishlists")
    .select("user_id, alert_price, last_alert_sent")
    .eq("product_id", productId)
    .not("alert_price", "is", null)
    .gte("alert_price", currentPrice)

  if (error || !matches?.length) return

  const now = new Date()
  const cooldownHours = 24

  for (const match of matches) {
    // Check cooldown - only send if no alert sent in last 24 hours
    const lastAlert = match.last_alert_sent ? new Date(match.last_alert_sent) : null
    const hoursSinceLastAlert = lastAlert ? (now.getTime() - lastAlert.getTime()) / (1000 * 60 * 60) : Infinity
    
    if (hoursSinceLastAlert < cooldownHours) continue

    await createNotification({
      userId: match.user_id,
      type: "system",
      title: "Wishlist Price Alert",
      message: `${productName} has dropped to ₦${Number(currentPrice).toLocaleString()}, which meets your alert price.`,
      link: `/marketplace/${productId}`,
    })
    
    // Email the user
    const { data: user } = await supabase.from("users").select("email, name").eq("id", match.user_id).single()
    if (user?.email && previousPrice) {
      sendPriceAlertEmail(user.email, user.name || "Farmer", productName, previousPrice, currentPrice, productId).catch(() => {})
    }
    
    // Update last alert sent timestamp
    await supabase
      .from('wishlists')
      .update({ last_alert_sent: now.toISOString() })
      .eq('product_id', productId)
      .eq('user_id', match.user_id)
  }
}
