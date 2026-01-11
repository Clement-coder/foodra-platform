"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const SLIDE_INTERVAL = 5000

const slides = [
  {
    image: "/foodra_1.jpeg",
    text: "Empowering African Farmers to Thrive",
  },
  {
    image: "/foodra_2.jpeg",
    text: "Connect With Markets, Training & Funding",
  },
  {
    image: "/foodra_3.jpeg",
    text: "Build a Smarter, Profitable Farming Business",
  },
]

export default function LandingHero() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startAutoSlide = () => {
    stopAutoSlide()
    timerRef.current = setInterval(() => {
      slideNext()
    }, SLIDE_INTERVAL)
  }

  const stopAutoSlide = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  useEffect(() => {
    startAutoSlide()
    return stopAutoSlide
  }, [])

  const slideNext = () => {
    setDirection(1)
    setCurrent((prev) => (prev + 1) % slides.length)
    startAutoSlide()
  }

  const slidePrev = () => {
    setDirection(-1)
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
    startAutoSlide()
  }

  return (
    <section className="relative h-[750px] md:h-[700px] lg:h-[735px] overflow-hidden">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          initial={{ x: direction > 0 ? "100%" : "-100%", opacity: 1 }}
          animate={{ x: "0%", opacity: 1 }}
          exit={{ x: direction > 0 ? "-100%" : "100%", opacity: 1 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={slides[current].image}
            alt="Hero slide"
            fill
            priority
            className="object-cover "
          />

          {/* Dark gradient overlay (NO WHITE FLASH) */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/40" />

          {/* Text */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white max-w-5xl"
            >
              {slides[current].text}
            </motion.h1>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
            >
              <Link href="/marketplace" className="w-full sm:w-auto">
                <button className="gap-2 text-center mx-auto flex items-center justify-center py-3 text-xl px-4 rounded-xl bg-green-700 text-white hover:bg-green-800/90 duration-200 ease-in-out w-full">
                  Explore Marketplace
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <Link href="/how-it-works" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-none text-white z-20 
                   bg-white/20 hover:bg-white/30 
                   backdrop-blur-md p-2 w-full"
                >
                  How It Works
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={slidePrev}
        className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 
                   bg-white/10 hover:bg-white/30 
                   backdrop-blur-md p-2 md:p-4 rounded-full text-white"
      >
        <ArrowLeft className="h-4 w-4 md:h-6 md:w-6" />
      </button>

      {/* RIGHT ARROW */}
      <button
        onClick={slideNext}
        className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 
                   bg-white/10 hover:bg-white/30 
                   backdrop-blur-md p-2 md:p-4 rounded-full text-white"
      >
        <ArrowRight className="h-4 w-4 md:h-6 md:w-6" />
      </button>

      {/* SLIDE INDICATORS */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 md:gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > current ? 1 : -1)
              setCurrent(i)
              startAutoSlide()
            }}
            className={`h-2 rounded-full transition-all ${
              i === current
                ? "w-8 md:w-10 bg-[#118C4C]"
                : "w-2 md:w-3 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  )
}
