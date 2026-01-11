"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ArrowLeft, ArrowRight } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"

const slides = [
  { image: "/foodra_1.jpeg" },
  { image: "/foodra_2.jpeg" },
  { image: "/foodra_3.jpeg" },
  { image: "/foodra_4.jpeg" },
  { image: "/foodra_5.jpeg" },
  { image: "/foodra_6.jpeg" },
  { image: "/foodra_7.jpeg" },
  { image: "/foodra_8.jpeg" },
]

export default function Gallery() {
  const autoplay = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false })
  )

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      breakpoints: {
        "(min-width: 1024px)": { slidesToScroll: 3 }, // Large screens: 3 images
        "(min-width: 768px)": { slidesToScroll: 2 }, // Medium screens: 2 images
        "(max-width: 767px)": { slidesToScroll: 1 }, // Small screens: 1 image
      },
    },
    [autoplay.current]
  )

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const scrollPrev = useCallback(() => {
    emblaApi && emblaApi.scrollPrev()
    autoplay.current.reset()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    emblaApi && emblaApi.scrollNext()
    autoplay.current.reset()
  }, [emblaApi])

  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setPrevBtnDisabled(!emblaApi.canScrollPrev())
    setNextBtnDisabled(!emblaApi.canScrollNext())
  }, [])

  const onInit = useCallback((emblaApi: any) => {
    setScrollSnaps(emblaApi.scrollSnapList())
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    onInit(emblaApi)
    onSelect(emblaApi)
    emblaApi.on("reInit", onInit)
    emblaApi.on("reInit", onSelect)
    emblaApi.on("select", onSelect)
  }, [emblaApi, onInit, onSelect])

  return (
    <section className="relative py-12">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y -ml-4">
          {slides.map((slide, index) => (
            <div className="relative flex-none w-full md:w-1/2 lg:w-1/3 pl-4" key={index}>
              <div className="relative h-80 rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={slide.image}
                  alt={`Gallery slide ${index + 1}`}
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={scrollPrev}
        disabled={prevBtnDisabled}
        className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 
                   bg-white/10 hover:bg-white/30 
                   backdrop-blur-md p-2 md:p-4 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowLeft className="h-4 w-4 md:h-6 md:w-6" />
      </button>

      <button
        onClick={scrollNext}
        disabled={nextBtnDisabled}
        className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 
                   bg-white/10 hover:bg-white/30 
                   backdrop-blur-md p-2 md:p-4 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowRight className="h-4 w-4 md:h-6 md:w-6" />
      </button>

      {/* Indicators - Embla handles active slide, so we can just show dots for number of slides */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 md:gap-3">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi && emblaApi.scrollTo(index)}
            className={`h-2 rounded-full transition-all ${
              index === selectedIndex
                ? "w-8 md:w-10 bg-[#118C4C]"
                : "w-2 md:w-3 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  )
}