"use client"

import { useState } from "react"
import { User, Product } from "@/lib/types"
import { UserIcon, Mail, Phone, MapPin, Wallet, Copy, Check, ShoppingBag, Activity } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ProductCard } from "@/components/ProductCard"
import { Button } from "@/components/ui/button"

interface UserProfileClientProps {
  user: User
  userProducts: Product[]
}

export default function UserProfileClient({ user, userProducts }: UserProfileClientProps) {
  const [showWallet, setShowWallet] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(user.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const recentActivities = [
    { id: 1, activity: "Joined Foodra", date: "2023-10-26" },
    { id: 2, activity: "Listed Fresh Tomatoes", date: "2023-10-27" },
    { id: 3, activity: "Updated profile", date: "2023-10-28" },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="mb-8">
          <CardHeader className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0 border-2 border-border">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="object-cover w-full h-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#118C4C] text-white">
                    <UserIcon className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {user.name}
                </h1>
                <div className="space-y-1 text-muted-foreground">
                  <p className="flex items-center justify-center sm:justify-start gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                  <p className="flex items-center justify-center sm:justify-start gap-2">
                    <MapPin className="h-4 w-4" />
                    {user.location}
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowWallet(!showWallet)} variant="outline">
                <Wallet className="h-4 w-4 mr-2" />
                {showWallet ? "Hide Wallet" : "Show Wallet"}
              </Button>
            </div>
            {showWallet && (
              <div className="mt-4 p-4 bg-muted/50 border border-border rounded-lg flex items-center justify-between">
                <p className="text-sm text-muted-foreground break-all">
                  <strong className="text-foreground">Wallet Address:</strong> {user.id}
                </p>
                <Button onClick={handleCopy} size="icon" variant="ghost">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <ShoppingBag className="h-6 w-6" />
              Listed Products
            </h2>
            {userProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {userProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">This user has not listed any products yet.</p>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Recent Activities
            </h2>
            <Card>
              <CardContent className="p-6">
                <ul className="space-y-4">
                  {recentActivities.map((activity) => (
                    <li key={activity.id} className="flex items-start gap-4">
                      <div className="bg-accent p-2 rounded-full">
                        <Activity className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{activity.activity}</p>
                        <p className="text-sm text-muted-foreground">{activity.date}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
