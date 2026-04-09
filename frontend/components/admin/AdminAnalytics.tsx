import { useState } from "react"
import { Megaphone, Loader2 } from "lucide-react"
import type { AdminData } from "@/app/admin/page"
import { useToast } from "@/lib/toast"

const RANGES = [3, 6, 12] as const
type Range = typeof RANGES[number]

export default function AdminAnalytics({ data, privyId }: { data: AdminData; privyId?: string }) {
  const { toast } = useToast()
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [broadcastMsg, setBroadcastMsg] = useState("")
  const [broadcastLink, setBroadcastLink] = useState("")
  const [sending, setSending] = useState(false)

  const sendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return
    setSending(true)
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        broadcast: true,
        actorPrivyId: privyId,
        type: "broadcast",
        title: broadcastTitle.trim(),
        message: broadcastMsg.trim(),
        link: broadcastLink.trim() || null,
      }),
    })
    if (res.ok) {
      const { count } = await res.json()
      toast.success(`Notification sent to ${count} users`)
      setBroadcastTitle(""); setBroadcastMsg(""); setBroadcastLink("")
    } else {
      toast.error("Failed to send notification")
    }
    setSending(false)
  }
  const [range, setRange] = useState<Range>(6)

  const totalRevenue = data.orders
    .filter((o: any) => o.status !== "Cancelled")
    .reduce((sum: number, o: any) => sum + Number(o.total_amount), 0)

  const approvedFunding = data.funding.filter((f: any) => f.status === "Approved").length
  const pendingFunding = data.funding.filter((f: any) => f.status === "Pending").length
  const approvalRate = data.funding.length > 0
    ? Math.round((approvedFunding / data.funding.length) * 100) : 0

  const categoryCount: Record<string, number> = {}
  for (const p of data.products) {
    categoryCount[p.category] = (categoryCount[p.category] || 0) + 1
  }
  const topCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCat = topCategories[0]?.[1] || 1

  const statusCount: Record<string, number> = {}
  for (const o of data.orders) statusCount[o.status] = (statusCount[o.status] || 0) + 1

  const now = new Date()
  const months = Array.from({ length: range }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (range - 1 - i), 1)
    return { label: d.toLocaleString("default", { month: "short" }), year: d.getFullYear(), month: d.getMonth() }
  })

  const usersByMonth = months.map(m => ({
    label: m.label,
    count: data.users.filter((u: any) => {
      const d = new Date(u.created_at)
      return d.getFullYear() === m.year && d.getMonth() === m.month
    }).length,
  }))
  const maxUsers = Math.max(...usersByMonth.map(m => m.count), 1)

  const revenueByMonth = months.map(m => ({
    label: m.label,
    amount: data.orders
      .filter((o: any) => {
        if (o.status === "Cancelled") return false
        const d = new Date(o.created_at)
        return d.getFullYear() === m.year && d.getMonth() === m.month
      })
      .reduce((sum: number, o: any) => sum + Number(o.total_amount), 0),
  }))
  const maxRevenue = Math.max(...revenueByMonth.map(m => m.amount), 1)

  const statCards = [
    { label: "Total Revenue", value: `₦${totalRevenue.toLocaleString()}`, color: "green" },
    { label: "Total Users", value: data.users.length, color: "blue" },
    { label: "Total Orders", value: data.orders.length, color: "purple" },
    { label: "Active Products", value: data.products.filter((p: any) => p.is_available).length, color: "yellow" },
    { label: "Funding Approval Rate", value: `${approvalRate}%`, color: "emerald" },
    { label: "Pending Funding", value: pendingFunding, color: "orange" },
    { label: "Total Trainings", value: data.trainings.length, color: "cyan" },
    { label: "Total Enrollments", value: data.enrollments.length, color: "pink" },
  ]

  const RangeSelector = () => (
    <div className="flex gap-1">
      {RANGES.map(r => (
        <button key={r} onClick={() => setRange(r)}
          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${range === r ? "bg-green-600 text-white" : "bg-gray-200 bg-card text-muted-foreground text-foreground hover:bg-gray-300 dark:hover:bg-gray-600"}`}>
          {r}mo
        </button>
      ))}
    </div>
  )

  return (
    <div className="p-6 space-y-8">
      {/* Broadcast notification */}
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="w-5 h-5 text-orange-600" />
          <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-400">Broadcast Notification to All Users</h3>
        </div>
        <div className="space-y-3">
          <input
            value={broadcastTitle}
            onChange={e => setBroadcastTitle(e.target.value)}
            placeholder="Notification title…"
            className="w-full text-sm border border-orange-200 dark:border-orange-700 rounded-xl px-3 py-2 bg-card bg-card focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <textarea
            value={broadcastMsg}
            onChange={e => setBroadcastMsg(e.target.value)}
            placeholder="Message body…"
            rows={2}
            className="w-full text-sm border border-orange-200 dark:border-orange-700 rounded-xl px-3 py-2 bg-card bg-card focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
          <div className="flex gap-3">
            <input
              value={broadcastLink}
              onChange={e => setBroadcastLink(e.target.value)}
              placeholder="Optional link (e.g. /marketplace)"
              className="flex-1 text-sm border border-orange-200 dark:border-orange-700 rounded-xl px-3 py-2 bg-card bg-card focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              onClick={sendBroadcast}
              disabled={sending || !broadcastTitle.trim() || !broadcastMsg.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
              Send to All
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className={`p-4 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-100 dark:border-${color}-800`}>
            <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue over time */}
        <div className="bg-muted bg-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground text-foreground">Revenue (Last {range} Months)</h3>
            <RangeSelector />
          </div>
          <div className="flex items-end gap-2 h-32">
            {revenueByMonth.map(({ label, amount }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{amount > 0 ? `₦${(amount / 1000).toFixed(0)}k` : ""}</span>
                <div className="w-full bg-green-500 rounded-t-md transition-all" style={{ height: `${(amount / maxRevenue) * 96}px`, minHeight: amount > 0 ? 4 : 0 }} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* New users per month */}
        <div className="bg-muted bg-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground text-foreground">New Users (Last {range} Months)</h3>
            <RangeSelector />
          </div>
          <div className="flex items-end gap-2 h-32">
            {usersByMonth.map(({ label, count }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{count}</span>
                <div className="w-full bg-blue-500 rounded-t-md transition-all" style={{ height: `${(count / maxUsers) * 96}px`, minHeight: count > 0 ? 4 : 0 }} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top product categories */}
        <div className="bg-muted bg-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground text-foreground mb-4">Top Product Categories</h3>
          <div className="space-y-3">
            {topCategories.map(([cat, count]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground dark:text-muted-foreground">{cat}</span>
                  <span className="font-medium text-foreground text-foreground">{count}</span>
                </div>
                <div className="h-2 bg-gray-200 bg-card rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${(count / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order status breakdown */}
        <div className="bg-muted bg-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground text-foreground mb-4">Order Status Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(statusCount).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-2 bg-card dark:bg-card rounded-lg">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  status === "Delivered" ? "bg-green-100 text-green-700"
                  : status === "Cancelled" ? "bg-red-100 text-red-700"
                  : status === "Shipped" ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700"}`}>{status}</span>
                <span className="text-sm font-bold text-foreground text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Funding breakdown */}
        <div className="bg-muted bg-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground text-foreground mb-4">Funding Applications</h3>
          <div className="space-y-2">
            {[
              { label: "Pending", count: pendingFunding, color: "yellow" },
              { label: "Approved", count: approvedFunding, color: "green" },
              { label: "Rejected", count: data.funding.filter((f: any) => f.status === "Rejected").length, color: "red" },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center justify-between p-2 bg-card dark:bg-card rounded-lg">
                <span className={`text-xs px-2 py-1 rounded-full font-medium bg-${color}-100 text-${color}-700`}>{label}</span>
                <span className="text-sm font-bold text-foreground text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
