"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import type { AdminData } from "@/app/admin/page"
import { CustomSelect } from "@/components/CustomSelect"

const PAGE_SIZE = 20

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    completed:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    failed:     "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    rejected:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }
  return `text-xs px-2 py-1 rounded-full font-medium capitalize ${map[status] ?? "bg-muted text-muted-foreground"}`
}

function exportCSV(rows: any[]) {
  const headers = ["User", "Email", "Amount (NGN)", "Bank", "Account Number", "Account Name", "Status", "Transfer Code", "Created At"]
  const data = rows.map(r => [
    r.users?.name ?? r.user_id,
    r.users?.email ?? "",
    r.amount_ngn,
    r.bank_name,
    r.account_number,
    r.account_name,
    r.status,
    r.paystack_transfer_code ?? "",
    r.created_at,
  ])
  const csv = [headers, ...data].map(row => row.map((v: any) => `"${v ?? ""}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = "withdrawals.csv"; a.click()
  URL.revokeObjectURL(url)
}

export default function AdminWalletRequests({ data, onRefresh }: {
  data: AdminData; privyId?: string; onRefresh: () => void
}) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [page, setPage] = useState(0)

  const withdrawals: any[] = data.walletRequests || []

  const filtered = withdrawals.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q
      || (r.users?.name || "").toLowerCase().includes(q)
      || (r.users?.email || "").toLowerCase().includes(q)
      || (r.bank_name || "").toLowerCase().includes(q)
      || (r.account_number || "").includes(q)
    const matchStatus = statusFilter === "All" || r.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const totalNgn = filtered.reduce((s: number, r: any) => s + Number(r.amount_ngn), 0)

  return (
    <>
      {/* Summary */}
      <div className="px-4 pt-4 pb-2 flex flex-wrap gap-4">
        <div className="rounded-xl bg-muted/50 border border-border px-4 py-2 text-sm">
          <span className="text-muted-foreground">Total Withdrawals: </span>
          <span className="font-bold">₦{totalNgn.toLocaleString()}</span>
        </div>
        <div className="rounded-xl bg-muted/50 border border-border px-4 py-2 text-sm">
          <span className="text-muted-foreground">Processing: </span>
          <span className="font-bold text-blue-600">{withdrawals.filter(r => r.status === "processing").length}</span>
        </div>
        <div className="rounded-xl bg-muted/50 border border-border px-4 py-2 text-sm">
          <span className="text-muted-foreground">Failed: </span>
          <span className="font-bold text-red-500">{withdrawals.filter(r => r.status === "failed").length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search by user, bank or account number…"
          className="flex-1 min-w-[200px] text-sm border border-border rounded-xl px-3 py-2 bg-card focus:outline-none focus:ring-2 focus:ring-green-500" />
        <CustomSelect
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(0) }}
          options={["All", "pending", "processing", "completed", "failed", "rejected"].map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
          className="w-36"
        />
        <button onClick={() => exportCSV(filtered)}
          className="flex items-center gap-1.5 text-sm bg-card hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground px-3 py-2 rounded-xl transition-colors">
          <Download className="w-4 h-4" /> Export
        </button>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} withdrawals</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-card text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left hidden sm:table-cell">User</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Bank Details</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Transfer Code</th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">Date</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paged.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No withdrawals found</td></tr>
            )}
            {paged.map((r: any) => (
              <tr key={r.id} className="hover:bg-muted dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 hidden sm:table-cell">
                  <div className="font-medium">{r.users?.name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[140px]">{r.users?.email ?? ""}</div>
                </td>
                <td className="px-4 py-3 font-bold text-[#118C4C]">₦{Number(r.amount_ngn).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{r.account_name}</div>
                  <div className="text-xs text-muted-foreground">{r.bank_name} · {r.account_number}</div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="font-mono text-xs text-muted-foreground">{r.paystack_transfer_code ?? "—"}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3">
                  <span className={statusBadge(r.status)}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
              className="px-3 py-1.5 rounded-lg bg-card disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700">Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg bg-card disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700">Next</button>
          </div>
        </div>
      )}
    </>
  )
}
