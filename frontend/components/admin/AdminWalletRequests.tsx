"use client"

import { useState } from "react"
import { Download, Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, Banknote, RefreshCcw, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react"
import type { AdminData } from "@/app/admin/page"
import { CustomSelect } from "@/components/CustomSelect"

const PAGE_SIZE = 20

// ── helpers ────────────────────────────────────────────────────────────────────
function sum(arr: any[], key: string) {
  return arr.reduce((s: number, r: any) => s + Number(r[key] ?? 0), 0)
}
const NGN = (v: number) =>
  `₦${v.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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

const CATEGORY_LABELS: Record<string, string> = {
  fund:     "Funded",
  send:     "Sent",
  receive:  "Received",
  withdraw: "Withdrawal",
  purchase: "Purchase",
  refund:   "Refund",
}
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  fund:     <CreditCard className="w-3 h-3" />,
  send:     <ArrowUpRight className="w-3 h-3" />,
  receive:  <ArrowDownLeft className="w-3 h-3" />,
  withdraw: <Banknote className="w-3 h-3" />,
  purchase: <ShoppingBag className="w-3 h-3" />,
  refund:   <RefreshCcw className="w-3 h-3" />,
}

function exportWithdrawalsCSV(rows: any[]) {
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

function exportWalletsCSV(rows: any[], userMap: Record<string, any>) {
  const headers = ["Name", "Email", "Foodra Tag", "Balance (NGN)", "Total Funded", "Total Spent", "Total Withdrawn", "Total Sent", "Total Received"]
  const data = rows.map(r => {
    const u = userMap[r.user_id] || {}
    return [u.name ?? "", u.email ?? "", r.foodra_tag ?? "", Number(r.balance_ngn), r._funded, r._spent, r._withdrawn, r._sent, r._received]
  })
  const csv = [headers, ...data].map(row => row.map((v: any) => `"${v ?? ""}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = "wallets.csv"; a.click()
  URL.revokeObjectURL(url)
}

// ── Sub-tab type ───────────────────────────────────────────────────────────────
type WalletSubTab = "overview" | "treasury" | "withdrawals" | "users"

export default function AdminWalletRequests({ data, onRefresh }: {
  data: AdminData; privyId?: string; onRefresh: () => void
}) {
  const [subTab, setSubTab] = useState<WalletSubTab>("overview")

  // withdrawals state
  const [wdSearch, setWdSearch] = useState("")
  const [wdStatus, setWdStatus] = useState("All")
  const [wdPage, setWdPage] = useState(0)

  // per-user state
  const [uSearch, setUSearch] = useState("")
  const [uPage, setUPage] = useState(0)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  // ── raw data ─────────────────────────────────────────────────────────────
  const withdrawals: any[]   = data.walletRequests || []
  const accounts: any[]      = data.walletAccounts || []
  const txAll: any[]         = data.walletTransactions || []
  const users: any[]         = data.users || []
  const payments: any[]      = data.paystackPayments || []

  // ── user map ──────────────────────────────────────────────────────────────
  const userMap: Record<string, any> = {}
  for (const u of users) userMap[u.id] = u

  // ── platform-level sums ───────────────────────────────────────────────────
  const totalUserBalances  = sum(accounts, "balance_ngn")
  const successPayments    = payments.filter(p => p.status === "success")
  const totalInflow        = sum(successPayments, "amount_ngn")
  const totalWdCompleted   = sum(withdrawals.filter(w => w.status === "completed"), "amount_ngn")
  const totalWdPending     = sum(withdrawals.filter(w => ["pending","processing"].includes(w.status)), "amount_ngn")
  const totalPurchased     = sum(txAll.filter(t => t.category === "purchase"), "amount_ngn")
  const totalFunded        = sum(txAll.filter(t => t.category === "fund"), "amount_ngn")

  // ── enrich accounts with per-user tx sums ─────────────────────────────────
  const txByUser: Record<string, any[]> = {}
  for (const tx of txAll) {
    if (!txByUser[tx.user_id]) txByUser[tx.user_id] = []
    txByUser[tx.user_id].push(tx)
  }

  const enrichedAccounts = accounts.map(a => {
    const utx = txByUser[a.user_id] || []
    return {
      ...a,
      _funded:    sum(utx.filter((t: any) => t.category === "fund"),     "amount_ngn"),
      _received:  sum(utx.filter((t: any) => t.category === "receive"),  "amount_ngn"),
      _spent:     sum(utx.filter((t: any) => t.category === "purchase"), "amount_ngn"),
      _sent:      sum(utx.filter((t: any) => t.category === "send"),     "amount_ngn"),
      _withdrawn: sum(utx.filter((t: any) => t.category === "withdraw"), "amount_ngn"),
      _refunded:  sum(utx.filter((t: any) => t.category === "refund"),   "amount_ngn"),
      _txList:    utx.slice(0, 30),
    }
  }).sort((a, b) => Number(b.balance_ngn) - Number(a.balance_ngn))

  // ── filtered withdrawals ──────────────────────────────────────────────────
  const filteredWd = withdrawals.filter(r => {
    const q = wdSearch.toLowerCase()
    const matchSearch = !q
      || (r.users?.name || "").toLowerCase().includes(q)
      || (r.users?.email || "").toLowerCase().includes(q)
      || (r.bank_name || "").toLowerCase().includes(q)
      || (r.account_number || "").includes(q)
    const matchStatus = wdStatus === "All" || r.status === wdStatus
    return matchSearch && matchStatus
  })
  const wdPages  = Math.ceil(filteredWd.length / PAGE_SIZE)
  const wdPaged  = filteredWd.slice(wdPage * PAGE_SIZE, (wdPage + 1) * PAGE_SIZE)

  // ── filtered users ────────────────────────────────────────────────────────
  const filteredAccounts = enrichedAccounts.filter(a => {
    const u = userMap[a.user_id]
    const q = uSearch.toLowerCase()
    return !q
      || (u?.name || "").toLowerCase().includes(q)
      || (u?.email || "").toLowerCase().includes(q)
      || (a.foodra_tag || "").toLowerCase().includes(q)
  })
  const uPages = Math.ceil(filteredAccounts.length / PAGE_SIZE)
  const uPaged = filteredAccounts.slice(uPage * PAGE_SIZE, (uPage + 1) * PAGE_SIZE)

  // ── sub-tab pills ─────────────────────────────────────────────────────────
  const subTabs: { key: WalletSubTab; label: string }[] = [
    { key: "overview",    label: "📊 Overview" },
    { key: "treasury",    label: "🏦 Treasury" },
    { key: "withdrawals", label: `💸 Withdrawals (${withdrawals.length})` },
    { key: "users",       label: `👥 Per-User (${accounts.length})` },
  ]

  return (
    <div className="p-4 space-y-4">

      {/* Sub-tab bar */}
      <div className="flex gap-2 flex-wrap">
        {subTabs.map(({ key, label }) => (
          <button key={key} onClick={() => setSubTab(key)}
            className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors ${
              subTab === key
                ? "bg-[#118C4C] text-white shadow"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}>{label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
      {subTab === "overview" && (
        <div className="space-y-4">
          {/* KPI grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { label: "Total User Balances",    value: NGN(totalUserBalances),   icon: <Wallet className="w-4 h-4" />,         accent: "#118C4C" },
              { label: "Total Paystack Inflow",  value: NGN(totalInflow),         icon: <CreditCard className="w-4 h-4" />,     accent: "#3b82f6" },
              { label: "Total Funded (Ledger)",  value: NGN(totalFunded),         icon: <ArrowDownLeft className="w-4 h-4" />,  accent: "#10b981" },
              { label: "Spent on Orders",        value: NGN(totalPurchased),      icon: <ShoppingBag className="w-4 h-4" />,    accent: "#f59e0b" },
              { label: "Withdrawals Completed",  value: NGN(totalWdCompleted),    icon: <Banknote className="w-4 h-4" />,       accent: "#ef4444" },
              { label: "Withdrawals Pending",    value: NGN(totalWdPending),      icon: <Banknote className="w-4 h-4" />,       accent: "#f97316" },
              { label: "Wallets Created",        value: String(accounts.length),  icon: <Wallet className="w-4 h-4" />,         accent: "#8b5cf6" },
              { label: "Wallets With Balance",   value: String(accounts.filter(a => Number(a.balance_ngn) > 0).length), icon: <Wallet className="w-4 h-4" />, accent: "#0ea5e9" },
            ].map(({ label, value, icon, accent }) => (
              <div key={label} className="p-4 rounded-xl border bg-card" style={{ borderColor: accent + "33" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground leading-tight">{label}</span>
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accent + "22", color: accent }}>{icon}</span>
                </div>
                <p className="text-xl font-black" style={{ color: accent }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Withdrawal status breakdown */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/40">
              <p className="text-sm font-bold">Withdrawal Requests Breakdown</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border">
              {([
                { label: "Pending",    arr: withdrawals.filter(w => w.status === "pending"),    color: "#f59e0b" },
                { label: "Processing", arr: withdrawals.filter(w => w.status === "processing"), color: "#3b82f6" },
                { label: "Completed",  arr: withdrawals.filter(w => w.status === "completed"),  color: "#10b981" },
                { label: "Failed",     arr: withdrawals.filter(w => w.status === "failed"),     color: "#ef4444" },
              ] as const).map(({ label, arr, color }) => (
                <div key={label} className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-xl font-black" style={{ color }}>{NGN(sum(arr, "amount_ngn"))}</p>
                  <p className="text-xs text-muted-foreground">{arr.length} requests</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ledger health check */}
          <div className="rounded-xl border border-border p-4 bg-card space-y-2">
            <p className="text-sm font-bold mb-3">Ledger Health</p>
            {[
              { label: "Total Inflow (Paystack)",     value: NGN(totalInflow),       note: "Money received from Paystack payments" },
              { label: "Total Funded (Wallet Ledger)", value: NGN(totalFunded),      note: "Credits recorded in wallet_transactions" },
              { label: "Total User Balances",          value: NGN(totalUserBalances), note: "Sum of all wallet_accounts.balance_ngn" },
              { label: "Total Spent on Orders",        value: NGN(totalPurchased),   note: "Wallet debits for purchases" },
              { label: "Total Withdrawn",              value: NGN(totalWdCompleted), note: "Completed bank withdrawals" },
            ].map(({ label, value, note }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{note}</p>
                </div>
                <p className="text-sm font-bold text-[#118C4C]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TREASURY ──────────────────────────────────────────────────────── */}
      {subTab === "treasury" && (() => {
        // ── Money that came IN to Foodra's Paystack account ──────────────────
        // Every successful Paystack payment = user paid this much (incl. Paystack fee)
        // The amount_ngn in paystack_payments is what the USER intended to fund
        // Paystack charged more on top (their fee) which Foodra absorbs as a cost
        const paystackFeeRate    = 0.015  // 1.5% Paystack fee (Nigerian cards)
        const paystackFeeCap     = 2000   // ₦2,000 cap per transaction
        const paystackFlatFee    = 100    // ₦100 flat above ₦2,500

        // Estimate Paystack fees paid on each top-up
        const totalPaystackFeePaid = successPayments.reduce((s: number, p: any) => {
          const amt = Number(p.amount_ngn)
          const fee = Math.min(amt * paystackFeeRate + (amt > 2500 ? paystackFlatFee : 0), paystackFeeCap)
          return s + fee
        }, 0)

        // Actual cash Paystack deposited to Foodra = inflow − Paystack fees
        const actualCashReceived = totalInflow - totalPaystackFeePaid

        // ── Withdrawal fees earned ──────────────────────────────────────────
        const WITHDRAWAL_FEE     = 50  // ₦50 per withdrawal
        const completedWd        = withdrawals.filter((w: any) => w.status === "completed")
        const processingWd       = withdrawals.filter((w: any) => w.status === "processing")
        const withdrawalFeesEarned = (completedWd.length + processingWd.length) * WITHDRAWAL_FEE

        // ── Revenue from orders (wallet purchases = Foodra's sales) ──────────
        const orderRevenue       = totalPurchased   // users spent this on orders
        const refundsTx          = txAll.filter((t: any) => t.category === "refund")
        const totalRefunds       = sum(refundsTx, "amount_ngn")
        const netOrderRevenue    = orderRevenue - totalRefunds

        // ── What Foodra owes users (liabilities) ─────────────────────────────
        // = sum of all current user wallet balances (Foodra must keep this liquid)
        const totalUserLiability = totalUserBalances

        // ── Cash paid out to users via bank withdrawals ───────────────────────
        const totalPaidOut       = sum(completedWd, "amount_ngn")
        const pendingPayout      = sum(withdrawals.filter((w: any) => ["pending","processing"].includes(w.status)), "amount_ngn")

        // ── Foodra's earned money (what belongs to Foodra) ───────────────────
        // = order revenue (net) + withdrawal fees − refunds
        const foodraEarned       = netOrderRevenue + withdrawalFeesEarned

        // ── What Foodra can safely spend ─────────────────────────────────────
        // = actual cash on Paystack − user balances owed − pending payouts
        const safeToSpend        = Math.max(0, actualCashReceived - totalUserLiability - pendingPayout + foodraEarned)

        // ── Exposure / loss indicators ────────────────────────────────────────
        const paystackFeesBurned = totalPaystackFeePaid  // cost Foodra absorbed

        const Row = ({ label, value, sub, color, bold }: {
          label: string; value: string; sub?: string; color?: string; bold?: boolean
        }) => (
          <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div>
              <p className={`text-sm ${bold ? "font-bold" : "font-medium"}`}>{label}</p>
              {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </div>
            <p className={`text-sm font-black tabular-nums ${color ?? "text-foreground"}`}>{value}</p>
          </div>
        )

        const Section = ({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) => (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: accent + "40" }}>
            <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest" style={{ background: accent + "15", color: accent }}>
              {title}
            </div>
            <div className="px-4 divide-y divide-border bg-card">{children}</div>
          </div>
        )

        return (
          <div className="space-y-4">
            {/* Top banner */}
            <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #118C4C, #0a5c31)" }}>
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
              <p className="text-xs font-semibold opacity-70 uppercase tracking-widest mb-1">Foodra Can Safely Spend</p>
              <p className="text-4xl font-black">{NGN(safeToSpend)}</p>
              <p className="text-xs opacity-60 mt-1">Cash earned after covering all user liabilities & pending payouts</p>
            </div>

            {/* KPI grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Foodra Earned",     value: NGN(foodraEarned),       color: "#118C4C", sub: "Orders + fees" },
                { label: "Users' Money",       value: NGN(totalUserLiability), color: "#3b82f6", sub: "Owed to users" },
                { label: "Pending Payouts",   value: NGN(pendingPayout),      color: "#f97316", sub: "Must be kept liquid" },
                { label: "Paystack Fees Lost", value: NGN(paystackFeesBurned), color: "#ef4444", sub: "Absorbed by Foodra" },
              ].map(({ label, value, color, sub }) => (
                <div key={label} className="rounded-xl border bg-card p-3" style={{ borderColor: color + "33" }}>
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-lg font-black" style={{ color }}>{value}</p>
                  <p className="text-[10px] text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>

            {/* Money In */}
            <Section title="💰 Money Coming In" accent="#118C4C">
              <Row label="Total User Top-Ups (Paystack)" value={NGN(totalInflow)}
                sub={`${successPayments.length} successful payments`} color="text-[#118C4C]" />
              <Row label="Paystack Processing Fees (absorbed)" value={`-${NGN(paystackFeesBurned)}`}
                sub="~1.5% per transaction — Foodra's cost" color="text-red-500" />
              <Row label="Net Cash Received from Paystack" value={NGN(actualCashReceived)}
                sub="What actually landed in Foodra's Paystack balance" color="text-[#118C4C]" bold />
              <Row label="Order Revenue (wallet purchases)" value={NGN(orderRevenue)}
                sub={`${txAll.filter((t:any) => t.category === "purchase").length} purchases`} color="text-[#118C4C]" />
              <Row label="Refunds Issued" value={`-${NGN(totalRefunds)}`}
                sub={`${refundsTx.length} refunds`} color="text-red-500" />
              <Row label="Net Order Revenue" value={NGN(netOrderRevenue)}
                sub="Revenue after refunds" color="text-[#118C4C]" bold />
              <Row label="Withdrawal Fees Earned (₦50 each)" value={NGN(withdrawalFeesEarned)}
                sub={`${completedWd.length + processingWd.length} completed/processing withdrawals`} color="text-[#118C4C]" />
            </Section>

            {/* Money Out */}
            <Section title="💸 Money Going Out" accent="#ef4444">
              <Row label="Completed Bank Payouts" value={`-${NGN(totalPaidOut)}`}
                sub={`${completedWd.length} withdrawals paid`} color="text-red-500" />
              <Row label="Pending/Processing Payouts" value={`-${NGN(pendingPayout)}`}
                sub={`${withdrawals.filter((w:any) => ["pending","processing"].includes(w.status)).length} in queue — must keep liquid`} color="text-orange-500" />
              <Row label="Paystack Fees Absorbed" value={`-${NGN(paystackFeesBurned)}`}
                sub="Cost of accepting card/bank payments" color="text-red-500" />
            </Section>

            {/* What belongs to whom */}
            <Section title="📦 Balance Ownership" accent="#3b82f6">
              <Row label="Users' Money (you owe this)" value={NGN(totalUserLiability)}
                sub={`${accounts.filter((a:any) => Number(a.balance_ngn) > 0).length} wallets with balance — never touch this`} color="text-blue-600" bold />
              <Row label="Foodra's Earned Revenue" value={NGN(foodraEarned)}
                sub="Orders + withdrawal fees − refunds" color="text-[#118C4C]" bold />
              <Row label="Pending Payouts (locked)" value={NGN(pendingPayout)}
                sub="Reserved for in-queue withdrawals" color="text-orange-500" />
              <Row label="✅ Safe to Spend" value={NGN(safeToSpend)}
                sub="Foodra's free cash after all obligations" color="text-[#118C4C]" bold />
            </Section>

            <p className="text-[10px] text-muted-foreground text-center pb-2">
              * Paystack fee estimate: 1.5% + ₦100 (above ₦2,500), capped at ₦2,000. Actual fees visible in your Paystack dashboard.
            </p>
          </div>
        )
      })()}

      {/* ── WITHDRAWALS ───────────────────────────────────────────────────── */}
      {subTab === "withdrawals" && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <input value={wdSearch} onChange={e => { setWdSearch(e.target.value); setWdPage(0) }}
              placeholder="Search by user, bank or account…"
              className="flex-1 min-w-[200px] text-sm border border-border rounded-xl px-3 py-2 bg-card focus:outline-none focus:ring-2 focus:ring-green-500" />
            <CustomSelect
              value={wdStatus}
              onChange={(v) => { setWdStatus(v); setWdPage(0) }}
              options={["All", "pending", "processing", "completed", "failed", "rejected"].map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
              className="w-36"
            />
            <button onClick={() => exportWithdrawalsCSV(filteredWd)}
              className="flex items-center gap-1.5 text-sm bg-card hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground px-3 py-2 rounded-xl transition-colors border border-border">
              <Download className="w-4 h-4" /> Export
            </button>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{filteredWd.length} results</span>
          </div>

          {/* Summary pills */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs bg-muted px-3 py-1.5 rounded-full border border-border">
              Total: <strong>₦{sum(filteredWd, "amount_ngn").toLocaleString()}</strong>
            </span>
            <span className="text-xs bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 px-3 py-1.5 rounded-full border border-yellow-200 dark:border-yellow-800">
              Pending: <strong>{filteredWd.filter(r => r.status === "pending").length}</strong>
            </span>
            <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800">
              Processing: <strong>{filteredWd.filter(r => r.status === "processing").length}</strong>
            </span>
            <span className="text-xs bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 px-3 py-1.5 rounded-full border border-red-200 dark:border-red-800">
              Failed: <strong>{filteredWd.filter(r => r.status === "failed").length}</strong>
            </span>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">User</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Bank Details</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Transfer Code</th>
                    <th className="px-4 py-3 text-left hidden lg:table-cell">Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {wdPaged.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No withdrawals found</td></tr>
                  )}
                  {wdPaged.map((r: any) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="font-medium">{r.users?.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[140px]">{r.users?.email ?? ""}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-[#118C4C]">{NGN(Number(r.amount_ngn))}</td>
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
            {wdPages > 1 && (
              <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Page {wdPage + 1} of {wdPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setWdPage(p => p - 1)} disabled={wdPage === 0}
                    className="px-3 py-1.5 rounded-lg bg-card disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700">Prev</button>
                  <button onClick={() => setWdPage(p => p + 1)} disabled={wdPage >= wdPages - 1}
                    className="px-3 py-1.5 rounded-lg bg-card disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PER-USER WALLET BREAKDOWN ──────────────────────────────────────── */}
      {subTab === "users" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <input value={uSearch} onChange={e => { setUSearch(e.target.value); setUPage(0) }}
              placeholder="Search by name, email or Foodra tag…"
              className="flex-1 min-w-[200px] text-sm border border-border rounded-xl px-3 py-2 bg-card focus:outline-none focus:ring-2 focus:ring-green-500" />
            <button onClick={() => exportWalletsCSV(enrichedAccounts, userMap)}
              className="flex items-center gap-1.5 text-sm bg-card hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground px-3 py-2 rounded-xl transition-colors border border-border">
              <Download className="w-4 h-4" /> Export
            </button>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{filteredAccounts.length} wallets</span>
          </div>

          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {uPaged.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No wallets found</div>
            )}
            {uPaged.map((a: any) => {
              const u = userMap[a.user_id]
              const expanded = expandedUser === a.user_id
              return (
                <div key={a.user_id}>
                  {/* Row header */}
                  <button
                    onClick={() => setExpandedUser(expanded ? null : a.user_id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                  >
                    {/* Avatar */}
                    {u?.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#118C4C]/10 flex items-center justify-center text-[#118C4C] text-sm font-bold flex-shrink-0">
                        {(u?.name || "?")[0].toUpperCase()}
                      </div>
                    )}

                    {/* Name + tag */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{u?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground truncate">{u?.email || a.user_id.slice(0, 16)}</p>
                    </div>

                    {/* Foodra tag */}
                    <span className="hidden sm:block text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded-lg flex-shrink-0">
                      {a.foodra_tag || "—"}
                    </span>

                    {/* Balance */}
                    <span className={`text-sm font-black flex-shrink-0 ${Number(a.balance_ngn) > 0 ? "text-[#118C4C]" : "text-muted-foreground"}`}>
                      {NGN(Number(a.balance_ngn))}
                    </span>

                    {/* Expand icon */}
                    <span className="text-muted-foreground flex-shrink-0 ml-1">
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {/* Expanded breakdown */}
                  {expanded && (
                    <div className="border-t border-border bg-muted/20 px-4 py-4 space-y-4">
                      {/* Summary grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {[
                          { label: "Funded",    value: a._funded,    color: "#118C4C", icon: <CreditCard className="w-3 h-3" /> },
                          { label: "Received",  value: a._received,  color: "#3b82f6", icon: <ArrowDownLeft className="w-3 h-3" /> },
                          { label: "Spent",     value: a._spent,     color: "#f59e0b", icon: <ShoppingBag className="w-3 h-3" /> },
                          { label: "Sent",      value: a._sent,      color: "#8b5cf6", icon: <ArrowUpRight className="w-3 h-3" /> },
                          { label: "Withdrawn", value: a._withdrawn, color: "#ef4444", icon: <Banknote className="w-3 h-3" /> },
                          { label: "Refunded",  value: a._refunded,  color: "#10b981", icon: <RefreshCcw className="w-3 h-3" /> },
                        ].map(({ label, value, color, icon }) => (
                          <div key={label} className="rounded-lg border bg-card p-2.5" style={{ borderColor: color + "33" }}>
                            <div className="flex items-center gap-1 mb-1" style={{ color }}>
                              {icon}
                              <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
                            </div>
                            <p className="text-sm font-bold" style={{ color }}>{NGN(value)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Recent transactions */}
                      {a._txList.length > 0 && (
                        <div className="rounded-xl border border-border overflow-hidden">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-3 py-2 border-b border-border bg-muted/30">
                            Recent Transactions ({a._txList.length})
                          </p>
                          <div className="divide-y divide-border max-h-60 overflow-y-auto">
                            {a._txList.map((tx: any) => (
                              <div key={tx.id} className="flex items-center justify-between px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${
                                    tx.type === "credit"
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                                      : "bg-red-100 dark:bg-red-900/30 text-red-500"
                                  }`}>
                                    {CATEGORY_ICONS[tx.category]}
                                  </span>
                                  <div>
                                    <p className="text-xs font-medium">{CATEGORY_LABELS[tx.category] ?? tx.category}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {new Date(tx.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                                      {tx.note ? ` · ${tx.note}` : ""}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className={`text-xs font-bold ${tx.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                                    {tx.type === "credit" ? "+" : "-"}₦{Number(tx.amount_ngn).toLocaleString()}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    Bal: ₦{Number(tx.balance_after).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {uPages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Page {uPage + 1} of {uPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setUPage(p => p - 1)} disabled={uPage === 0}
                  className="px-3 py-1.5 rounded-lg bg-card border border-border disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700">Prev</button>
                <button onClick={() => setUPage(p => p + 1)} disabled={uPage >= uPages - 1}
                  className="px-3 py-1.5 rounded-lg bg-card border border-border disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
