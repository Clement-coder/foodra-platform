import { Image as ImageIcon } from "lucide-react"
import type { AdminData } from "@/app/admin/page"

export default function AdminProducts({ data }: { data: AdminData }) {
  return (
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
                    <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
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
  )
}
