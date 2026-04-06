"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { useUser } from "@/lib/useUser"
import withAuth from "@/components/withAuth"
import { Users, Package, DollarSign, ShoppingBag, MessageSquare, BookOpen, BarChart2, Wallet } from "lucide-react"
import AdminUsers from "@/components/admin/AdminUsers"
import AdminProducts from "@/components/admin/AdminProducts"
import AdminFunding from "@/components/admin/AdminFunding"
import AdminOrders from "@/components/admin/AdminOrders"
import AdminSupport, { getUnreadSupportCount } from "@/components/admin/AdminSupport"
import AdminTrainings from "@/components/admin/AdminTrainings"
import AdminAnalytics from "@/components/admin/AdminAnalytics"
import AdminWalletRequests from "@/components/admin/AdminWalletRequests"
import { useToast } from "@/lib/toast"

export type AdminData = {
  users: any[]
  products: any[]
  funding: any[]
  orders: any[]
  enrollments: any[]
  supportMessages: any[]
  trainings: any[]
  walletRequests: any[]
}

type Tab = "users" | "products" | "funding" | "orders" | "support" | "trainings" | "analytics" | "wallet"

function AdminPage() {
  const { user: privyUser } = usePrivy()
  const { currentUser } = useUser()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>("users")
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    if (!privyUser?.id) return
    const res = await fetch(`/api/admin/stats?actorPrivyId=${privyUser.id}`)
    if (res.ok) setData(await res.json())
  }

  useEffect(() => {
    if (!privyUser?.id) return
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [privyUser?.id])

  const notify = (msg: string) => toast.success(msg)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
    </div>
  )

  if (!data || currentUser?.role !== "admin") return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">Access denied</div>
  )

  const tabs: { key: Tab; label: string; icon: any; count: number | string; unread?: number }[] = [
    { key: "users", label: "Users", icon: Users, count: data.users.length },
    { key: "products", label: "Products", icon: Package, count: data.products.length },
    { key: "funding", label: "Funding", icon: DollarSign, count: data.funding.length },
    { key: "orders", label: "Orders", icon: ShoppingBag, count: data.orders.length },
    { key: "trainings", label: "Trainings", icon: BookOpen, count: data.trainings.length },
    { key: "support", label: "Support", icon: MessageSquare, count: [...new Set(data.supportMessages.map((m: any) => m.user_id))].length, unread: getUnreadSupportCount(data.supportMessages) },
    { key: "wallet", label: "Wallet", icon: Wallet, count: (data.walletRequests || []).filter((r: any) => r.status === "Pending").length, unread: (data.walletRequests || []).filter((r: any) => r.status === "Pending").length },
    { key: "analytics", label: "Analytics", icon: BarChart2, count: "—" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Admin Panel</h1>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-6">
        {tabs.map(({ key, label, icon: Icon, count, unread }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`relative p-3 rounded-xl text-left transition-all ${tab === key ? "bg-green-600 text-white shadow-lg" : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-800"}`}>
            <Icon className="w-4 h-4 mb-1" />
            <div className="text-lg font-bold">{count}</div>
            <div className="text-xs opacity-80 truncate">{label}</div>
            {unread != null && unread > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread}</span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden">
        {tab === "users" && <AdminUsers data={data} privyId={privyUser?.id} onRefresh={refresh} onNotify={notify} />}
        {tab === "products" && <AdminProducts data={data} privyId={privyUser?.id} onRefresh={refresh} onNotify={notify} />}
        {tab === "funding" && <AdminFunding data={data} privyId={privyUser?.id} onRefresh={refresh} onNotify={notify} />}
        {tab === "orders" && <AdminOrders data={data} privyId={privyUser?.id} onRefresh={refresh} onNotify={notify} />}
        {tab === "trainings" && <AdminTrainings data={data} privyId={privyUser?.id} onRefresh={refresh} onNotify={notify} />}
        {tab === "support" && <AdminSupport data={data} privyId={privyUser?.id} onRefresh={refresh} />}
        {tab === "wallet" && <AdminWalletRequests data={data} privyId={privyUser?.id} onRefresh={refresh} />}
        {tab === "analytics" && <AdminAnalytics data={data} privyId={privyUser?.id} />}
      </div>
    </div>
  )
}

export default withAuth(AdminPage)
