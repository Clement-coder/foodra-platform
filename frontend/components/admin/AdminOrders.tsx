"use client"

import { useState } from "react"
import { X, MapPin, Phone, Calendar, ExternalLink, ShoppingBag } from "lucide-react"
import type { AdminData } from "@/app/admin/page"

function OrderModal({ order, buyer, onClose }: { order: any; buyer: any; onClose: () => void }) {
  const escrowColors: Record<string, string> = {
    locked: "bg-blue-100 text-blue-700",
    released: "bg-green-100 text-green-700",
    disputed: "bg-red-100 text-red-700",
    none: "bg-gray-100 text-gray-600",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Order Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* IDs & status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Order ID</span>
              <span className="font-mono text-xs text-gray-700 dark:text-gray-300 select-all">{order.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Status</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                order.status === "Delivered" ? "bg-green-100 text-green-700"
                : order.status === "Cancelled" ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
              }`}>{order.status}</span>
            </div>
            {order.escrow_status && order.escrow_status !== "none" && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Escrow</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${escrowColors[order.escrow_status] || escrowColors.none}`}>
                  {order.escrow_status}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Total</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">₦{Number(order.total_amount).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">{new Date(order.created_at).toLocaleString()}</span>
            </div>
          </div>

          {/* Escrow tx */}
          {order.escrow_tx_hash && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">Escrow Transaction</p>
              <a href={`https://sepolia.basescan.org/tx/${order.escrow_tx_hash}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-green-600 underline underline-offset-2 flex items-center gap-1 break-all">
                {order.escrow_tx_hash.slice(0, 14)}…{order.escrow_tx_hash.slice(-8)}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
          )}

          {/* Buyer */}
          {buyer && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">Buyer</p>
              <div className="flex items-center gap-3">
                {buyer.avatar_url ? (
                  <img src={buyer.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-green-500" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 font-bold text-sm">
                    {(buyer.name || "B")[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{buyer.name || "—"}</p>
                  <p className="text-xs text-gray-400">{buyer.email || "—"}</p>
                  <p className="text-xs text-gray-400">{buyer.phone || "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Delivery address */}
          {order.delivery_address && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-1">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2">
                <MapPin className="w-3.5 h-3.5" /> Delivery Address
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{order.delivery_full_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{order.delivery_address}, {order.delivery_city}, {order.delivery_state}</p>
              {order.delivery_phone && (
                <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{order.delivery_phone}</p>
              )}
            </div>
          )}

          {/* Items */}
          {order.order_items?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" /> Items ({order.order_items.length})
              </p>
              <div className="space-y-2">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.product_name}</p>
                      <p className="text-xs text-gray-400">{item.quantity} × ₦{Number(item.price).toLocaleString()}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">
                      ₦{(item.quantity * Number(item.price)).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminOrders({ data }: { data: AdminData }) {
  const [selected, setSelected] = useState<any | null>(null)

  const getBuyer = (buyerId: string) => data.users.find((u: any) => u.id === buyerId)

  return (
    <>
      {selected && <OrderModal order={selected} buyer={getBuyer(selected.buyer_id)} onClose={() => setSelected(null)} />}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left">Order ID</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Buyer</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">Escrow</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">Date</th>
              <th className="px-4 py-3 text-left">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.orders.map((o: any) => {
              const buyer = getBuyer(o.buyer_id)
              return (
                <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                    #{o.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      {buyer?.avatar_url ? (
                        <img src={buyer.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                          {(buyer?.name || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[100px]">{buyer?.name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">₦{Number(o.total_amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      o.status === "Delivered" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : o.status === "Cancelled" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {o.escrow_status && o.escrow_status !== "none" ? (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        o.escrow_status === "released" ? "bg-green-100 text-green-700"
                        : o.escrow_status === "disputed" ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                      }`}>{o.escrow_status}</span>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(o)}
                      className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 px-3 py-1.5 rounded-lg transition-colors font-medium">
                      View
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
