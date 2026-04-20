"use client"

import { useMemo } from "react"
import { TrendingUp, Package, ShoppingBag, DollarSign, Star, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface SaleOrder {
  id: string
  status: string
  escrowStatus: string
  totalAmount: number
  usdcAmount: number | null
  createdAt: string
  items: { productId: string; productName: string; quantity: number; pricePerUnit: number }[]
}

interface Props {
  sales: SaleOrder[]
}

export function FarmerAnalyticsDashboard({ sales }: Props) {
  const stats = useMemo(() => {
    const completed = sales.filter((s) => s.escrowStatus === "released" || s.status === "Delivered")
    const pending = sales.filter((s) => ["locked", "none"].includes(s.escrowStatus) && s.status !== "Cancelled")
    const totalRevenue = completed.reduce((sum, s) => sum + s.totalAmount, 0)
    const pendingRevenue = pending.reduce((sum, s) => sum + s.totalAmount, 0)

    // Product performance
    const productMap: Record<string, { name: string; units: number; revenue: number }> = {}
    for (const sale of sales) {
      for (const item of sale.items) {
        if (!productMap[item.productId]) {
          productMap[item.productId] = { name: item.productName, units: 0, revenue: 0 }
        }
        productMap[item.productId].units += item.quantity
        productMap[item.productId].revenue += item.pricePerUnit * item.quantity
      }
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Monthly revenue (last 6 months)
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return { label: d.toLocaleString("default", { month: "short" }), year: d.getFullYear(), month: d.getMonth() }
    })
    const monthlyRevenue = months.map((m) => ({
      label: m.label,
      amount: completed
        .filter((s) => {
          const d = new Date(s.createdAt)
          return d.getFullYear() === m.year && d.getMonth() === m.month
        })
        .reduce((sum, s) => sum + s.totalAmount, 0),
    }))
    const maxMonthly = Math.max(...monthlyRevenue.map((m) => m.amount), 1)

    // Escrow breakdown
    const escrowBreakdown = {
      locked: sales.filter((s) => s.escrowStatus === "locked").length,
      released: sales.filter((s) => s.escrowStatus === "released").length,
      disputed: sales.filter((s) => s.escrowStatus === "disputed").length,
      refunded: sales.filter((s) => s.escrowStatus === "refunded").length,
    }

    return {
      totalOrders: sales.length,
      completedOrders: completed.length,
      pendingOrders: pending.length,
      totalRevenue,
      pendingRevenue,
      topProducts,
      monthlyRevenue,
      maxMonthly,
      escrowBreakdown,
      completionRate: sales.length > 0 ? Math.round((completed.length / sales.length) * 100) : 0,
    }
  }, [sales])

  const statCards = [
    {
      label: "Total Revenue",
      value: `₦${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "green",
      sub: `${stats.completedOrders} completed orders`,
    },
    {
      label: "Pending Revenue",
      value: `₦${stats.pendingRevenue.toLocaleString()}`,
      icon: Clock,
      color: "yellow",
      sub: `${stats.pendingOrders} orders in progress`,
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: "blue",
      sub: `${stats.completionRate}% completion rate`,
    },
    {
      label: "Products Sold",
      value: stats.topProducts.reduce((s, p) => s + p.units, 0),
      icon: Package,
      color: "purple",
      sub: `${stats.topProducts.length} unique products`,
    },
  ]

  if (sales.length === 0) return null

  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-[#118C4C]" />
        <h2 className="text-lg font-bold text-foreground">Sales Analytics</h2>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, sub }) => (
          <Card key={label} className={`border-${color}-200 dark:border-${color}-800`}>
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 mb-3`}>
                <Icon className={`h-4 w-4 text-${color}-600 dark:text-${color}-400`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Revenue (Last 6 Months)</h3>
            <div className="flex items-end gap-2 h-28">
              {stats.monthlyRevenue.map(({ label, amount }) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">
                    {amount > 0 ? `₦${(amount / 1000).toFixed(0)}k` : ""}
                  </span>
                  <div
                    className="w-full bg-[#118C4C] rounded-t-md transition-all"
                    style={{ height: `${(amount / stats.maxMonthly) * 80}px`, minHeight: amount > 0 ? 4 : 0 }}
                  />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-4 w-4 text-[#118C4C]" />
              <h3 className="text-sm font-semibold text-foreground">Top Products by Revenue</h3>
            </div>
            <div className="space-y-3">
              {stats.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No product data yet</p>
              ) : (
                stats.topProducts.map((p, i) => (
                  <div key={p.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium flex items-center gap-1.5">
                        <span className="text-muted-foreground">#{i + 1}</span>
                        {p.name}
                      </span>
                      <span className="text-[#118C4C] font-semibold">₦{p.revenue.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#118C4C] rounded-full"
                        style={{ width: `${(p.revenue / stats.topProducts[0].revenue) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{p.units} units sold</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Escrow Status Breakdown */}
      {Object.values(stats.escrowBreakdown).some((v) => v > 0) && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Escrow Status Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Locked", count: stats.escrowBreakdown.locked, color: "blue" },
                { label: "Released", count: stats.escrowBreakdown.released, color: "green" },
                { label: "Disputed", count: stats.escrowBreakdown.disputed, color: "red" },
                { label: "Refunded", count: stats.escrowBreakdown.refunded, color: "yellow" },
              ].map(({ label, count, color }) => (
                <div key={label} className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-100 dark:border-${color}-800 text-center`}>
                  <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
