"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight } from "lucide-react"

const SLIDE_INTERVAL = 5000

const slides = [
  {
    image: "/WhatsApp Image 2025-12-14 at 07.27.36.jpeg",
    text: "Empowering Nigerian Farmers to Thrive",
  },
  {
    image: "/WhatsApp Image 2025-12-14 at 07.27.37.jpeg",
    text: "Connect With Markets, Training & Funding",
  },
  {
    image: "/WhatsApp Image 2025-12-14 at 07.27.37 (1).jpeg",
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
    <section className="relative h-[70vh] overflow-hidden">
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
            className="object-cover"
          />

          {/* Dark gradient overlay (NO WHITE FLASH) */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/40" />

          {/* Text */}
          <div className="relative z-10 flex items-center justify-center h-full px-6 text-center">
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-4xl md:text-6xl font-bold text-white max-w-5xl"
            >
              {slides[current].text}
            </motion.h1>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* LEFT ARROW */}
      <button
        onClick={slidePrev}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 
                   bg-white/10 hover:bg-white/30 
                   backdrop-blur-md p-4 rounded-full text-white"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      {/* RIGHT ARROW */}
      <button
        onClick={slideNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 
                   bg-white/10 hover:bg-white/30 
                   backdrop-blur-md p-4 rounded-full text-white"
      >
        <ArrowRight className="h-6 w-6" />
      </button>

      {/* SLIDE INDICATORS */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3">
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
                ? "w-10 bg-[#118C4C]"
                : "w-3 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  )
}
