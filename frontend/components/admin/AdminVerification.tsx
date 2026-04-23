"use client"

import { useState } from "react"
import { ShieldCheck } from "lucide-react"
import { usePrivy } from "@privy-io/react-auth"
import type { AdminData } from "@/app/admin/page"
import { useToast } from "@/lib/toast"
import { authFetch } from "@/lib/authFetch"

export default function AdminVerification({ data, onRefresh }: { data: AdminData; onRefresh: () => void }) {
  const { getAccessToken } = usePrivy()
  const { toast } = useToast()
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const requests = data.verificationRequests || []

  const updateStatus = async (requestId: string, status: "Approved" | "Rejected") => {
    const res = await authFetch(getAccessToken, "/api/verification", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        status,
        adminNote: notes[requestId] || "",
      }),
    })

    if (res.ok) {
      toast.success(status === "Approved" ? "Verification approved" : "Verification rejected")
      setRejectingId(null)
      onRefresh()
    } else {
      const error = await res.json().catch(() => ({}))
      toast.error(error.error || "Failed to update verification request")
    }
  }

  if (!requests.length) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No verification requests yet</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {requests.map((request: any) => (
        <div key={request.id} className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground">{request.users?.name || "Unknown farmer"}</p>
              <p className="text-sm text-muted-foreground">{request.users?.email || "No email"}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              request.status === "Approved"
                ? "bg-green-100 text-green-700"
                : request.status === "Rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
            }`}>
              {request.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">ID Type</p>
              <p className="font-medium">{request.id_type}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">ID Number</p>
              <p className="font-medium">{request.id_number}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Farm Size</p>
              <p className="font-medium">{request.farm_size} hectares</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Submitted</p>
              <p className="font-medium">{new Date(request.submitted_at).toLocaleDateString()}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 sm:col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Farm Address</p>
              <p className="font-medium">{request.farm_address}</p>
            </div>
          </div>

          {request.status === "Pending" ? (
            <div className="space-y-2">
              {rejectingId === request.id ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={notes[request.id] || ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [request.id]: e.target.value }))}
                    placeholder="Reason for rejection"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(request.id, "Rejected")} className="px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-medium">
                      Confirm Reject
                    </button>
                    <button onClick={() => setRejectingId(null)} className="px-3 py-2 rounded-xl bg-muted text-sm font-medium">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(request.id, "Approved")} className="px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-medium">
                    Approve
                  </button>
                  <button onClick={() => setRejectingId(request.id)} className="px-3 py-2 rounded-xl bg-red-100 text-red-700 text-sm font-medium">
                    Reject
                  </button>
                </div>
              )}
            </div>
          ) : request.admin_note ? (
            <p className="text-sm text-muted-foreground">Admin note: {request.admin_note}</p>
          ) : null}
        </div>
      ))}
    </div>
  )
}
