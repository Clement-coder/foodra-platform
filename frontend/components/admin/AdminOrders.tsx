import type { AdminData } from "@/app/admin/page"

export default function AdminOrders({ data }: { data: AdminData }) {
  return (
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
                }`}>{o.status}</span>
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{new Date(o.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
