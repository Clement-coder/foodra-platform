"use client"

import Image from "next/image"
import Link from "next/link"
import { Calendar, MapPin, Users, Video, MapPinned } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import type { Training } from "@/lib/types"
import { format } from "date-fns"

interface TrainingCardProps {
  training: Training
}

export function TrainingCard({ training }: TrainingCardProps) {
  const spotsLeft = training.capacity - training.enrolled
  const isAlmostFull = spotsLeft <= 10

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="overflow-hidden h-full flex flex-col">
        <div className="relative h-48 w-full bg-muted">
          <Image src={training.image || "/placeholder.svg"} alt={training.title} fill className="object-cover" />
          <div className="absolute top-2 left-2">
            <span
              className={`${
                training.mode === "online" ? "bg-blue-500" : "bg-purple-500"
              } text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1`}
            >
              {training.mode === "online" ? (
                <>
                  <Video className="h-3 w-3" />
                  Online
                </>
              ) : (
                <>
                  <MapPinned className="h-3 w-3" />
                  In-Person
                </>
              )}
            </span>
          </div>
        </div>

        <CardContent className="flex-1 p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">{training.title}</h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{training.summary}</p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{format(new Date(training.date), "PPP 'at' p")}</span>
            </div>

            {training.mode === "offline" && training.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>{training.location}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span>
                {training.enrolled} / {training.capacity} enrolled
              </span>
            </div>

            {isAlmostFull && (
              <p className="text-orange-600 dark:text-orange-400 font-medium text-xs">Only {spotsLeft} spots left!</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-3">Instructor: {training.instructor}</p>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Link href={`/training/${training.id}`} className="w-full">
            <Button className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white">View Details</Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
