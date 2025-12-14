"use client"

import { Calendar, MapPin, User } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import type { FundingApplication, User as UserType } from "@/lib/types"
import { format } from "date-fns"
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/localStorage"
import { useState } from "react"

interface FundingCardProps {
  application: FundingApplication
  onStatusChange?: () => void
}

export function FundingCard({ application, onStatusChange }: FundingCardProps) {
const [user] = useState<UserType | null>(
  loadFromLocalStorage<UserType | null>("foodra_user", null)
)
    // const storedUser = loadFromLocalStorage<User | null>("foodra_user", null)

  const isAdmin = user?.role === "admin"
  

  const handleStatusChange = (newStatus: "Approved" | "Rejected") => {
    const applications = loadFromLocalStorage<FundingApplication[]>("foodra_applications", [])
    const updated = applications.map((app) => (app.id === application.id ? { ...app, status: newStatus } : app))
    saveToLocalStorage("foodra_applications", updated)
    onStatusChange?.()
  }

  const statusColors = {
    Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    Approved: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    Rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  }

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">{application.fullName}</h3>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[application.status]}`}>
                {application.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#118C4C]">₦{application.amountRequested.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Requested</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{application.location}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 flex-shrink-0" />
              <span>
                {application.farmType} • {application.farmSize} hectares • {application.yearsOfExperience} years exp.
              </span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>Submitted {format(new Date(application.submittedAt), "PP")}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-1">Expected Outcome:</p>
            <p className="text-sm line-clamp-2">{application.expectedOutcome}</p>
          </div>
        </CardContent>

        {isAdmin && application.status === "Pending" && (
          <CardFooter className="p-4 pt-0 flex gap-2">
            <Button
              onClick={() => handleStatusChange("Approved")}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Approve
            </Button>
            <Button onClick={() => handleStatusChange("Rejected")}className="flex-1">
              Reject
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}
