"use client"

import { useState } from "react"
import { Download, Settings } from "lucide-react"
import type { AdminData } from "@/app/admin/page"
import { useToast } from "@/lib/toast"

const PAGE_SIZE = 20

// Suspicious: large amount (>500k NGN) or multiple pending from same user
function isSuspicious(r: any, all: any[]): boolean {
  if (Number(r.ngn_amount) > 500_000) return true
  const userPending = all.filter(x => x.user_id === r.user_id && x.status === "Pending")
  if (userPending.length > 2) return true
  return false
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Pending: "bg-yellow-100 text-yellow-700",
    Confirmed: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
    Expired: "bg-gray-100 text-gray-500",
  }
  return `text-xs px-2 py-1 rounded-full font-medium ${map[status] ?? "bg-gray-100 text-gray-500"}`
}

function RateSettingsPanel({ privyId, onSaved }: { privyId?: string; onSaved: () => void }) {
  const { toast } = useToast()
  const [base, setBase] = useState("")
  const [spread, setSpread] = useState("")
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!base || !spread) return
    setSaving(true)
    const res = await fetch("/api/admin/rate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorPrivyId: privyId, base_ngn_per_usdc: Number(base), spread_percent: Number(spread) }),
    })
    setSaving(false)
    if (res.ok) { toast.success("Rate updated"); onSaved() }
    else toast.error("Failed to update rate")
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
        <Settings className="w-4 h-4" /> Exchange Rate Settings
      </p>
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Base rate (₦ per 1 USDC)</label>
          <input type="number" value={base} onChange={e => setBase(e.target.value)} placeholder="e.g. 1600"
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-36 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Spread / margin (%)</label>
          <input type="number" value={spread} onChange={e => setSpread(e.target.value)} placeholder="e.g. 2.5"
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-28 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {base && spread && (
          <p className="text-xs text-gray-500 self-end pb-2">
            Effective: ₦{(Number(base) * (1 + Number(spread) / 100)).toFixed(2)} / USDC
          </p>
        )}
        <button onClick={save} disabled={saving || !base || !spread}
          className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors">
          {saving ? "Saving…" : "Save Rate"}
        </button>
      </div>
    </div>
  )
}

function exportCSV(rows: any[]) {
  const headers = ["Reference", "User", "Email", "NGN Amount", "USDC Amount", "Rate", "Spread %", "Status", "Expires At", "Created At"]
  const data = rows.map(r => [
    r.reference, r.users?.name ?? r.user_id, r.users?.email ?? "",
    r.ngn_amount, r.usdc_amount, r.rate_ngn_per_usdc, r.spread_percent,
    r.status, r.expires_at, r.created_at,
  ])
  const csv = [headers, ...data].map(row => row.map((v: any) => `"${v ?? ""}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = "wallet-requests.csv"; a.click()
  URL.revokeObjectURL(url)
}

export default function AdminWalletRequests({ data, privyId, onRefresh }: {
  data: AdminData; privyId?: string; onRefresh: () => void
}) {
  const { toast, confirm } = useToast()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [page, setPage] = useState(0)
  const [rejectOpen, setRejectOpen] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({})
  const [showRatePanel, setShowRatePanel] = useState(false)

  const requests: any[] = data.walletRequests || []

  const filtered = requests.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q
      || (r.reference || "").toLowerCase().includes(q)
      || (r.users?.name || "").toLowerCase().includes(q)
      || (r.users?.email || "").toLowerCase().includes(q)
    const matchStatus = statusFilter === "All" || r.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const confirm_ = async (id: string) => {
    const ok = await confirm({ message: "Confirm this bank transfer and credit USDC to user?", confirmLabel: "Confirm" })
    if (!ok) return
    const res = await fetch("/api/wallet/fund-request", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id, status: "Confirmed", actorPrivyId: privyId }),
    })
    if (res.ok) { toast.success("Request confirmed"); onRefresh() }
    else toast.error("Failed to confirm request")
  }

  const reject = async (id: string) => {
    const res = await fetch("/api/wallet/fund-request", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id, status: "Rejected", actorPrivyId: privyId, adminNote: rejectNote[id] || "" }),
    })
    if (res.ok) { toast.success("Request rejected"); setRejectOpen(null); onRefresh() }
    else toast.error("Failed to reject request")
  }

  const expire = async (id: string) => {
    const ok = await confirm({ message: "Mark this request as expired?", confirmLabel: "Expire" })
    if (!ok) return
    const res = await fetch("/api/wallet/fund-request", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id, status: "Expired", actorPrivyId: privyId }),
    })
    if (res.ok) { toast.success("Request expired"); onRefresh() }
    else toast.error("Failed to expire request")
  }

  const pendingCount = requests.filter(r => r.status === "Pending").length

  return (
    <>
      {/* Rate settings panel */}
      <div className="px-4 pt-4">
        <button onClick={() => setShowRatePanel(v => !v)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium mb-3">
          <Settings className="w-4 h-4" />
          {showRatePanel ? "Hide" : "Configure"} Exchange Rate
        </button>
        {showRatePanel && <RateSettingsPanel privyId={privyId} onSaved={() => { setShowRatePanel(false); onRefresh() }} />}
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search by reference, user name or email…"
          className="flex-1 min-w-[200px] text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500" />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Rejected">Rejected</option>
          <option value="Expired">Expired</option>
        </select>
        <button onClick={() => exportCSV(filtered)}
          className="flex items-center gap-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl transition-colors">
          <Download className="w-4 h-4" /> Export
        </button>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {filtered.length} requests · {pendingCount} pending
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left">Reference</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">User</th>
              <th className="px-4 py-3 text-left">NGN</th>
              <th className="px-4 py-3 text-left">USDC</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Rate</th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">Expires</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paged.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No requests found</td></tr>
            )}
            {paged.map((r: any) => {
              const suspicious = isSuspicious(r, requests)
              const isExpiredNow = r.status === "Pending" && new Date(r.expires_at) < new Date()
              return (
                <>
                  <tr key={r.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${suspicious ? "bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-400" : ""}`}>
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-[#118C4C]">{r.reference}</span>
                      {suspicious && <span className="ml-2 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">⚠ Review</span>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="font-medium">{r.users?.name ?? "—"}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[140px]">{r.users?.email ?? ""}</div>
                    </td>
                    <td className="px-4 py-3 font-medium">₦{Number(r.ngn_amount).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-blue-600">{Number(r.usdc_amount).toFixed(4)}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell text-xs">
                      ₦{Number(r.rate_ngn_per_usdc).toFixed(2)}<br />
                      <span className="text-gray-400">{r.spread_percent}% spread</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">
                      {isExpiredNow
                        ? <span className="text-red-500 font-medium">Expired</span>
                        : new Date(r.expires_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                      <div className="text-gray-400">{new Date(r.expires_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(r.status)}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {r.status === "Pending" && (
                          <>
                            <button onClick={() => confirm_(r.id)}
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700">
                              Confirm
                            </button>
                            <button onClick={() => setRejectOpen(rejectOpen === r.id ? null : r.id)}
                              className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600">
                              Reject
                            </button>
                            {isExpiredNow && (
                              <button onClick={() => expire(r.id)}
                                className="text-xs bg-gray-400 text-white px-2 py-1 rounded-lg hover:bg-gray-500">
                                Expire
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {rejectOpen === r.id && (
                    <tr key={`${r.id}-reject`}>
                      <td colSpan={8} className="px-4 pb-3">
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 space-y-2">
                          <p className="text-xs font-semibold text-red-600">Rejection reason (optional)</p>
                          <textarea
                            value={rejectNote[r.id] || ""}
                            onChange={e => setRejectNote(prev => ({ ...prev, [r.id]: e.target.value }))}
                            placeholder="Enter reason…"
                            rows={2}
                            className="w-full text-sm bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => reject(r.id)} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">Confirm Reject</button>
                            <button onClick={() => setRejectOpen(null)} className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-300">Cancel</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700">Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700">Next</button>
          </div>
        </div>
      )}
    </>
  )
}
