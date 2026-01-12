"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DollarSign, Plus, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FundingCard } from "@/components/FundingCard"
import type { FundingApplication, User } from "@/lib/types"
import withAuth from "../../components/withAuth";
import { loadFromLocalStorage } from "@/lib/localStorage"
import { useUser } from "@/lib/useUser"

function FundingPage() {
  const { currentUser: user, isLoading } = useUser()
  const [applications, setApplications] = useState<FundingApplication[]>([])
  const [filter, setFilter] = useState<"all" | "Pending" | "Approved" | "Rejected">("all")

  useEffect(() => {
    if (!isLoading) {
      loadData()
    }
  }, [isLoading, user])

  const loadData = () => {
    const allApplications = loadFromLocalStorage<FundingApplication[]>("foodra_applications", [])

    // If user is logged in, show only their applications
    if (user) {
      const userApplications = allApplications.filter((app) => app.userId === user.id)
      setApplications(userApplications)
    } else {
      // Show all applications for non-logged users
      setApplications(allApplications)
    }
  }

  const filteredApplications = applications.filter((app) => {
    if (filter === "all") return true
    return app.status === filter
  })

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "Pending").length,
    approved: applications.filter((a) => a.status === "Approved").length,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-[#118C4C]/10 p-3 rounded-lg">
            <DollarSign className="h-8 w-8 text-[#118C4C]" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Funding</h1>
            <p className="text-muted-foreground">Access funding opportunities for your farm</p>
          </div>
        </div>
        {user && (
          <Link href="/funding/apply">
            <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2">
              <Plus className="h-4 w-4" />
              Apply for Funding
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      {user && applications.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter buttons */}
      {applications.length > 0 && (
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={
              filter === "all" ? "bg-[#118C4C] hover:bg-[#0d6d3a] text-white" : "bg-transparent hover:bg-accent"
            }
          >
            All
          </Button>
          <Button
            variant={filter === "Pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("Pending")}
            className={
              filter === "Pending" ? "bg-[#118C4C] hover:bg-[#0d6d3a] text-white" : "bg-transparent hover:bg-accent"
            }
          >
            Pending
          </Button>
          <Button
            variant={filter === "Approved" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("Approved")}
            className={
              filter === "Approved" ? "bg-[#118C4C] hover:bg-[#0d6d3a] text-white" : "bg-transparent hover:bg-accent"
            }
          >
            Approved
          </Button>
          <Button
            variant={filter === "Rejected" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("Rejected")}
            className={
              filter === "Rejected" ? "bg-[#118C4C] hover:bg-[#0d6d3a] text-white" : "bg-transparent hover:bg-accent"
            }
          >
            Rejected
          </Button>
        </div>
      )}

      {/* Applications List */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#118C4C] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      ) : !user ? (
        <Card className="p-8 text-center">
          <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Funding Opportunities</h2>
          <p className="text-muted-foreground mb-6">Sign in to apply for funding and track your applications</p>
          <Link href="/">
            <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white">Sign In</Button>
          </Link>
        </Card>
      ) : filteredApplications.length === 0 ? (
        <Card className="p-8 text-center">
          <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {filter === "all" ? "No Applications Yet" : `No ${filter} Applications`}
          </h2>
          <p className="text-muted-foreground mb-6">
            {filter === "all"
              ? "Start by applying for funding to grow your farming business"
              : "Try changing the filter to see other applications"}
          </p>
          {filter === "all" && (
            <Link href="/funding/apply">
              <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white">Apply for Funding</Button>
            </Link>
          )}
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredApplications.map((application) => (
              <FundingCard key={application.id} application={application} onStatusChange={loadData} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default withAuth(FundingPage);