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
    .select("user_id, alert_price")
    .eq("product_id", productId)
    .not("alert_price", "is", null)
    .gte("alert_price", currentPrice)

  if (error || !matches?.length) return

  for (const match of matches) {
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
  }
}
