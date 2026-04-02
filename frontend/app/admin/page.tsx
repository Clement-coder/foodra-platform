"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { useUser } from "@/lib/useUser"
import withAuth from "@/components/withAuth"
import { Users, Package, DollarSign, ShoppingBag, MessageSquare } from "lucide-react"
import AdminUsers from "@/components/admin/AdminUsers"
import AdminProducts from "@/components/admin/AdminProducts"
import AdminFunding from "@/components/admin/AdminFunding"
import AdminOrders from "@/components/admin/AdminOrders"
import AdminSupport from "@/components/admin/AdminSupport"

export type AdminData = {
  users: any[]
  products: any[]
  funding: any[]
  orders: any[]
  enrollments: any[]
  supportMessages: any[]
}

type Tab = "users" | "products" | "funding" | "orders" | "support"

function AdminPage() {
  const { user: privyUser } = usePrivy()
  const { currentUser } = useUser()
  const [tab, setTab] = useState<Tab>("users")
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState("")

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

  const notify = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(""), 2500)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
    </div>
  )

  if (!data || currentUser?.role !== "admin") return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">Access denied</div>
  )

  const tabs: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: "users", label: "Users", icon: Users, count: data.users.length },
    { key: "products", label: "Products", icon: Package, count: data.products.length },
    { key: "funding", label: "Funding", icon: DollarSign, count: data.funding.length },
    { key: "orders", label: "Orders", icon: ShoppingBag, count: data.orders.length },
    { key: "support", label: "Support", icon: MessageSquare, count: [...new Set(data.supportMessages.map((m: any) => m.user_id))].length },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      {notification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg z-50 text-sm shadow-lg">
          {notification}
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Admin Panel</h1>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`p-4 rounded-xl text-left transition-all ${tab === key ? "bg-green-600 text-white shadow-lg" : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-800"}`}>
            <Icon className="w-5 h-5 mb-1" />
            <div className="text-xl font-bold">{count}</div>
            <div className="text-xs opacity-80">{label}</div>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden">
        {tab === "users" && <AdminUsers data={data} privyId={privyUser?.id} onRefresh={refresh} onNotify={notify} />}
        {tab === "products" && <AdminProducts data={data} />}
        {tab === "funding" && <AdminFunding data={data} privyId={privyUser?.id} onRefresh={refresh} onNotify={notify} />}
        {tab === "orders" && <AdminOrders data={data} />}
        {tab === "support" && <AdminSupport data={data} privyId={privyUser?.id} onRefresh={refresh} />}
      </div>
    </div>
  )
}

export default withAuth(AdminPage)
