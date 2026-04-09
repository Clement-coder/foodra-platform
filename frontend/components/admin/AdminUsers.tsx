"use client"

import { useState } from "react"
import { X, MapPin, Phone, Mail, Wallet, Package, Calendar, Home, Download, Send } from "lucide-react"
import type { AdminData } from "@/app/admin/page"
import { useToast } from "@/lib/toast"
import { CustomSelect } from "@/components/CustomSelect"

function UserProfileModal({ user, data, onClose, privyId }: { user: any; data: AdminData; onClose: () => void; privyId?: string }) {
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<any[] | null>(null)
  const [loadingAddr, setLoadingAddr] = useState(false)
  const [msgText, setMsgText] = useState("")
  const [sending, setSending] = useState(false)

  const loadAddresses = async () => {
    if (addresses !== null) return
    setLoadingAddr(true)
    const res = await fetch(`/api/delivery-addresses?userId=${user.id}`)
    setAddresses(res.ok ? await res.json() : [])
    setLoadingAddr(false)
  }

  const sendMessage = async () => {
    if (!msgText.trim()) return
    setSending(true)
    const res = await fetch("/api/admin/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorPrivyId: privyId, targetUserId: user.id, message: msgText }),
    })
    setSending(false)
    if (res.ok) { toast.success("Message sent!"); setMsgText("") }
    else toast.error("Failed to send message.")
  }

  // Load on mount
  if (addresses === null && !loadingAddr) loadAddresses()

  const userProducts = data.products.filter((p: any) => p.farmer_id === user.id)
  const userOrders = data.orders.filter((o: any) => o.buyer_id === user.id)
  const userFunding = data.funding.filter((f: any) => f.user_id === user.id)
  const userEnrollments = data.enrollments.filter((e: any) => e.user_id === user.id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card dark:bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-card dark:bg-card border-b border-border dark:border-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-foreground dark:text-white">User Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted dark:hover:bg-gray-800 rounded-lg transition-colors">
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
              <h3 className="text-xl font-bold text-foreground dark:text-white">{user.name || "—"}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                user.role === "admin" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                : user.role === "farmer" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              }`}>{user.role || "buyer"}</span>
            </div>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-muted bg-card rounded-xl">
              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground dark:text-white break-all">{user.email || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted bg-card rounded-xl">
              <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium text-foreground dark:text-white">{user.phone || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted bg-card rounded-xl">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium text-foreground dark:text-white">{user.location || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted bg-card rounded-xl">
              <Wallet className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Wallet</p>
                <p className="text-sm font-medium text-foreground dark:text-white font-mono truncate">{user.wallet_address ? `${user.wallet_address.slice(0, 10)}…${user.wallet_address.slice(-6)}` : "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted bg-card rounded-xl">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="text-sm font-medium text-foreground dark:text-white">{new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
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
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Delivery Addresses */}
          <div>
            <h4 className="text-sm font-semibold text-foreground text-foreground mb-3 flex items-center gap-2">
              <Home className="w-4 h-4" /> Delivery Addresses
            </h4>
            {loadingAddr ? (
              <div className="text-sm text-muted-foreground py-2">Loading…</div>
            ) : addresses && addresses.length > 0 ? (
              <div className="space-y-2">
                {addresses.map((addr: any) => (
                  <div key={addr.id} className="p-3 border border-border dark:border-border rounded-xl text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground dark:text-white">{addr.fullName}</span>
                      {addr.isDefault && <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">Default</span>}
                    </div>
                    <p className="text-muted-foreground dark:text-muted-foreground">{addr.addressLine}{addr.streetLine2 ? `, ${addr.streetLine2}` : ""}</p>
                    {addr.landmark && <p className="text-muted-foreground text-xs">Near: {addr.landmark}</p>}
                    <p className="text-muted-foreground dark:text-muted-foreground">{addr.city}, {addr.state}, {addr.country}</p>
                    <p className="text-muted-foreground text-xs mt-1">{addr.phone}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">No delivery addresses saved</p>
            )}
          </div>

          {/* Products */}
          {userProducts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground text-foreground mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" /> Listed Products
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {userProducts.map((p: any) => (
                  <div key={p.id} className="rounded-xl overflow-hidden border border-border dark:border-border">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-20 object-cover" />
                    ) : (
                      <div className="w-full h-20 bg-muted bg-card flex items-center justify-center text-muted-foreground text-xs">No image</div>
                    )}
                    <div className="p-2">
                      <p className="text-xs font-medium text-foreground dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">₦{Number(p.price).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message user */}
          <div>
            <h4 className="text-sm font-semibold text-foreground text-foreground mb-2 flex items-center gap-2">
              <Send className="w-4 h-4" /> Send Message to User
            </h4>
            <div className="flex gap-2">
              <input
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 text-sm border border-border dark:border-border rounded-xl px-3 py-2 bg-card bg-card focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button onClick={sendMessage} disabled={sending || !msgText.trim()}
                className="text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors">
                {sending ? "…" : "Send"}
              </button>
            </div>
          </div>

          {/* Funding applications */}
          {userFunding.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground text-foreground mb-3">Funding Applications</h4>
              <div className="space-y-2">
                {userFunding.map((f: any) => (
                  <div key={f.id} className="p-3 border border-border dark:border-border rounded-xl text-sm flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground dark:text-white">₦{Number(f.amount_requested).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{f.farm_type} • {f.years_of_experience}yr exp</p>
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

const PAGE_SIZE = 20

function exportCSV(users: any[]) {
  const headers = ["Name", "Email", "Phone", "Location", "Role", "Wallet", "Joined"]
  const rows = users.map(u => [u.name, u.email, u.phone, u.location, u.role || "buyer", u.wallet_address, new Date(u.created_at).toLocaleDateString()])
  const csv = [headers, ...rows].map(r => r.map((v: any) => `"${v ?? ""}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = "users.csv"; a.click()
  URL.revokeObjectURL(url)
}

export default function AdminUsers({
  data, privyId, onRefresh, onNotify
}: { data: AdminData; privyId?: string; onRefresh: () => void; onNotify: (m: string) => void }) {
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)

  const updateRole = async (userId: string, role: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorPrivyId: privyId, userId, role }),
    })
    onNotify("Role updated")
    onRefresh()
  }

  const filtered = data.users.filter((u: any) => {
    const q = search.toLowerCase()
    return !q || (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.location || "").toLowerCase().includes(q)
  })
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <>
      {selectedUser && <UserProfileModal user={selectedUser} data={data} onClose={() => setSelectedUser(null)} privyId={privyId} />}
      <div className="px-4 py-3 border-b border-border dark:border-border flex items-center gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search by name, email, location…"
          className="flex-1 text-sm border border-border dark:border-border rounded-xl px-3 py-2 bg-card bg-card focus:outline-none focus:ring-2 focus:ring-green-500" />
        <button onClick={() => exportCSV(filtered)}
          className="flex items-center gap-1.5 text-sm bg-muted bg-card hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground text-foreground px-3 py-2 rounded-xl transition-colors">
          <Download className="w-4 h-4" />Export
        </button>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} users</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted bg-card text-muted-foreground dark:text-muted-foreground">
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
            {paged.map((u: any) => (
              <tr key={u.id} className="hover:bg-muted dark:hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300 text-xs font-bold flex-shrink-0">
                        {(u.name || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-foreground dark:text-white truncate max-w-[100px]">{u.name || "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground dark:text-muted-foreground hidden md:table-cell truncate max-w-[160px]">{u.email || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground dark:text-muted-foreground hidden lg:table-cell">{u.phone || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground dark:text-muted-foreground hidden lg:table-cell">{u.location || "—"}</td>
                <td className="px-4 py-3">
                  <CustomSelect
                    value={u.role || "buyer"}
                    onChange={(v) => updateRole(u.id, v)}
                    options={[
                      { value: "buyer", label: "Buyer" },
                      { value: "farmer", label: "Farmer" },
                      { value: "admin", label: "Admin" },
                    ]}
                    className="w-28"
                  />
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelectedUser(u)}
                    className="text-xs bg-muted bg-card hover:bg-green-100 dark:hover:bg-green-900/30 text-foreground text-foreground hover:text-green-700 dark:hover:text-green-400 px-3 py-1.5 rounded-lg transition-colors font-medium">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border dark:border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="px-3 py-1.5 rounded-lg bg-muted bg-card disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700">Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="px-3 py-1.5 rounded-lg bg-muted bg-card disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700">Next</button>
          </div>
        </div>
      )}
    </>
  )
}
