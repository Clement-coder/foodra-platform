"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Camera } from "lucide-react"

const photos = [
  { src: "/foodra_1.jpeg", caption: "Dawn on the farm", category: "Farms" },
  { src: "/foodra_2.jpeg", caption: "Market day", category: "Markets" },
  { src: "/foodra_3.jpeg", caption: "Learning together", category: "Training" },
  { src: "/foodra_4.jpeg", caption: "Harvest season", category: "Farms" },
  { src: "/foodra_5.jpeg", caption: "Community first", category: "Community" },
  { src: "/foodra_6.jpeg", caption: "Fresh from the field", category: "Markets" },
  { src: "/foodra_7.jpeg", caption: "Modern techniques", category: "Training" },
  { src: "/foodra_8.jpeg", caption: "Hands in the soil", category: "Farms" },
]

const categories = ["All", "Farms", "Markets", "Training", "Community"]

export default function GalleryPage() {
  const [active, setActive] = useState("All")
  const [lightbox, setLightbox] = useState<string | null>(null)

  const filtered = active === "All" ? photos : photos.filter((p) => p.category === active)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#EAF5ED] to-white dark:from-[#118C4C]/10 dark:to-background py-16 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold text-[#118C4C] mb-4">
            <Camera className="h-3.5 w-3.5" /> Gallery
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">A Glimpse Into African Agriculture</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From sunrise on the farm to market day — explore the people, places, and produce that make Foodra's community thrive.
          </p>
        </div>
      </section>

      <section className="py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                  active === c
                    ? "bg-[#118C4C] text-white border-[#118C4C] shadow-md shadow-[#118C4C]/20"
                    : "border-[#118C4C]/30 text-muted-foreground hover:border-[#118C4C] hover:text-[#118C4C]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Masonry grid */}
          <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            <AnimatePresence>
              {filtered.map((photo) => (
                <motion.div
                  key={photo.src}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="break-inside-avoid rounded-2xl overflow-hidden border border-[#118C4C]/20 group relative bg-muted cursor-pointer"
                  onClick={() => setLightbox(photo.src)}
                >
                  <div className="relative w-full aspect-[4/3]">
                    <Image
                      src={photo.src}
                      alt={photo.caption}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-sm font-medium">{photo.caption}</p>
                    <span className="text-white/70 text-xs">{photo.category}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="relative max-w-4xl w-full max-h-[85vh] aspect-video rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={lightbox} alt="Gallery image" fill className="object-cover" />
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors text-lg"
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
