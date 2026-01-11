"use client"

import { sampleUsers } from "@/lib/sampleData"
import { User } from "@/lib/types"
import { UserIcon } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { FarmerProfileSummary } from "@/components/FarmerProfileSummary"
import { notFound } from "next/navigation"

interface UserProfilePageProps {
  params: {
    id: string
  }
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const user = sampleUsers.find((u) => u.id === params.id)

  if (!user) {
    notFound()
  }

  const displayName = user.name
  const userEmail = user.email || "N/A"
  const userPhoneNumber = user.phone || ""
  const userLocation = user.location || ""
  const userAccountType = user.role === "farmer" ? "Farmer" : "Buyer"

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="mb-8">
          <CardHeader className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted flex-shrink-0 border-2 border-border">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={displayName}
                    className="object-cover w-full h-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#118C4C] text-white">
                    <UserIcon className="h-12 w-12" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {displayName}
                </h1>
                <div className="space-y-1 text-muted-foreground">
                  <p className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs">📧</span>
                    {userEmail}
                  </p>
                  {userPhoneNumber && (
                    <p className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs">📱</span>
                      {userPhoneNumber}
                    </p>
                  )}
                  {userLocation && (
                    <p className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs">📍</span>
                      {userLocation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            User Activity
          </h2>
          <FarmerProfileSummary user={user} />
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Account Information
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Account Type</span>
                <span className="font-medium text-foreground">
                  {userAccountType || "Not set"}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">
                  Authentication Provider
                </span>
                <span className="font-medium text-foreground">Privy</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
