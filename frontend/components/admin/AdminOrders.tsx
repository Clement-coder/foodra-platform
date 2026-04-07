"use client"

import { useState } from "react"
import { X, MapPin, Phone, Calendar, ExternalLink, ShoppingBag, Download } from "lucide-react"
import type { AdminData } from "@/app/admin/page"
import { useToast } from "@/lib/toast"
import { CustomSelect } from "@/components/CustomSelect"

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]

function OrderModal({ order, buyer, privyId, onClose, onRefresh }: {
  order: any; buyer: any; privyId?: string
  onClose: () => void; onRefresh: () => void
}) {
  const { toast, confirm } = useToast()
  const [status, setStatus] = useState(order.status)
  const [saving, setSaving] = useState(false)

  const saveStatus = async () => {
    if (status === order.status) return
    const ok = await confirm({ message: `Change order status to "${status}"?`, confirmLabel: "Update Status" })
    if (!ok) return
    setSaving(true)
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorPrivyId: privyId, status }),
    })
    if (res.ok) { toast.success(`Order status updated to ${status}`); onRefresh(); onClose() }
    else toast.error("Failed to update order status.")
    setSaving(false)
  }

  const resolveEscrow = async (action: "release" | "refund") => {
    const ok = await confirm({ title: "Resolve Escrow", message: action === "release" ? "Release payment to the farmer?" : "Refund payment to the buyer?", confirmLabel: action === "release" ? "Release to Farmer" : "Refund Buyer", danger: action === "refund" })
    if (!ok) return
    setSaving(true)
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorPrivyId: privyId, escrow_status: action === "release" ? "released" : "refunded" }),
    })
    if (res.ok) { toast.success(action === "release" ? "Escrow released to farmer" : "Escrow refunded to buyer"); onRefresh(); onClose() }
    else toast.error("Failed to resolve escrow.")
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold">Order Details</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* IDs */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Order ID</span><span className="font-mono text-xs select-all">{order.id}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total</span>
              <span className="font-bold text-lg">₦{Number(order.total_amount).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 justify-between">
              <span className="text-gray-400">Date</span>
              <span className="flex items-center gap-1 text-xs text-gray-500"><Calendar className="w-3 h-3" />{new Date(order.created_at).toLocaleString()}</span>
            </div>
          </div>

          {/* Status update */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-gray-500">Update Order Status</p>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${status === s ? "bg-green-600 text-white" : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-green-500"}`}>
                  {s}
                </button>
              ))}
            </div>
            <button onClick={saveStatus} disabled={saving || status === order.status}
              className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors">
              Save Status
            </button>
          </div>

          {/* Escrow dispute resolution */}
          {order.escrow_status === "disputed" && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl space-y-3 border border-red-200 dark:border-red-800">
              <p className="text-xs font-semibold text-red-600">⚠️ Disputed Escrow — Resolve</p>
              <div className="flex gap-2">
                <button onClick={() => resolveEscrow("release")} disabled={saving}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium disabled:opacity-40">
                  Release to Farmer
                </button>
                <button onClick={() => resolveEscrow("refund")} disabled={saving}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium disabled:opacity-40">
                  Refund Buyer
                </button>
              </div>
            </div>
          )}

          {/* Escrow tx */}
          {order.escrow_tx_hash && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">Escrow Tx</p>
              <a href={`https://sepolia.basescan.org/tx/${order.escrow_tx_hash}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-green-600 underline flex items-center gap-1 break-all">
                {order.escrow_tx_hash.slice(0, 14)}…{order.escrow_tx_hash.slice(-8)}<ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
          )}

          {/* Buyer */}
          {buyer && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">Buyer</p>
              <div className="flex items-center gap-3">
                {buyer.avatar_url
                  ? <img src={buyer.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-green-500" />
                  : <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">{(buyer.name || "B")[0].toUpperCase()}</div>
                }
                <div>
                  <p className="text-sm font-medium">{buyer.name || "—"}</p>
                  <p className="text-xs text-gray-400">{buyer.email || "—"}</p>
                  <p className="text-xs text-gray-400">{buyer.phone || "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Delivery */}
          {order.delivery_address && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-1">
              <p className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-2"><MapPin className="w-3.5 h-3.5" />Delivery Address</p>
              <p className="text-sm font-medium">{order.delivery_full_name}</p>
              <p className="text-xs text-gray-500">{order.delivery_address}, {order.delivery_city}, {order.delivery_state}</p>
              {order.delivery_phone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{order.delivery_phone}</p>}
            </div>
          )}

          {/* Items */}
          {order.order_items?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" />Items ({order.order_items.length})</p>
              <div className="space-y-2">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                    {item.image_url ? <img src={item.image_url} alt={item.product_name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      : <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product_name}</p>
                      <p className="text-xs text-gray-400">{item.quantity} × ₦{Number(item.price).toLocaleString()}</p>
                    </div>
                    <p className="text-sm font-semibold flex-shrink-0">₦{(item.quantity * Number(item.price)).toLocaleString()}</p>
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

function exportCSV(orders: any[], users: any[]) {
  const getUser = (id: string) => users.find((u: any) => u.id === id)
  const headers = ["Order ID", "Buyer", "Amount (₦)", "Status", "Escrow", "Date"]
  const rows = orders.map(o => {
    const buyer = getUser(o.buyer_id)
    return [o.id, buyer?.name || "—", o.total_amount, o.status, o.escrow_status || "—", new Date(o.created_at).toLocaleDateString()]
  })
  const csv = [headers, ...rows].map(r => r.map((v: any) => `"${v ?? ""}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = "orders.csv"; a.click()
  URL.revokeObjectURL(url)
}

const PAGE_SIZE = 20

export default function AdminOrders({ data, privyId, onRefresh, onNotify }: {
  data: AdminData; privyId?: string; onRefresh: () => void; onNotify: (m: string) => void
}) {
  const [selected, setSelected] = useState<any | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [page, setPage] = useState(0)
  const getBuyer = (id: string) => data.users.find((u: any) => u.id === id)

  const filtered = data.orders.filter((o: any) => {
    const buyer = getBuyer(o.buyer_id)
    const q = search.toLowerCase()
    const matchSearch = !q || o.id.toLowerCase().includes(q) || (buyer?.name || "").toLowerCase().includes(q)
    const matchStatus = statusFilter === "All" || o.status === statusFilter
    return matchSearch && matchStatus
  })
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <>
      {selected && <OrderModal order={selected} buyer={getBuyer(selected.buyer_id)} privyId={privyId} onClose={() => setSelected(null)} onRefresh={onRefresh} />}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search by order ID or buyer name…"
          className="flex-1 min-w-[180px] text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500" />
        <CustomSelect
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(0) }}
          options={["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map(s => ({ value: s, label: s }))}
          className="w-40"
        />
        <button onClick={() => exportCSV(filtered, data.users)}
          className="flex items-center gap-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl transition-colors">
          <Download className="w-4 h-4" />Export
        </button>
        <span className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} orders</span>
      </div>
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
            {paged.map((o: any) => {
              const buyer = getBuyer(o.buyer_id)
              return (
                <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">#{o.id.slice(-6).toUpperCase()}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      {buyer?.avatar_url ? <img src={buyer.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                        : <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">{(buyer?.name || "?")[0].toUpperCase()}</div>}
                      <span className="text-xs truncate max-w-[100px]">{buyer?.name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">₦{Number(o.total_amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      o.status === "Delivered" ? "bg-green-100 text-green-700"
                      : o.status === "Cancelled" ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"}`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {o.escrow_status && o.escrow_status !== "none"
                      ? <span className={`text-xs px-2 py-1 rounded-full font-medium ${o.escrow_status === "released" ? "bg-green-100 text-green-700" : o.escrow_status === "disputed" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{o.escrow_status}</span>
                      : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(o)} className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-700 hover:text-green-700 px-3 py-1.5 rounded-lg transition-colors font-medium">View</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700">Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700">Next</button>
          </div>
        </div>
      )}
    </>
  )
}
