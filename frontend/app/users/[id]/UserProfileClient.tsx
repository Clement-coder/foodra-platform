"use client"

import { useState } from "react"
import { User, Product } from "@/lib/types"
import {
  UserIcon,
  Mail,
  MapPin,
  Wallet,
  Copy,
  Check,
  ShoppingBag,
  Activity,
} from "lucide-react"
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
    navigator.clipboard.writeText(user.wallet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const recentActivities = [
    {
      id: 1,
      activity: "Joined Foodra",
      date: new Date(user.createdAt).toDateString(),
    },
    ...(userProducts.length
      ? [
          {
            id: 2,
            activity: `Listed ${userProducts.length} product(s)`,
            date: new Date(userProducts[0].createdAt).toDateString(),
          },
        ]
      : []),
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="mb-8">
          <CardHeader className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-full overflow-hidden border">
                {user.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#118C4C] text-white">
                    <UserIcon />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="flex gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" /> {user.email}
                </p>
                <p className="flex gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {user.location || "—"}
                </p>
              </div>

              <Button onClick={() => setShowWallet(!showWallet)} variant="outline">
                <Wallet className="h-4 w-4 mr-2" />
                {showWallet ? "Hide Wallet" : "Show Wallet"}
              </Button>
            </div>

            {showWallet && (
              <div className="mt-4 p-4 bg-muted rounded-lg flex justify-between">
                <p className="break-all">{user.wallet}</p>
                <Button onClick={handleCopy} size="icon">
                  {copied ? <Check /> : <Copy />}
                </Button>
              </div>
            )}
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex gap-2">
              <ShoppingBag /> Products
            </h2>

            {userProducts.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {userProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No products listed yet.</p>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 flex gap-2">
              <Activity /> Activity
            </h2>

            <Card>
              <CardContent>
                <ul className="space-y-4">
                  {recentActivities.map((a) => (
                    <li key={a.id}>
                      <p className="font-medium">{a.activity}</p>
                      <p className="text-sm text-muted-foreground">{a.date}</p>
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
