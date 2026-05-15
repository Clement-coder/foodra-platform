import type { Metadata } from "next"
import Image from "next/image"
import { Camera } from "lucide-react"

export const metadata: Metadata = {
  title: "Gallery | Foodra",
  description: "A visual journey through Foodra's agricultural ecosystem — farms, markets, training sessions, and the communities we serve.",
  alternates: { canonical: "https://foodramarket.com/gallery" },
}

const photos = [
  { src: "/gallery/farm1.jpg", alt: "Lush green farmland at sunrise", caption: "Dawn on the farm", category: "Farms" },
  { src: "/gallery/market1.jpg", alt: "Farmers displaying fresh produce at market", caption: "Market day", category: "Markets" },
  { src: "/gallery/training1.jpg", alt: "Farmers attending a training session", caption: "Learning together", category: "Training" },
  { src: "/gallery/farm2.jpg", alt: "Rows of healthy crops", caption: "Harvest season", category: "Farms" },
  { src: "/gallery/community1.jpg", alt: "Farming community gathering", caption: "Community first", category: "Community" },
  { src: "/gallery/market2.jpg", alt: "Fresh vegetables ready for sale", caption: "Fresh from the field", category: "Markets" },
  { src: "/gallery/training2.jpg", alt: "Expert instructor demonstrating irrigation", caption: "Modern techniques", category: "Training" },
  { src: "/gallery/farm3.jpg", alt: "Farmer tending to crops", caption: "Hands in the soil", category: "Farms" },
  { src: "/gallery/community2.jpg", alt: "Women farmers cooperative meeting", caption: "Women in agriculture", category: "Community" },
]

const categories = ["All", "Farms", "Markets", "Training", "Community"]

export default function GalleryPage() {
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

      {/* Category pills — static, no JS filter needed for SEO */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {categories.map((c) => (
              <span key={c} className="px-4 py-1.5 rounded-full text-sm border border-[#118C4C]/30 text-muted-foreground">
                {c}
              </span>
            ))}
          </div>

          {/* Masonry-style grid */}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {photos.map((photo) => (
              <div key={photo.src} className="break-inside-avoid rounded-2xl overflow-hidden border border-[#118C4C]/20 group relative bg-muted">
                <div className="relative w-full aspect-[4/3]">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
                  {/* Fallback placeholder shown when image missing */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#118C4C]/5">
                    <Camera className="h-8 w-8 text-[#118C4C]/30 mb-2" />
                    <span className="text-xs text-muted-foreground">{photo.caption}</span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium">{photo.caption}</p>
                  <span className="text-white/70 text-xs">{photo.category}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-10">
            More photos coming soon as our community grows. 📸
          </p>
        </div>
      </section>
    </div>
  )
}
