import type { AdminData } from "@/app/admin/page"

export default function AdminFunding({
  data, privyId, onRefresh, onNotify
}: { data: AdminData; privyId?: string; onRefresh: () => void; onNotify: (m: string) => void }) {

  const update = async (id: string, status: string) => {
    await fetch("/api/funding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: id, status, actorPrivyId: privyId }),
    })
    onNotify(`Application ${status}`)
    onRefresh()
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3 text-left">Applicant</th>
            <th className="px-4 py-3 text-left hidden sm:table-cell">Farm Type</th>
            <th className="px-4 py-3 text-left">Amount</th>
            <th className="px-4 py-3 text-left hidden md:table-cell">Exp.</th>
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
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">₦{Number(f.amount_requested).toLocaleString()}</td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">{f.years_of_experience}yr</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  f.status === "Approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : f.status === "Rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                }`}>{f.status}</span>
              </td>
              <td className="px-4 py-3">
                {f.status === "Pending" && (
                  <div className="flex gap-1">
                    <button onClick={() => update(f.id, "Approved")} className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700">Approve</button>
                    <button onClick={() => update(f.id, "Rejected")} className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600">Reject</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
