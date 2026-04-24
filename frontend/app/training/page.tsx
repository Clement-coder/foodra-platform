"use client"

import { useState, useEffect, useMemo } from "react"
import { GraduationCap, Search } from "lucide-react"
import { motion } from "framer-motion"
import { TrainingCard } from "@/components/TrainingCard"
import { Skeleton } from "@/components/Skeleton"
import { Button } from "@/components/ui/button"
import type { Training } from "@/lib/types"
import withAuth from "../../components/withAuth"

function TrainingPage() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch('/api/trainings')
      .then(r => r.json())
      .then(data => setTrainings(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredTrainings = useMemo(() => trainings.filter((t) => {
    const matchMode = filter === "all" || t.mode === filter
    const q = search.toLowerCase()
    const matchSearch = !q || t.title.toLowerCase().includes(q) || t.instructor.toLowerCase().includes(q) || (t.location || "").toLowerCase().includes(q)
    return matchMode && matchSearch
  }), [trainings, filter, search])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[#118C4C]/10 p-3 rounded-lg">
            <GraduationCap className="h-8 w-8 text-[#118C4C]" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Training Programs</h1>
            <p className="text-muted-foreground">Learn from experts and improve your farming skills</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, instructor, location…"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C] focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "online", "offline"] as const).map((f) => (
              <Button key={f} variant={filter === f ? "default" : "outline"} size="sm"
                onClick={() => setFilter(f)}
                className={filter === f ? "bg-[#118C4C] hover:bg-[#0d6d3a] text-white" : "bg-transparent hover:bg-accent"}>
                {f === "all" ? "All" : f === "online" ? "Online" : "In-Person"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
              <div className="h-48 bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-2 bg-muted rounded-full w-full mt-2" />
                <div className="h-10 bg-muted rounded-lg mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTrainings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">{search ? `No trainings found for "${search}".` : "No training programs available at the moment."}</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrainings.map((training) => (
              <TrainingCard key={training.id} training={training} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default withAuth(TrainingPage)
