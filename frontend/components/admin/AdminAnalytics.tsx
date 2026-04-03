import type { AdminData } from "@/app/admin/page"

export default function AdminAnalytics({ data }: { data: AdminData }) {
  const totalRevenue = data.orders
    .filter((o: any) => o.status !== "Cancelled")
    .reduce((sum: number, o: any) => sum + Number(o.total_amount), 0)

  const approvedFunding = data.funding.filter((f: any) => f.status === "Approved").length
  const pendingFunding = data.funding.filter((f: any) => f.status === "Pending").length
  const approvalRate = data.funding.length > 0
    ? Math.round((approvedFunding / data.funding.length) * 100) : 0

  // Category breakdown
  const categoryCount: Record<string, number> = {}
  for (const p of data.products) {
    categoryCount[p.category] = (categoryCount[p.category] || 0) + 1
  }
  const topCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCat = topCategories[0]?.[1] || 1

  // Order status breakdown
  const statusCount: Record<string, number> = {}
  for (const o of data.orders) statusCount[o.status] = (statusCount[o.status] || 0) + 1

  // New users per month (last 6 months)
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
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

  return (
    <div className="p-6 space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className={`p-4 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-100 dark:border-${color}-800`}>
            <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* New users per month */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">New Users (Last 6 Months)</h3>
          <div className="flex items-end gap-2 h-32">
            {usersByMonth.map(({ label, count }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">{count}</span>
                <div className="w-full bg-blue-500 rounded-t-md transition-all" style={{ height: `${(count / maxUsers) * 96}px`, minHeight: count > 0 ? 4 : 0 }} />
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top product categories */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Top Product Categories</h3>
          <div className="space-y-3">
            {topCategories.map(([cat, count]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{cat}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{count}</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${(count / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order status breakdown */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Order Status Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(statusCount).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-lg">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  status === "Delivered" ? "bg-green-100 text-green-700"
                  : status === "Cancelled" ? "bg-red-100 text-red-700"
                  : status === "Shipped" ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700"}`}>{status}</span>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Funding breakdown */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Funding Applications</h3>
          <div className="space-y-2">
            {[
              { label: "Pending", count: pendingFunding, color: "yellow" },
              { label: "Approved", count: approvedFunding, color: "green" },
              { label: "Rejected", count: data.funding.filter((f: any) => f.status === "Rejected").length, color: "red" },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-lg">
                <span className={`text-xs px-2 py-1 rounded-full font-medium bg-${color}-100 text-${color}-700`}>{label}</span>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
