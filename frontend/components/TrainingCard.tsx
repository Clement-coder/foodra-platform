"use client"

import Image from "next/image"
import Link from "next/link"
import { Calendar, MapPin, Users, Video, MapPinned } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import type { Training } from "@/lib/types"
import { format } from "date-fns"
import { generateAvatarUrl } from "@/lib/avatarGenerator"

interface TrainingCardProps {
  training: Training
}

export function TrainingCard({ training }: TrainingCardProps) {
  const spotsLeft = training.capacity - training.enrolled
  const isAlmostFull = spotsLeft <= 10
  const isFull = spotsLeft <= 0
  const fillPercent = Math.min(100, Math.round((training.enrolled / training.capacity) * 100))

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow">
        <div className="relative h-48 w-full bg-muted overflow-hidden">
          <Image
            src={training.image || "/placeholder.svg"}
            alt={training.title}
            fill
            className="object-cover"
          />
          <div className="absolute top-2 left-2">
            <span
              className={`${
                training.mode === "online" ? "bg-blue-500" : "bg-purple-500"
              } text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1`}
            >
              {training.mode === "online" ? (
                <><Video className="h-3 w-3" />Online</>
              ) : (
                <><MapPinned className="h-3 w-3" />In-Person</>
              )}
            </span>
          </div>
          {isFull && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full">Fully Booked</span>
            </div>
          )}
        </div>

        <CardContent className="flex-1 p-4 flex flex-col gap-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{training.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{training.summary}</p>
          </div>

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
          </div>

          {/* Capacity progress */}
          <div className="mt-auto">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {training.enrolled} / {training.capacity} enrolled
              </span>
              {isAlmostFull && !isFull && (
                <span className="text-orange-600 dark:text-orange-400 font-medium">
                  {spotsLeft} spots left!
                </span>
              )}
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  fillPercent >= 90 ? "bg-red-500" : fillPercent >= 70 ? "bg-orange-500" : "bg-[#118C4C]"
                }`}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>

          {/* Instructor */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={generateAvatarUrl(training.instructor)}
              alt={training.instructor}
              className="h-7 w-7 rounded-full object-cover border border-[#118C4C]/30"
            />
            <span className="text-xs text-muted-foreground truncate">
              <span className="font-medium text-foreground">{training.instructor}</span>
              {" · Instructor"}
            </span>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Link href={`/training/${training.id}`} className="w-full">
            <Button
              className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white disabled:opacity-60"
              disabled={isFull}
            >
              {isFull ? "Fully Booked" : "View Details"}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
