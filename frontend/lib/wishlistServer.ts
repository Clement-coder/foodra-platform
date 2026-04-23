import "server-only"

import { createNotification } from "./notify"
import { getSupabaseAdminClient } from "./supabaseAdmin"

export async function notifyWishlistPriceDrop({
  productId,
  productName,
  currentPrice,
}: {
  productId: string
  productName: string
  currentPrice: number
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
  }
}
