"use client"

import { useState } from "react"
import { Image as ImageIcon, X, MapPin, Calendar, Trash2, EyeOff, Eye } from "lucide-react"
import type { AdminData } from "@/app/admin/page"
import { useToast } from "@/lib/toast"

function ProductModal({ product, farmer, privyId, onClose, onRefresh }: {
  product: any; farmer: any; privyId?: string
  onClose: () => void; onRefresh: () => void
}) {
  const { toast, confirm } = useToast()
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    const ok = await confirm({ message: `${product.is_available ? "Deactivate" : "Activate"} this product?`, confirmLabel: product.is_available ? "Deactivate" : "Activate", danger: product.is_available })
    if (!ok) return
    setLoading(true)
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorPrivyId: privyId, is_available: !product.is_available }),
    })
    if (res.ok) { toast.success(product.is_available ? "Product deactivated" : "Product activated"); onRefresh(); onClose() }
    else toast.error("Failed to update product.")
    setLoading(false)
  }

  const remove = async () => {
    const ok = await confirm({ title: "Delete Product", message: "This will permanently delete the product. This cannot be undone.", confirmLabel: "Delete", danger: true })
    if (!ok) return
    setLoading(true)
    const res = await fetch(`/api/products/${product.id}?actorPrivyId=${privyId}`, { method: "DELETE" })
    if (res.ok) { toast.success("Product deleted"); onRefresh(); onClose() }
    else toast.error("Failed to delete product.")
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold">Product Details</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          {product.image_url
            ? <img src={product.image_url} alt={product.name} className="w-full h-52 object-cover rounded-xl" />
            : <div className="w-full h-52 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center"><ImageIcon className="w-10 h-10 text-gray-400" /></div>
          }
          <div>
            <h3 className="text-xl font-bold">{product.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{product.category}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"><p className="text-xs text-gray-400">Price</p><p className="text-sm font-bold">₦{Number(product.price).toLocaleString()}</p></div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"><p className="text-xs text-gray-400">Quantity</p><p className="text-sm font-bold">{product.quantity} units</p></div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" /><div><p className="text-xs text-gray-400">Location</p><p className="text-sm font-medium">{product.location || "—"}</p></div></div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" /><div><p className="text-xs text-gray-400">Listed</p><p className="text-sm font-medium">{new Date(product.created_at).toLocaleDateString()}</p></div></div>
          </div>
          {farmer && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">Farmer</p>
              <div className="flex items-center gap-3">
                {farmer.avatar_url ? <img src={farmer.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-green-500" /> : <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">{(farmer.name || "F")[0].toUpperCase()}</div>}
                <div><p className="text-sm font-medium">{farmer.name || "—"}</p><p className="text-xs text-gray-400">{farmer.email || "—"}</p></div>
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button onClick={toggle} disabled={loading} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${product.is_available ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>
              {product.is_available ? <><EyeOff className="w-4 h-4" />Deactivate</> : <><Eye className="w-4 h-4" />Activate</>}
            </button>
            <button onClick={remove} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50">
              <Trash2 className="w-4 h-4" />Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminProducts({ data, privyId, onRefresh, onNotify }: {
  data: AdminData; privyId?: string; onRefresh: () => void; onNotify: (m: string) => void
}) {
  const [selected, setSelected] = useState<any | null>(null)
  const getFarmer = (id: string) => data.users.find((u: any) => u.id === id)

  return (
    <>
      {selected && <ProductModal product={selected} farmer={getFarmer(selected.farmer_id)} privyId={privyId} onClose={() => setSelected(null)} onRefresh={onRefresh} />}
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
              <th className="px-4 py-3 text-left">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.products.map((p: any) => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3"><div className="flex items-center gap-2">{p.image_url ? <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0"><ImageIcon className="w-4 h-4 text-gray-400" /></div>}<span className="font-medium truncate max-w-[120px]">{p.name}</span></div></td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{p.category}</td>
                <td className="px-4 py-3 font-medium">₦{Number(p.price).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.quantity}</td>
                <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{p.location || "—"}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${p.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{p.is_available ? "Active" : "Inactive"}</span></td>
                <td className="px-4 py-3"><button onClick={() => setSelected(p)} className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-700 hover:text-green-700 px-3 py-1.5 rounded-lg transition-colors font-medium">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
