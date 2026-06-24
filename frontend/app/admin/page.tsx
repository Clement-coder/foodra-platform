"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { useUser } from "@/lib/useUser"
import withAuth from "@/components/withAuth"
import { Users, Package, DollarSign, ShoppingBag, MessageSquare, BookOpen, BarChart2, Wallet, AlertTriangle } from "lucide-react"
import AdminUsers from "@/components/admin/AdminUsers"
import AdminProducts from "@/components/admin/AdminProducts"
import AdminFunding from "@/components/admin/AdminFunding"
import AdminOrders from "@/components/admin/AdminOrders"
import AdminSupport, { getUnreadSupportCount } from "@/components/admin/AdminSupport"
import AdminTrainings from "@/components/admin/AdminTrainings"
import AdminAnalytics from "@/components/admin/AdminAnalytics"
import AdminWalletRequests from "@/components/admin/AdminWalletRequests"
import AdminDisputes from "@/components/admin/AdminDisputes"
import { useToast } from "@/lib/toast"
import { authFetch } from "@/lib/authFetch"

export type AdminData = {
  users: any[]
  products: any[]
  funding: any[]
  orders: any[]
  enrollments: any[]
  supportMessages: any[]
  trainings: any[]
  walletRequests: any[]
  disputes: any[]
  walletTransactions: any[]
  walletAccounts: any[]
  paystackPayments: any[]
}

type Tab = "analytics" | "users" | "products" | "orders" | "wallet" | "funding" | "disputes" | "trainings" | "support"

function AdminPage() {
  const { user: privyUser, getAccessToken } = usePrivy()
  const { currentUser } = useUser()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>("analytics")
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    if (!privyUser?.id) return
    const res = await authFetch(getAccessToken, `/api/admin/stats`)
    if (res.ok) setData(await res.json())
  }

  useEffect(() => {
    if (!privyUser?.id) return
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [privyUser?.id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#118C4C]" />
    </div>
  )

  if (!data || (currentUser?.role !== "admin" && currentUser?.role !== "owner")) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    </div>
  )

  const pendingWithdrawals = (data.walletRequests || []).filter((r: any) => r.status === "pending").length
  const pendingFunding = data.funding.filter((f: any) => f.status === "Pending").length
  const openDisputes = (data.disputes || []).filter((d: any) => d.status === "open").length
  const unreadSupport = getUnreadSupportCount(data.supportMessages)

  const tabs: { key: Tab; label: string; icon: any; badge?: number }[] = [
    { key: "analytics",  label: "Analytics",  icon: BarChart2 },
    { key: "users",      label: "Users",       icon: Users },
    { key: "products",   label: "Products",    icon: Package },
    { key: "orders",     label: "Orders",      icon: ShoppingBag },
    { key: "wallet",     label: "Withdrawals", icon: Wallet,        badge: pendingWithdrawals },
    { key: "funding",    label: "Funding",     icon: DollarSign,    badge: pendingFunding },
    { key: "disputes",   label: "Disputes",    icon: AlertTriangle, badge: openDisputes },
    { key: "trainings",  label: "Trainings",   icon: BookOpen },
    { key: "support",    label: "Support",     icon: MessageSquare, badge: unreadSupport },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-3 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <button onClick={refresh} className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors">↺ Refresh</button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map(({ key, label, icon: Icon, badge }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              tab === key
                ? "bg-[#118C4C] text-white shadow-md"
                : "bg-white dark:bg-gray-900 text-muted-foreground hover:text-foreground border border-border"
            }`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
            {badge != null && badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">{badge}</span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-border overflow-hidden">
        {tab === "analytics" && <AdminAnalytics data={data} privyId={privyUser?.id} />}
        {tab === "users"     && <AdminUsers data={data} privyId={privyUser?.id} onRefresh={refresh} onNotify={msg => toast.success(msg)} />}
        {tab === "products"  && <AdminProducts data={data} privyId={privyUser?.id} onRefresh={refresh} onNotify={msg => toast.success(msg)} />}
        {tab === "orders"    && <AdminOrders data={data} privyId={privyUser?.id} onRefresh={refresh} onNotify={msg => toast.success(msg)} />}
        {tab === "wallet"    && <AdminWalletRequests data={data} privyId={privyUser?.id} onRefresh={refresh} />}
        {tab === "funding"   && <AdminFunding data={data} privyId={privyUser?.id} onRefresh={refresh} onNotify={msg => toast.success(msg)} />}
        {tab === "disputes"  && <AdminDisputes data={data} privyId={privyUser?.id} onRefresh={refresh} />}
        {tab === "trainings" && <AdminTrainings data={data} privyId={privyUser?.id} onRefresh={refresh} onNotify={msg => toast.success(msg)} />}
        {tab === "support"   && <AdminSupport data={data} privyId={privyUser?.id} onRefresh={refresh} />}
      </div>
    </div>
  )
}

export default withAuth(AdminPage)
