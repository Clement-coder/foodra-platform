"use client"

import { useState, useEffect } from "react"
import { GraduationCap } from "lucide-react"
import { motion } from "framer-motion"
import { TrainingCard } from "@/components/TrainingCard"
import { GridLayout } from "@/components/GridLayout"
import { Skeleton } from "@/components/Skeleton"
import { Button } from "@/components/ui/button"
import type { Training } from "@/lib/types"
import withAuth from "../../components/withAuth";
import { loadFromLocalStorage } from "@/lib/localStorage"

function TrainingPage() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all")

  useEffect(() => {
    const storedTrainings = loadFromLocalStorage<Training[]>("foodra_training", [])
    setTrainings(storedTrainings)
    setLoading(false)
  }, [])

  const filteredTrainings = trainings.filter((training) => {
    if (filter === "all") return true
    return training.mode === filter
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
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

        {/* Filter buttons */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={
              filter === "all" ? "bg-[#118C4C] hover:bg-[#0d6d3a] text-white" : "bg-transparent hover:bg-accent"
            }
          >
            All Training
          </Button>
          <Button
            variant={filter === "online" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("online")}
            className={
              filter === "online" ? "bg-[#118C4C] hover:bg-[#0d6d3a] text-white" : "bg-transparent hover:bg-accent"
            }
          >
            Online
          </Button>
          <Button
            variant={filter === "offline" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("offline")}
            className={
              filter === "offline" ? "bg-[#118C4C] hover:bg-[#0d6d3a] text-white" : "bg-transparent hover:bg-accent"
            }
          >
            In-Person
          </Button>
        </div>
      </div>

      {/* Training Grid */}
      {loading ? (
        <GridLayout>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </GridLayout>
      ) : filteredTrainings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No training programs available at the moment.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <GridLayout>
            {filteredTrainings.map((training) => (
              <TrainingCard key={training.id} training={training} />
            ))}
          </GridLayout>
        </motion.div>
      )}
    </div>
  )
}

export default withAuth(TrainingPage);