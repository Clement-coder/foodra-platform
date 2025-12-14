"use client"

import { useEffect, useState } from "react"
import { ShoppingBag, DollarSign, GraduationCap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { User, Product, FundingApplication, Enrollment } from "@/lib/types"
import { loadFromLocalStorage } from "@/lib/localStorage"

interface FarmerProfileSummaryProps {
  user: User
}

export function FarmerProfileSummary({ user }: FarmerProfileSummaryProps) {
  const [stats, setStats] = useState({
    productsListed: 0,
    fundingApplied: 0,
    trainingsJoined: 0,
  })

  useEffect(() => {
    // Count products listed by this user
    const products = loadFromLocalStorage<Product[]>("foodra_products", [])
    const userProducts = products.filter((p) => p.farmerId === user.id)

    // Count funding applications
    const applications = loadFromLocalStorage<FundingApplication[]>("foodra_applications", [])
    const userApplications = applications.filter((a) => a.userId === user.id)

    // Count training enrollments
    const enrollments = loadFromLocalStorage<Enrollment[]>("foodra_enrollments", [])
    const userEnrollments = enrollments.filter((e) => e.userId === user.id)

    setStats({
      productsListed: userProducts.length,
      fundingApplied: userApplications.length,
      trainingsJoined: userEnrollments.length,
    })
  }, [user.id])

  const statCards = [
    {
      icon: ShoppingBag,
      label: "Products Listed",
      value: stats.productsListed,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      icon: DollarSign,
      label: "Funding Applied",
      value: stats.fundingApplied,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/20",
    },
    {
      icon: GraduationCap,
      label: "Trainings Joined",
      value: stats.trainingsJoined,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/20",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
