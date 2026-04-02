"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { useUser } from "@/lib/useUser"
import withAuth from "@/components/withAuth"
import { Users, Package, DollarSign, ShoppingBag, MessageSquare, ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react"

type Tab = "users" | "products" | "funding" | "orders" | "support"

function AdminPage() {
  const { user: privyUser } = usePrivy()
  const { currentUser } = useUser()
  const [tab, setTab] = useState<Tab>("users")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSupport, setExpandedSupport] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replying, setReplying] = useState(false)
  const [notification, setNotification] = useState("")

  useEffect(() => {
    if (!privyUser?.id) return
    setLoading(true)
    fetch(`/api/admin/stats?actorPrivyId=${privyUser.id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [privyUser?.id])

  const updateRole = async (userId: string, role: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorPrivyId: privyUser?.id, userId, role }),
    })
    setNotification("Role updated")
    setTimeout(() => setNotification(""), 2000)
    // refresh
    const res = await fetch(`/api/admin/stats?actorPrivyId=${privyUser?.id}`)
    setData(await res.json())
  }

  const updateFundingStatus = async (applicationId: string, status: string) => {
    await fetch("/api/funding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status, actorPrivyId: privyUser?.id }),
    })
    setNotification("Status updated")
    setTimeout(() => setNotification(""), 2000)
    const res = await fetch(`/api/admin/stats?actorPrivyId=${privyUser?.id}`)
    setData(await res.json())
  }

  const sendReply = async (userId: string) => {
    if (!replyText.trim()) return
    setReplying(true)
    await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, message: replyText, isAdminReply: true }),
    })
    setReplyText("")
    setReplying(false)
    const res = await fetch(`/api/admin/stats?actorPrivyId=${privyUser?.id}`)
    setData(await res.json())
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
    </div>
  )

  if (!data || currentUser?.role !== "admin") return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Access denied
    </div>
  )

  const tabs: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: "users", label: "Users", icon: Users, count: data.users?.length || 0 },
    { key: "products", label: "Products", icon: Package, count: data.products?.length || 0 },
    { key: "funding", label: "Funding", icon: DollarSign, count: data.funding?.length || 0 },
    { key: "orders", label: "Orders", icon: ShoppingBag, count: data.orders?.length || 0 },
    { key: "support", label: "Support", icon: MessageSquare, count: data.supportMessages?.length || 0 },
  ]

  // Group support messages by user
  const supportByUser: Record<string, any[]> = {}
  for (const msg of data.supportMessages || []) {
    if (!supportByUser[msg.user_id]) supportByUser[msg.user_id] = []
    supportByUser[msg.user_id].push(msg)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      {notification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg z-50 text-sm">
          {notification}
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Admin Panel</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`p-4 rounded-xl text-left transition-all ${
              tab === key
                ? "bg-green-600 text-white shadow-lg"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-800"
            }`}
          >
            <Icon className="w-5 h-5 mb-1" />
            <div className="text-xl font-bold">{count}</div>
            <div className="text-xs opacity-80">{label}</div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden">
        {/* Users tab */}
        {tab === "users" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Email</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Location</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300 text-xs font-bold">
                            {(u.name || "U")[0].toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-gray-900 dark:text-white truncate max-w-[120px]">{u.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell truncate max-w-[180px]">{u.email || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">{u.location || "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role || "buyer"}
                        onChange={e => updateRole(u.id, e.target.value)}
                        className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="buyer">Buyer</option>
                        <option value="farmer">Farmer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Products tab */}
        {tab === "products" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Category</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Qty</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Location</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900 dark:text-white truncate max-w-[120px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{p.category}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">₦{Number(p.price).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">{p.quantity}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">{p.location || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.is_available ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                        {p.is_available ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Funding tab */}
        {tab === "funding" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left">Applicant</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Farm Type</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Experience</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.funding.map((f: any) => (
                  <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{f.full_name}</div>
                      <div className="text-xs text-gray-400">{f.location}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{f.farm_type}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">₦{Number(f.amount_requested).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">{f.years_of_experience}yr</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        f.status === "Approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : f.status === "Rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {f.status === "Pending" && (
                        <div className="flex gap-1">
                          <button onClick={() => updateFundingStatus(f.id, "Approved")} className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700">Approve</button>
                          <button onClick={() => updateFundingStatus(f.id, "Rejected")} className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Orders tab */}
        {tab === "orders" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left">Order ID</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{o.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">₦{Number(o.total_amount).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        o.status === "Delivered" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : o.status === "Cancelled" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Support tab */}
        {tab === "support" && (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {Object.keys(supportByUser).length === 0 && (
              <div className="p-8 text-center text-gray-400">No support messages yet</div>
            )}
            {Object.entries(supportByUser).map(([userId, messages]) => {
              const user = data.users.find((u: any) => u.id === userId)
              const isOpen = expandedSupport === userId
              return (
                <div key={userId}>
                  <button
                    onClick={() => setExpandedSupport(isOpen ? null : userId)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300 text-xs font-bold">
                          {(user?.name || "U")[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">{user?.name || "Unknown User"}</div>
                        <div className="text-xs text-gray-400">{messages.length} message{messages.length !== 1 ? "s" : ""}</div>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-800/30">
                      <div className="space-y-2 max-h-64 overflow-y-auto py-3">
                        {messages.map((msg: any) => (
                          <div key={msg.id} className={`flex ${msg.is_admin_reply ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${msg.is_admin_reply ? "bg-green-600 text-white" : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"}`}>
                              {msg.image_url && (
                                <img src={msg.image_url} alt="attachment" className="rounded-lg mb-1 max-w-full max-h-40 object-cover" />
                              )}
                              <p>{msg.message}</p>
                              <p className={`text-xs mt-1 ${msg.is_admin_reply ? "text-green-200" : "text-gray-400"}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <input
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && sendReply(userId)}
                          placeholder="Reply to user…"
                          className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={() => sendReply(userId)}
                          disabled={replying}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(AdminPage)
