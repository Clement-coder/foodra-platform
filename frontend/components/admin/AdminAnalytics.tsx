"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { usePrivy } from "@privy-io/react-auth"
import { Megaphone, Loader2, TrendingUp, ShoppingBag, Wallet, DollarSign, Users, Package, BookOpen, AlertTriangle, ArrowDownLeft, ArrowUpRight, RefreshCcw, CreditCard, Send } from "lucide-react"
import type { AdminData } from "@/app/admin/page"
import { useToast } from "@/lib/toast"
import { authFetch } from "@/lib/authFetch"

// ── Helpers ──────────────────────────────────────────────────────────────────
const NGN = (v: number) => `₦${v.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`

function sum(arr: any[], key: string) {
  return arr.reduce((s, r) => s + Number(r[key] ?? 0), 0)
}

function monthBuckets(months: { label: string; year: number; month: number }[], rows: any[], dateKey: string, valueKey?: string) {
  return months.map(m => ({
    label: m.label,
    value: rows
      .filter(r => { const d = new Date(r[dateKey]); return d.getFullYear() === m.year && d.getMonth() === m.month })
      .reduce((s, r) => s + (valueKey ? Number(r[valueKey] ?? 0) : 1), 0),
  }))
}

function getMonths(n: number) {
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    return { label: d.toLocaleString("default", { month: "short" }), year: d.getFullYear(), month: d.getMonth() }
  })
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, color = "#118C4C", prefix = "", suffix = "" }: {
  data: { label: string; value: number }[]
  color?: string; prefix?: string; suffix?: string
}) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1.5 h-28 w-full">
      {data.map(({ label, value }, i) => (
        <div key={label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <span className="text-[9px] text-muted-foreground truncate w-full text-center">
            {value > 0 ? `${prefix}${value >= 1000 ? (value / 1000).toFixed(0) + "k" : value}${suffix}` : ""}
          </span>
          <motion.div
            initial={{ height: 0 }} animate={{ height: `${(value / max) * 88}px` }}
            transition={{ type: "spring", stiffness: 60, damping: 14, delay: i * 0.04 }}
            style={{ backgroundColor: color }}
            className="w-full rounded-t-md min-h-[2px]"
          />
          <span className="text-[9px] text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0)
  if (total === 0) return <div className="text-xs text-muted-foreground text-center py-4">No data</div>
  let offset = 0
  const R = 40, C = 2 * Math.PI * R
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-24 h-24 flex-shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#e5e7eb" strokeWidth="18" />
        {slices.map((sl, i) => {
          const dash = (sl.value / total) * C
          const gap = C - dash
          const el = (
            <circle key={i} cx="50" cy="50" r={R} fill="none"
              stroke={sl.color} strokeWidth="18"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
            />
          )
          offset += dash
          return el
        })}
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {slices.map(sl => (
          <div key={sl.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: sl.color }} />
            <span className="text-muted-foreground truncate flex-1">{sl.label}</span>
            <span className="font-semibold">{total > 0 ? Math.round((sl.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string; icon: any; accent: string
}) {
  return (
    <div className={`p-4 rounded-xl border bg-card`} style={{ borderColor: accent + "33" }}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-muted-foreground leading-tight">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accent + "22" }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
      </div>
      <p className="text-2xl font-black" style={{ color: accent }}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">{title}</h2>
      {children}
    </div>
  )
}

// ── Chart card ────────────────────────────────────────────────────────────────
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <p className="text-sm font-semibold mb-4">{title}</p>
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
const RANGES = [3, 6, 12] as const
type Range = typeof RANGES[number]

export default function AdminAnalytics({ data, privyId }: { data: AdminData; privyId?: string }) {
  const { toast } = useToast()
  const { getAccessToken } = usePrivy()
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [broadcastMsg, setBroadcastMsg] = useState("")
  const [broadcastLink, setBroadcastLink] = useState("")
  const [sending, setSending] = useState(false)
  const [range, setRange] = useState<Range>(6)

  const sendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return
    setSending(true)
    const res = await authFetch(getAccessToken, "/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ broadcast: true, type: "broadcast", title: broadcastTitle.trim(), message: broadcastMsg.trim(), link: broadcastLink.trim() || null }),
    })
    if (res.ok) {
      const { count } = await res.json()
      toast.success(`Sent to ${count} users`)
      setBroadcastTitle(""); setBroadcastMsg(""); setBroadcastLink("")
    } else toast.error("Failed to send")
    setSending(false)
  }

  // ── Raw data refs ─────────────────────────────────────────────────────────
  const tx: any[]      = data.walletTransactions || []
  const accounts: any[] = data.walletAccounts || []
  const payments: any[] = data.paystackPayments || []
  const orders: any[]   = data.orders || []
  const withdrawals: any[] = data.walletRequests || []

  // ── Wallet transaction categories ─────────────────────────────────────────
  const credits  = tx.filter(t => t.type === "credit")
  const debits   = tx.filter(t => t.type === "debit")

  const byCategory = (cat: string) => tx.filter(t => t.category === cat)
  const funded   = byCategory("fund")       // paystack top-ups
  const received = byCategory("receive")    // p2p received
  const sent     = byCategory("send")       // p2p sent
  const purchases = byCategory("purchase")  // order payments
  const refunds  = byCategory("refund")
  const withdrawTx = byCategory("withdraw")

  const totalFunded    = sum(funded, "amount_ngn")
  const totalReceived  = sum(received, "amount_ngn")
  const totalSent      = sum(sent, "amount_ngn")
  const totalPurchased = sum(purchases, "amount_ngn")
  const totalRefunds   = sum(refunds, "amount_ngn")
  const totalWithdrawTx = sum(withdrawTx, "amount_ngn")

  // ── Platform wallet pool ──────────────────────────────────────────────────
  const totalUserBalances = sum(accounts, "balance_ngn")
  const walletsWithBalance = accounts.filter(a => Number(a.balance_ngn) > 0).length

  // ── Orders / revenue ──────────────────────────────────────────────────────
  const paidOrders      = orders.filter(o => o.wallet_paid)
  const gmv             = sum(paidOrders, "total_amount")
  const deliveredRev    = sum(orders.filter(o => o.status === "Delivered" && o.wallet_paid), "total_amount")
  const inTransitRev    = sum(orders.filter(o => ["Processing", "Shipped"].includes(o.status) && o.wallet_paid), "total_amount")

  const statusCount: Record<string, number> = {}
  for (const o of orders) statusCount[o.status] = (statusCount[o.status] || 0) + 1

  // ── Withdrawals breakdown ─────────────────────────────────────────────────
  const wdCompleted   = withdrawals.filter(w => w.status === "completed")
  const wdProcessing  = withdrawals.filter(w => w.status === "processing")
  const wdPending     = withdrawals.filter(w => w.status === "pending")
  const wdFailed      = withdrawals.filter(w => w.status === "failed")
  const totalWdDone   = sum(wdCompleted, "amount_ngn")
  const totalWdPending = sum(wdPending, "amount_ngn") + sum(wdProcessing, "amount_ngn")

  // ── Paystack inflow ───────────────────────────────────────────────────────
  const successPayments = payments.filter(p => p.status === "success")
  const totalInflow = sum(successPayments, "amount_ngn")

  // ── Funding ───────────────────────────────────────────────────────────────
  const fundingApproved = (data.funding || []).filter(f => f.status === "Approved").length
  const fundingPending  = (data.funding || []).filter(f => f.status === "Pending").length
  const fundingRejected = (data.funding || []).filter(f => f.status === "Rejected").length
  const approvalRate    = data.funding.length > 0 ? Math.round((fundingApproved / data.funding.length) * 100) : 0

  // ── Top products by revenue ───────────────────────────────────────────────
  const productRev: Record<string, { name: string; rev: number }> = {}
  for (const o of orders.filter(o => o.wallet_paid)) {
    for (const item of o.order_items || []) {
      const id = item.product_id || item.product_name
      if (!productRev[id]) productRev[id] = { name: item.product_name, rev: 0 }
      productRev[id].rev += Number(item.price) * item.quantity
    }
  }
  const topProducts = Object.values(productRev).sort((a, b) => b.rev - a.rev).slice(0, 5)
  const maxProdRev  = topProducts[0]?.rev || 1

  // ── Category breakdown ─────────────────────────────────────────────────────
  const catCount: Record<string, number> = {}
  for (const p of data.products) catCount[p.category] = (catCount[p.category] || 0) + 1
  const topCats = Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxCat  = topCats[0]?.[1] || 1

  // ── Time series ───────────────────────────────────────────────────────────
  const months = getMonths(range)
  const revenueChart  = monthBuckets(months, paidOrders,      "created_at", "total_amount")
  const usersChart    = monthBuckets(months, data.users || [], "created_at")
  const fundedChart   = monthBuckets(months, funded,           "created_at", "amount_ngn")
  const purchaseChart = monthBuckets(months, purchases,        "created_at", "amount_ngn")

  const RangePicker = () => (
    <div className="flex gap-1">
      {RANGES.map(r => (
        <button key={r} onClick={() => setRange(r)}
          className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${range === r ? "bg-[#118C4C] text-white" : "bg-muted text-muted-foreground"}`}>
          {r}mo
        </button>
      ))}
    </div>
  )

  return (
    <div className="p-5 space-y-8 max-w-6xl mx-auto">

      {/* ── 1. Platform KPIs ──────────────────────────────────────────────── */}
      <Section title="Platform Overview">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Total Users"       value={String(data.users.length)}    sub={`+${monthBuckets(getMonths(1), data.users, "created_at")[0]?.value ?? 0} this month`} icon={Users}    accent="#3b82f6" />
          <StatCard label="Gross Sales (GMV)" value={NGN(gmv)}                     sub={`${paidOrders.length} paid orders`}                                                    icon={TrendingUp} accent="#118C4C" />
          <StatCard label="Delivered Revenue" value={NGN(deliveredRev)}            sub="Fully completed"                                                                       icon={ShoppingBag} accent="#10b981" />
          <StatCard label="In-Transit"        value={NGN(inTransitRev)}            sub="Paid, not delivered"                                                                   icon={Package}     accent="#8b5cf6" />
          <StatCard label="Total Inflow"      value={NGN(totalInflow)}             sub={`${successPayments.length} Paystack payments`}                                         icon={CreditCard}  accent="#f59e0b" />
        </div>
      </Section>

      {/* ── 2. Wallet Fund Breakdown ──────────────────────────────────────── */}
      <Section title="Wallet Money Breakdown">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          <StatCard label="Funds Added (Paystack)" value={NGN(totalFunded)}    sub={`${funded.length} top-ups`}                icon={CreditCard}    accent="#118C4C" />
          <StatCard label="P2P Received"           value={NGN(totalReceived)} sub={`${received.length} transfers in`}          icon={ArrowDownLeft} accent="#3b82f6" />
          <StatCard label="P2P Sent"               value={NGN(totalSent)}     sub={`${sent.length} transfers out`}             icon={ArrowUpRight}  accent="#8b5cf6" />
          <StatCard label="Spent on Orders"        value={NGN(totalPurchased)} sub={`${purchases.length} purchases`}           icon={ShoppingBag}   accent="#f59e0b" />
          <StatCard label="Refunds Issued"         value={NGN(totalRefunds)}  sub={`${refunds.length} refunds`}                icon={RefreshCcw}    accent="#10b981" />
          <StatCard label="Withdrawn to Bank"      value={NGN(totalWithdrawTx)} sub={`${withdrawTx.length} withdrawals`}      icon={Send}          accent="#ef4444" />
          <StatCard label="All User Balances"      value={NGN(totalUserBalances)} sub={`${walletsWithBalance}/${accounts.length} wallets funded`} icon={Wallet} accent="#0ea5e9" />
          <StatCard label="Pending Withdrawals"    value={NGN(totalWdPending)} sub={`${wdPending.length + wdProcessing.length} requests`}        icon={AlertTriangle} accent="#f97316" />
        </div>

        {/* Transaction category donut */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ChartCard title="Credit Sources (how money enters wallets)">
            <DonutChart slices={[
              { label: "Funded via Paystack", value: totalFunded,   color: "#118C4C" },
              { label: "P2P Received",        value: totalReceived, color: "#3b82f6" },
              { label: "Refunds",             value: totalRefunds,  color: "#10b981" },
            ]} />
          </ChartCard>
          <ChartCard title="Debit Sources (how money leaves wallets)">
            <DonutChart slices={[
              { label: "Order Purchases", value: totalPurchased,  color: "#f59e0b" },
              { label: "P2P Sent",        value: totalSent,       color: "#8b5cf6" },
              { label: "Bank Withdrawals",value: totalWithdrawTx, color: "#ef4444" },
            ]} />
          </ChartCard>
        </div>
      </Section>

      {/* ── 3. Withdrawal Status ─────────────────────────────────────────── */}
      <Section title="Bank Withdrawal Requests">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Completed",  arr: wdCompleted,  color: "#10b981" },
            { label: "Processing", arr: wdProcessing, color: "#3b82f6" },
            { label: "Pending",    arr: wdPending,    color: "#f59e0b" },
            { label: "Failed",     arr: wdFailed,     color: "#ef4444" },
          ].map(({ label, arr, color }) => (
            <div key={label} className="p-4 rounded-xl border bg-card" style={{ borderColor: color + "33" }}>
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-xl font-black" style={{ color }}>{NGN(sum(arr, "amount_ngn"))}</p>
              <p className="text-xs text-muted-foreground">{arr.length} requests</p>
            </div>
          ))}
        </div>
        <ChartCard title="Withdrawal Status Distribution">
          <DonutChart slices={[
            { label: "Completed",  value: sum(wdCompleted,  "amount_ngn"), color: "#10b981" },
            { label: "Processing", value: sum(wdProcessing, "amount_ngn"), color: "#3b82f6" },
            { label: "Pending",    value: sum(wdPending,    "amount_ngn"), color: "#f59e0b" },
            { label: "Failed",     value: sum(wdFailed,     "amount_ngn"), color: "#ef4444" },
          ]} />
        </ChartCard>
      </Section>

      {/* ── 4. Time-Series Charts ────────────────────────────────────────── */}
      <Section title="Trends">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">Time range</span>
          <RangePicker />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ChartCard title="Sales Revenue">
            <BarChart data={revenueChart} color="#118C4C" prefix="₦" />
          </ChartCard>
          <ChartCard title="New Users">
            <BarChart data={usersChart} color="#3b82f6" />
          </ChartCard>
          <ChartCard title="Wallet Top-Ups (Paystack)">
            <BarChart data={fundedChart} color="#f59e0b" prefix="₦" />
          </ChartCard>
          <ChartCard title="Wallet Purchases (Order Payments)">
            <BarChart data={purchaseChart} color="#8b5cf6" prefix="₦" />
          </ChartCard>
        </div>
      </Section>

      {/* ── 5. Orders ────────────────────────────────────────────────────── */}
      <Section title="Order Status Breakdown">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ChartCard title="Orders by Status">
            <DonutChart slices={[
              { label: "Delivered",  value: statusCount["Delivered"]  || 0, color: "#10b981" },
              { label: "Shipped",    value: statusCount["Shipped"]    || 0, color: "#8b5cf6" },
              { label: "Processing", value: statusCount["Processing"] || 0, color: "#3b82f6" },
              { label: "Pending",    value: statusCount["Pending"]    || 0, color: "#f59e0b" },
              { label: "Cancelled",  value: statusCount["Cancelled"]  || 0, color: "#ef4444" },
            ]} />
          </ChartCard>
          <ChartCard title="Top 5 Products by Revenue">
            <div className="space-y-3">
              {topProducts.length === 0 && <p className="text-xs text-muted-foreground">No data</p>}
              {topProducts.map(p => (
                <div key={p.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground truncate max-w-[60%]">{p.name}</span>
                    <span className="font-semibold">{NGN(p.rev)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.rev / maxProdRev) * 100}%` }}
                      transition={{ type: "spring", stiffness: 50, damping: 14 }}
                      className="h-full bg-[#118C4C] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </Section>

      {/* ── 6. Products & Training ───────────────────────────────────────── */}
      <Section title="Products & Training">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ChartCard title="Products by Category">
            <div className="space-y-2.5">
              {topCats.map(([cat, count]) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{cat}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxCat) * 100}%` }}
                      transition={{ type: "spring", stiffness: 50, damping: 14 }}
                      className="h-full bg-[#118C4C] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
          <ChartCard title="Funding Applications">
            <DonutChart slices={[
              { label: `Approved (${fundingApproved})`,  value: fundingApproved, color: "#10b981" },
              { label: `Pending (${fundingPending})`,    value: fundingPending,  color: "#f59e0b" },
              { label: `Rejected (${fundingRejected})`,  value: fundingRejected, color: "#ef4444" },
            ]} />
            <p className="text-xs text-center text-muted-foreground mt-3">Approval rate: <span className="font-bold text-foreground">{approvalRate}%</span></p>
          </ChartCard>
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <p className="text-sm font-semibold">Training</p>
            {[
              { label: "Programs",    value: data.trainings.length },
              { label: "Enrollments", value: data.enrollments.length },
              { label: "Avg capacity", value: data.trainings.length > 0 ? Math.round(sum(data.trainings, "capacity") / data.trainings.length) : 0 },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-bold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 7. Broadcast ─────────────────────────────────────────────────── */}
      <Section title="Broadcast Notification">
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">Send to all users</span>
          </div>
          <div className="space-y-3">
            <input value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} placeholder="Title…"
              className="w-full text-sm border border-orange-200 dark:border-orange-700 rounded-xl px-3 py-2 bg-card focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Message…" rows={2}
              className="w-full text-sm border border-orange-200 dark:border-orange-700 rounded-xl px-3 py-2 bg-card focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
            <div className="flex gap-3">
              <input value={broadcastLink} onChange={e => setBroadcastLink(e.target.value)} placeholder="Optional link (e.g. /marketplace)"
                className="flex-1 text-sm border border-orange-200 dark:border-orange-700 rounded-xl px-3 py-2 bg-card focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <button onClick={sendBroadcast} disabled={sending || !broadcastTitle.trim() || !broadcastMsg.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />} Send
              </button>
            </div>
          </div>
        </div>
      </Section>

    </div>
  )
}
