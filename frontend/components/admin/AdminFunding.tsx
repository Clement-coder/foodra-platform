import { useState } from "react"
import { X, Download } from "lucide-react"
import type { AdminData } from "@/app/admin/page"
import { useToast } from "@/lib/toast"
import { CustomSelect } from "@/components/CustomSelect"
import { CreditScoreCard } from "@/components/CreditScoreCard"

const PAGE_SIZE = 20

function FundingDetailModal({ f, onClose }: { f: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card dark:bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-card dark:bg-card border-b border-border dark:border-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold">Funding Application</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-lg">{f.full_name}</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${f.status === "Approved" ? "bg-green-100 text-green-700" : f.status === "Rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{f.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Phone", value: f.phone_number },
              { label: "Location", value: f.location },
              { label: "Farm Type", value: f.farm_type },
              { label: "Farm Size", value: f.farm_size ? `${f.farm_size} hectares` : "—" },
              { label: "Experience", value: f.years_of_experience ? `${f.years_of_experience} years` : "—" },
              { label: "Amount Requested", value: `₦${Number(f.amount_requested).toLocaleString()}` },
              { label: "Submitted", value: new Date(f.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 bg-muted bg-card rounded-xl">
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className="font-medium text-foreground dark:text-white">{value || "—"}</p>
              </div>
            ))}
          </div>
          {f.expected_outcome && (
            <div className="p-3 bg-muted bg-card rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">Expected Outcome</p>
              <p className="text-foreground text-foreground leading-relaxed">{f.expected_outcome}</p>
            </div>
          )}
          {f.rejection_note && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-500 mb-1">Rejection Reason</p>
              <p className="text-red-700 dark:text-red-300">{f.rejection_note}</p>
            </div>
          )}
          {/* AI Credit Score */}
          <CreditScoreCard
            application={{
              id: f.id,
              userId: f.user_id,
              fullName: f.full_name,
              phoneNumber: f.phone_number,
              location: f.location,
              farmSize: Number(f.farm_size) || 0,
              farmType: f.farm_type || "",
              yearsOfExperience: Number(f.years_of_experience) || 0,
              amountRequested: Number(f.amount_requested) || 0,
              expectedOutcome: f.expected_outcome || "",
              status: f.status,
              submittedAt: f.created_at,
            }}
          />
        </div>
      </div>
    </div>
  )
}

function exportCSV(funding: any[]) {
  const headers = ["Name", "Phone", "Location", "Farm Type", "Farm Size (ha)", "Experience (yr)", "Amount Requested", "Status", "Submitted"]
  const rows = funding.map(f => [
    f.full_name, f.phone_number, f.location, f.farm_type, f.farm_size, f.years_of_experience,
    f.amount_requested, f.status, new Date(f.created_at).toLocaleDateString()
  ])
  const csv = [headers, ...rows].map(r => r.map((v: any) => `"${v ?? ""}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = "funding-applications.csv"; a.click()
  URL.revokeObjectURL(url)
}

export default function AdminFunding({ data, privyId, onRefresh, onNotify }: {
  data: AdminData; privyId?: string; onRefresh: () => void; onNotify: (m: string) => void
}) {
  const { toast, confirm } = useToast()
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({})
  const [rejectOpen, setRejectOpen] = useState<string | null>(null)
  const [viewing, setViewing] = useState<any | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [page, setPage] = useState(0)

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

  const filtered = data.funding.filter((f: any) => {
    const q = search.toLowerCase()
    const matchSearch = !q || (f.full_name || "").toLowerCase().includes(q) || (f.location || "").toLowerCase().includes(q) || (f.farm_type || "").toLowerCase().includes(q)
    const matchStatus = statusFilter === "All" || f.status === statusFilter
    return matchSearch && matchStatus
  })
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <>
      {viewing && <FundingDetailModal f={viewing} onClose={() => setViewing(null)} />}
      <div className="px-4 py-3 border-b border-border dark:border-border flex flex-wrap items-center gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search by name, location, farm type…"
          className="flex-1 min-w-[180px] text-sm border border-border dark:border-border rounded-xl px-3 py-2 bg-card bg-card focus:outline-none focus:ring-2 focus:ring-green-500" />
        <CustomSelect
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(0) }}
          options={[
            { value: "All", label: "All" },
            { value: "Pending", label: "Pending" },
            { value: "Approved", label: "Approved" },
            { value: "Rejected", label: "Rejected" },
          ]}
          className="w-36"
        />
        <button onClick={() => exportCSV(filtered)}
          className="flex items-center gap-1.5 text-sm bg-muted bg-card hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground text-foreground px-3 py-2 rounded-xl transition-colors">
          <Download className="w-4 h-4" />Export
        </button>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} applications</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted bg-card text-muted-foreground dark:text-muted-foreground">
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
            {paged.map((f: any) => (
              <>
                <tr key={f.id} className="hover:bg-muted dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <button onClick={() => setViewing(f)} className="text-left hover:underline">
                      <div className="font-medium">{f.full_name}</div>
                      <div className="text-xs text-muted-foreground">{f.location}</div>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{f.farm_type}</td>
                  <td className="px-4 py-3 font-medium">₦{Number(f.amount_requested).toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{f.years_of_experience}yr</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      f.status === "Approved" ? "bg-green-100 text-green-700"
                      : f.status === "Rejected" ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"}`}>{f.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setViewing(f)} className="text-xs bg-muted bg-card hover:bg-blue-100 dark:hover:bg-blue-900/30 text-foreground hover:text-blue-700 px-2 py-1 rounded-lg">View</button>
                      {f.status === "Pending" && (
                        <>
                          <button onClick={() => approve(f.id)} className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700">Approve</button>
                          <button onClick={() => setRejectOpen(rejectOpen === f.id ? null : f.id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600">Reject</button>
                        </>
                      )}
                    </div>
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
                          className="w-full text-sm bg-card bg-card border border-red-200 dark:border-red-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => reject(f.id)} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">Confirm Reject</button>
                          <button onClick={() => setRejectOpen(null)} className="text-xs bg-gray-200 bg-card text-foreground text-foreground px-3 py-1.5 rounded-lg hover:bg-gray-300">Cancel</button>
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
