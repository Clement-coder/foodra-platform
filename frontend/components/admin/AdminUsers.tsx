"use client"

import { useState } from "react"
import { X, MapPin, Phone, Mail, Wallet, Package, Calendar, Home } from "lucide-react"
import type { AdminData } from "@/app/admin/page"

function UserProfileModal({ user, data, onClose }: { user: any; data: AdminData; onClose: () => void }) {
  const [addresses, setAddresses] = useState<any[] | null>(null)
  const [loadingAddr, setLoadingAddr] = useState(false)

  const loadAddresses = async () => {
    if (addresses !== null) return
    setLoadingAddr(true)
    const res = await fetch(`/api/delivery-addresses?userId=${user.id}`)
    setAddresses(res.ok ? await res.json() : [])
    setLoadingAddr(false)
  }

  // Load on mount
  if (addresses === null && !loadingAddr) loadAddresses()

  const userProducts = data.products.filter((p: any) => p.farmer_id === user.id)
  const userOrders = data.orders.filter((o: any) => o.buyer_id === user.id)
  const userFunding = data.funding.filter((f: any) => f.user_id === user.id)
  const userEnrollments = data.enrollments.filter((e: any) => e.user_id === user.id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">User Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Identity */}
          <div className="flex items-center gap-4">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-green-500" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300 text-2xl font-bold">
                {(user.name || "U")[0].toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user.name || "—"}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                user.role === "admin" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                : user.role === "farmer" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              }`}>{user.role || "buyer"}</span>
            </div>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{user.email || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.phone || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Location</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.location || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Wallet className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Wallet</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white font-mono truncate">{user.wallet_address ? `${user.wallet_address.slice(0, 10)}…${user.wallet_address.slice(-6)}` : "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Joined</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Products", value: userProducts.length, color: "green" },
              { label: "Orders", value: userOrders.length, color: "blue" },
              { label: "Funding", value: userFunding.length, color: "yellow" },
              { label: "Trainings", value: userEnrollments.length, color: "purple" },
            ].map(({ label, value, color }) => (
              <div key={label} className={`p-3 rounded-xl text-center bg-${color}-50 dark:bg-${color}-900/20`}>
                <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          {/* Delivery Addresses */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Home className="w-4 h-4" /> Delivery Addresses
            </h4>
            {loadingAddr ? (
              <div className="text-sm text-gray-400 py-2">Loading…</div>
            ) : addresses && addresses.length > 0 ? (
              <div className="space-y-2">
                {addresses.map((addr: any) => (
                  <div key={addr.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{addr.fullName}</span>
                      {addr.isDefault && <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">Default</span>}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">{addr.addressLine}{addr.streetLine2 ? `, ${addr.streetLine2}` : ""}</p>
                    {addr.landmark && <p className="text-gray-400 text-xs">Near: {addr.landmark}</p>}
                    <p className="text-gray-500 dark:text-gray-400">{addr.city}, {addr.state}, {addr.country}</p>
                    <p className="text-gray-400 text-xs mt-1">{addr.phone}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-2">No delivery addresses saved</p>
            )}
          </div>

          {/* Products */}
          {userProducts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" /> Listed Products
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {userProducts.map((p: any) => (
                  <div key={p.id} className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-20 object-cover" />
                    ) : (
                      <div className="w-full h-20 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xs">No image</div>
                    )}
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">₦{Number(p.price).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Funding applications */}
          {userFunding.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Funding Applications</h4>
              <div className="space-y-2">
                {userFunding.map((f: any) => (
                  <div key={f.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">₦{Number(f.amount_requested).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{f.farm_type} • {f.years_of_experience}yr exp</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      f.status === "Approved" ? "bg-green-100 text-green-700" : f.status === "Rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    }`}>{f.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminUsers({
  data, privyId, onRefresh, onNotify
}: { data: AdminData; privyId?: string; onRefresh: () => void; onNotify: (m: string) => void }) {
  const [selectedUser, setSelectedUser] = useState<any | null>(null)

  const updateRole = async (userId: string, role: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorPrivyId: privyId, userId, role }),
    })
    onNotify("Role updated")
    onRefresh()
  }

  return (
    <>
      {selectedUser && <UserProfileModal user={selectedUser} data={data} onClose={() => setSelectedUser(null)} />}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Email</th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">Phone</th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">Location</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">Joined</th>
              <th className="px-4 py-3 text-left">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.users.map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300 text-xs font-bold flex-shrink-0">
                        {(u.name || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-gray-900 dark:text-white truncate max-w-[100px]">{u.name || "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell truncate max-w-[160px]">{u.email || "—"}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">{u.phone || "—"}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">{u.location || "—"}</td>
                <td className="px-4 py-3">
                  <select value={u.role || "buyer"} onChange={e => updateRole(u.id, e.target.value)}
                    className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="buyer">Buyer</option>
                    <option value="farmer">Farmer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelectedUser(u)}
                    className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 px-3 py-1.5 rounded-lg transition-colors font-medium">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
