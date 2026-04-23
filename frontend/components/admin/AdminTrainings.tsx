"use client"

import { useState, useRef } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { Plus, Pencil, Trash2, X, Users, ImageIcon } from "lucide-react"
import type { AdminData } from "@/app/admin/page"
import { CustomSelect } from "@/components/CustomSelect"
import { useToast } from "@/lib/toast"
import { authFetch } from "@/lib/authFetch"

const EMPTY = { title: "", summary: "", description: "", date: "", mode: "online", location: "", instructor: "", capacity: 20 }

function TrainingForm({ initial, privyId, onDone, onNotify }: {
  initial?: any; privyId?: string; onDone: () => void; onNotify: (m: string) => void
}) {
  const { toast } = useToast()
  const { getAccessToken } = usePrivy()
  const [form, setForm] = useState(initial ? {
    title: initial.title, summary: initial.summary || "", description: initial.description || "",
    date: initial.date?.slice(0, 16) || "", mode: initial.mode || "online",
    location: initial.location || "", instructor: initial.instructor_name || "", capacity: initial.capacity,
    image_url: initial.image_url || ""
  } : { ...EMPTY, image_url: "" })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const res = await authFetch(getAccessToken, "/api/storage/product-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64, fileName: file.name }),
    })
    if (res.ok) {
      const { imageUrl } = await res.json()
      set("image_url", imageUrl)
    } else {
      toast.error("Failed to upload image.")
    }
    setUploading(false)
    e.target.value = ""
  }

  const save = async () => {
    if (!form.title || !form.date || !form.capacity) return
    setSaving(true)
    const method = initial ? "PATCH" : "POST"
    const res = await authFetch(getAccessToken, "/api/trainings", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ...(initial ? { id: initial.id } : {}) }),
    })
    if (res.ok) { toast.success(initial ? "Training updated" : "Training created"); onDone() }
    else toast.error("Failed to save training.")
    setSaving(false)
  }

  return (
    <div className="p-5 space-y-3">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
      {/* Image upload */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Training Image</label>
        <div className="flex items-center gap-3">
          {form.image_url
            ? <img src={form.image_url} alt="" className="w-20 h-14 rounded-xl object-cover border border-border dark:border-border" />
            : <div className="w-20 h-14 rounded-xl bg-muted bg-card flex items-center justify-center border border-border dark:border-border"><ImageIcon className="w-5 h-5 text-muted-foreground" /></div>
          }
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="text-sm px-3 py-1.5 rounded-xl bg-muted bg-card hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground text-foreground transition-colors disabled:opacity-50">
            {uploading ? "Uploading…" : form.image_url ? "Change Image" : "Upload Image"}
          </button>
          {form.image_url && (
            <button type="button" onClick={() => set("image_url", "")} className="text-xs text-red-500 hover:underline">Remove</button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { label: "Title *", key: "title", type: "text" },
          { label: "Instructor", key: "instructor", type: "text" },
          { label: "Date & Time *", key: "date", type: "datetime-local" },
          { label: "Capacity *", key: "capacity", type: "number" },
          { label: "Location", key: "location", type: "text" },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
            <input type={type} value={(form as any)[key]} onChange={e => set(key, type === "number" ? Number(e.target.value) : e.target.value)}
              className="w-full text-sm border border-border dark:border-border rounded-xl px-3 py-2 bg-card bg-card focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        ))}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Mode</label>
          <CustomSelect
            value={form.mode}
            onChange={(v) => set("mode", v)}
            options={[{ value: "online", label: "Online" }, { value: "offline", label: "Offline" }]}
            className="w-full"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Summary</label>
        <input type="text" value={form.summary} onChange={e => set("summary", e.target.value)}
          className="w-full text-sm border border-border dark:border-border rounded-xl px-3 py-2 bg-card bg-card focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Description</label>
        <textarea rows={3} value={form.description} onChange={e => set("description", e.target.value)}
          className="w-full text-sm border border-border dark:border-border rounded-xl px-3 py-2 bg-card bg-card focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={save} disabled={saving || !form.title || !form.date}
          className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors">
          {saving ? "Saving…" : initial ? "Update Training" : "Create Training"}
        </button>
        <button onClick={onDone} className="px-4 py-2 bg-muted bg-card text-foreground text-foreground rounded-xl text-sm hover:bg-gray-200 transition-colors">Cancel</button>
      </div>
    </div>
  )
}

export default function AdminTrainings({ data, privyId, onRefresh, onNotify }: {
  data: AdminData; privyId?: string; onRefresh: () => void; onNotify: (m: string) => void
}) {
  const { toast, confirm } = useToast()
  const { getAccessToken } = usePrivy()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const remove = async (id: string) => {
    const ok = await confirm({ title: "Delete Training", message: "Delete this training and all its enrollments?", confirmLabel: "Delete", danger: true })
    if (!ok) return
    const res = await authFetch(getAccessToken, `/api/trainings?id=${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Training deleted"); onRefresh() }
    else toast.error("Failed to delete training.")
  }

  const getEnrolled = (id: string) => data.enrollments.filter((e: any) => e.training_id === id).length

  return (
    <div>
      <div className="px-5 py-4 border-b border-border dark:border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground dark:text-white">Training Programs</h3>
        <button onClick={() => { setCreating(true); setEditing(null) }}
          className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />New Training
        </button>
      </div>

      {creating && (
        <div className="border-b border-border dark:border-border bg-green-50 dark:bg-green-900/10">
          <TrainingForm privyId={privyId} onDone={() => { setCreating(false); onRefresh() }} onNotify={onNotify} />
        </div>
      )}

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {data.trainings.length === 0 && (
          <div className="p-12 text-center text-muted-foreground text-sm">No trainings yet. Create one above.</div>
        )}
        {data.trainings.map((t: any) => (
          <div key={t.id}>
            <div className="px-5 py-4 flex items-start gap-4">
              {t.image_url && <img src={t.image_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground dark:text-white">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.instructor_name} · {t.mode} · {new Date(t.date).toLocaleDateString()}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {getEnrolled(t.id)} / {t.capacity} enrolled
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setEditing(editing?.id === t.id ? null : t); setCreating(false) }}
                      className="p-1.5 rounded-lg bg-muted bg-card hover:bg-blue-100 dark:hover:bg-blue-900/30 text-muted-foreground hover:text-blue-600 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => remove(t.id)}
                      className="p-1.5 rounded-lg bg-muted bg-card hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {editing?.id === t.id && (
              <div className="border-t border-border dark:border-border bg-blue-50 dark:bg-blue-900/10">
                <TrainingForm initial={t} privyId={privyId} onDone={() => { setEditing(null); onRefresh() }} onNotify={onNotify} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
