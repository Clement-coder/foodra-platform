"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, MapPin, Users, Video, MapPinned, Clock, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/Skeleton"
import type { Training, User, Enrollment } from "@/lib/types"
import withAuth from "../../../components/withAuth";
import { loadFromLocalStorage } from "@/lib/localStorage"
import { format } from "date-fns"

function TrainingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [training, setTraining] = useState<Training | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)

  useEffect(() => {
    // Load training
    const trainings = loadFromLocalStorage<Training[]>("foodra_training", [])
    const found = trainings.find((t) => t.id === params.id)
    setTraining(found || null)
    setLoading(false)

    // Load user
  const storedUser = loadFromLocalStorage<User | null>("foodra_user", null)
    setUser(storedUser)

    // Check if already enrolled
    if (storedUser && found) {
      const enrollments = loadFromLocalStorage<Enrollment[]>("foodra_enrollments", [])
      const enrolled = enrollments.some((e) => e.userId === storedUser.id && e.trainingId === found.id)
      setIsEnrolled(enrolled)
    }
  }, [params.id])

  const handleJoinTraining = () => {
    if (!user || !training) {
      router.push("/")
      return
    }

    router.push(`/training/join?id=${training.id}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 mb-8" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (!training) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Training Not Found</h1>
        <p className="text-muted-foreground mb-8">The training program you're looking for doesn't exist.</p>
        <Link href="/training">
          <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white">Back to Training</Button>
        </Link>
      </div>
    )
  }

  const spotsLeft = training.capacity - training.enrolled
  const isAlmostFull = spotsLeft <= 10
  const isFull = spotsLeft <= 0

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="relative h-80 rounded-lg overflow-hidden bg-muted mb-6">
              <Image src={training.image || "/placeholder.svg"} alt={training.title} fill className="object-cover" />
              <div className="absolute top-4 left-4">
                <span
                  className={`${
                    training.mode === "online" ? "bg-blue-500" : "bg-purple-500"
                  } text-white text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-2`}
                >
                  {training.mode === "online" ? (
                    <>
                      <Video className="h-4 w-4" />
                      Online
                    </>
                  ) : (
                    <>
                      <MapPinned className="h-4 w-4" />
                      In-Person
                    </>
                  )}
                </span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{training.title}</h1>

            <div className="flex flex-wrap gap-4 mb-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{format(new Date(training.date), "PPP 'at' p")}</span>
              </div>

              {training.mode === "offline" && training.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>{training.location}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>
                  {training.enrolled} / {training.capacity} enrolled
                </span>
              </div>
            </div>

            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-3">About This Training</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{training.description}</p>

                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Instructor</p>
                  <p className="text-foreground font-semibold">{training.instructor}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">What You'll Learn</h2>
                <ul className="space-y-3">
                  {[
                    "Modern farming techniques and best practices",
                    "Hands-on practical demonstrations",
                    "Expert guidance and Q&A sessions",
                    "Certificate of completion",
                    "Networking with other farmers",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-[#118C4C] flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Price</p>
                  <p className="text-3xl font-bold text-[#118C4C]">Free</p>
                </div>

                {isAlmostFull && !isFull && (
                  <div className="bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 p-3 rounded-lg mb-4 text-center">
                    <p className="text-sm font-medium">Only {spotsLeft} spots left!</p>
                  </div>
                )}

                {isFull && (
                  <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-3 rounded-lg mb-4 text-center">
                    <p className="text-sm font-medium">Training is full</p>
                  </div>
                )}

                {isEnrolled ? (
                  <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 p-4 rounded-lg mb-4 text-center">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-medium">You're enrolled!</p>
                  </div>
                ) : (
                  <Button
                    onClick={handleJoinTraining}
                    disabled={isFull || !user}
                    className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white mb-3"
                    size="lg"
                  >
                    {!user ? "Sign in to Enroll" : isFull ? "Training Full" : "Enroll Now"}
                  </Button>
                )}

                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium text-foreground">3 hours</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Participants</p>
                      <p className="font-medium text-foreground">{training.enrolled} farmers</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default withAuth(TrainingDetailPage);