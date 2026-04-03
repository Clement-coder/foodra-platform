import { useState } from "react"
import type { AdminData } from "@/app/admin/page"
import { useToast } from "@/lib/toast"

export default function AdminFunding({ data, privyId, onRefresh, onNotify }: {
  data: AdminData; privyId?: string; onRefresh: () => void; onNotify: (m: string) => void
}) {
  const { toast, confirm } = useToast()
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({})
  const [rejectOpen, setRejectOpen] = useState<string | null>(null)

  const approve = async (id: string) => {
    const ok = await confirm({ message: "Approve this funding application?", confirmLabel: "Approve" })
    if (!ok) return
    const res = await fetch("/api/funding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: id, status: "Approved", actorPrivyId: privyId }),
    })
    if (res.ok) { toast.success("Application approved"); onRefresh() }
    else toast.error("Failed to approve application.")
  }

  const reject = async (id: string) => {
    const res = await fetch("/api/funding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: id, status: "Rejected", note: rejectNote[id] || "", actorPrivyId: privyId }),
    })
    if (res.ok) { toast.success("Application rejected"); setRejectOpen(null); onRefresh() }
    else toast.error("Failed to reject application.")
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
            <>
              <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <div className="font-medium">{f.full_name}</div>
                  <div className="text-xs text-gray-400">{f.location}</div>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{f.farm_type}</td>
                <td className="px-4 py-3 font-medium">₦{Number(f.amount_requested).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{f.years_of_experience}yr</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    f.status === "Approved" ? "bg-green-100 text-green-700"
                    : f.status === "Rejected" ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"}`}>{f.status}</span>
                </td>
                <td className="px-4 py-3">
                  {f.status === "Pending" && (
                    <div className="flex gap-1">
                      <button onClick={() => approve(f.id)} className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700">Approve</button>
                      <button onClick={() => setRejectOpen(rejectOpen === f.id ? null : f.id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
              {rejectOpen === f.id && (
                <tr key={`${f.id}-reject`}>
                  <td colSpan={6} className="px-4 pb-3">
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 space-y-2">
                      <p className="text-xs font-semibold text-red-600">Rejection reason (optional)</p>
                      <textarea
                        value={rejectNote[f.id] || ""}
                        onChange={e => setRejectNote(prev => ({ ...prev, [f.id]: e.target.value }))}
                        placeholder="Enter reason for rejection..."
                        rows={2}
                        className="w-full text-sm bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => reject(f.id)} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">Confirm Reject</button>
                        <button onClick={() => setRejectOpen(null)} className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-300">Cancel</button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
