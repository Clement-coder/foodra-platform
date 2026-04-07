"use client"

import { useState } from "react"
import { AlertTriangle, X, ExternalLink } from "lucide-react"
import type { AdminData } from "@/app/admin/page"
import { useToast } from "@/lib/toast"

function DisputeModal({ dispute, order, privyId, onClose, onRefresh }: {
  dispute: any; order: any; privyId?: string; onClose: () => void; onRefresh: () => void
}) {
  const { toast, confirm } = useToast()
  const [saving, setSaving] = useState(false)

  const resolveEscrow = async (action: "release" | "refund") => {
    const ok = await confirm({
      title: "Resolve Dispute",
      message: action === "release" ? "Release payment to the farmer?" : "Refund payment to the buyer?",
      confirmLabel: action === "release" ? "Release to Farmer" : "Refund Buyer",
      danger: action === "refund",
    })
    if (!ok) return
    setSaving(true)

    // Update escrow status on the order
    const res = await fetch(`/api/orders/${dispute.order_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorPrivyId: privyId, escrow_status: action === "release" ? "released" : "refunded" }),
    })

    if (res.ok) {
      // Mark dispute as resolved in Supabase
      await fetch(`/api/orders/${dispute.order_id}/dispute`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disputeId: dispute.id, status: "resolved", actorPrivyId: privyId }),
      }).catch(() => {})
      toast.success(action === "release" ? "Escrow released to farmer" : "Escrow refunded to buyer")
      onRefresh()
      onClose()
    } else {
      toast.error("Failed to resolve dispute.")
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" />Dispute Details</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5 text-sm">
          {/* Dispute info */}
          <div className="space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-500 font-semibold mb-1">Reason</p>
              <p className="text-red-800 dark:text-red-300 font-medium">{dispute.reason}</p>
            </div>
            {dispute.details && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">Details</p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{dispute.details}</p>
              </div>
            )}
          </div>

          {/* Buyer */}
          {dispute.users && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-400 mb-2">Raised by</p>
              <p className="font-medium">{dispute.users.name || "—"}</p>
              <p className="text-xs text-gray-400">{dispute.users.email || "—"}</p>
            </div>
          )}

          {/* Order summary */}
          {order && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-1">
              <p className="text-xs text-gray-400 mb-1">Order</p>
              <p className="font-mono text-xs">#{order.id.slice(-6).toUpperCase()}</p>
              <p className="font-bold">₦{Number(order.total_amount).toLocaleString()}</p>
              <p className="text-xs text-gray-400">Escrow: <span className="font-medium text-red-600">{order.escrow_status}</span></p>
              {order.escrow_tx_hash && (
                <a href={`https://sepolia.basescan.org/tx/${order.escrow_tx_hash}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-green-600 underline flex items-center gap-1">
                  View on chain <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Resolve actions */}
          {dispute.status === "open" && (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 space-y-3">
              <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Resolve this dispute</p>
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
          {dispute.status !== "open" && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-xs text-green-700 dark:text-green-400 font-medium">
              ✓ Dispute resolved
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminDisputes({ data, privyId, onRefresh }: {
  data: AdminData; privyId?: string; onRefresh: () => void
}) {
  const [selected, setSelected] = useState<any | null>(null)
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open")

  const disputes = data.disputes || []
  const filtered = disputes.filter((d: any) => filter === "all" || d.status === filter)
  const getOrder = (orderId: string) => data.orders.find((o: any) => o.id === orderId)

  return (
    <>
      {selected && (
        <DisputeModal
          dispute={selected}
          order={getOrder(selected.order_id)}
          privyId={privyId}
          onClose={() => setSelected(null)}
          onRefresh={onRefresh}
        />
      )}

      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
        <div className="flex gap-1">
          {(["open", "resolved", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-colors ${filter === f ? "bg-red-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
              {f}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">{filtered.length} dispute{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center text-gray-400">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No {filter === "all" ? "" : filter} disputes</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {filtered.map((d: any) => {
            const order = getOrder(d.order_id)
            return (
              <div key={d.id} className="px-4 py-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className={`mt-0.5 p-2 rounded-lg flex-shrink-0 ${d.status === "open" ? "bg-red-100 dark:bg-red-900/30" : "bg-green-100 dark:bg-green-900/30"}`}>
                  <AlertTriangle className={`w-4 h-4 ${d.status === "open" ? "text-red-600" : "text-green-600"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{d.users?.name || "Unknown user"}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.status === "open" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{d.status}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{d.reason}</p>
                  {d.details && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{d.details}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {order && <span>Order #{order.id.slice(-6).toUpperCase()} · ₦{Number(order.total_amount).toLocaleString()}</span>}
                    <span>{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button onClick={() => setSelected(d)}
                  className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-700 hover:text-red-700 px-3 py-1.5 rounded-lg transition-colors font-medium flex-shrink-0">
                  {d.status === "open" ? "Resolve" : "View"}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
