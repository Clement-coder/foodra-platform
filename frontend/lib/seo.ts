import type { Metadata } from "next"

const BASE_URL = "https://foodramarket.com"
const DEFAULT_IMAGE = `${BASE_URL}/foodra.png`

export const SITE_KEYWORDS = [
  // Brand
  "Foodra", "Foodra Market", "foodramarket.com", "Foodra Nigeria", "Foodra AgriTech",
  // Core product
  "buy farm produce Nigeria", "buy agricultural products online Nigeria",
  "agricultural marketplace Africa", "buy fresh farm produce online Nigeria",
  "buy vegetables online Nigeria", "buy grains Nigeria",
  "buy rice online Nigeria", "buy tomatoes online Nigeria",
  "buy yam online Nigeria", "buy cassava Nigeria", "buy maize Nigeria",
  "farm commodities Nigeria", "Foodra farm store",
  // Buyers
  "buy directly from farm Nigeria", "affordable farm produce Nigeria",
  "agribusiness Nigeria", "agribusiness Africa",
  // Training
  "agricultural training Nigeria", "farming training online Nigeria",
  "modern farming techniques", "crop farming training Africa",
  "free farming courses Nigeria",
  // Funding
  "farm loans Nigeria", "agricultural grants Nigeria",
  "farming funding Nigeria", "agri loans Africa",
  "agricultural credit Nigeria", "farm loan application Nigeria",
  // Tech
  "AgriTech Nigeria", "AgriTech Africa",
  "NGN wallet Nigeria", "Paystack wallet Nigeria",
  // Food security
  "food security Nigeria", "food security Africa",
  "African food supply chain", "Nigerian food market",
  // Location
  "Benue State farm produce", "Abuja farm market", "Nigerian farm produce online",
  "African agricultural platform",
]

export function buildMetadata({
  title,
  description,
  path = "",
  image,
  type = "website",
  keywords,
}: {
  title: string
  description: string
  path?: string
  image?: string
  type?: "website" | "article"
  keywords?: string[]
}): Metadata {
  const url = `${BASE_URL}${path}`
  const ogImage = image || DEFAULT_IMAGE

  return {
    title: `${title} | Foodra — Nigeria's #1 Farm Marketplace`,
    description,
    keywords: keywords ?? SITE_KEYWORDS,
    metadataBase: new URL(BASE_URL),
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | Foodra`,
      description,
      url,
      siteName: "Foodra",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      locale: "en_NG",
      type,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Foodra`,
      description,
      images: [ogImage],
    },
  }
}

/** JSON-LD structured data helpers */
export function productJsonLd(product: {
  id: string
  productName: string
  description: string
  image: string
  pricePerUnit: number
  farmerName: string
  location: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.productName,
    description: product.description,
    image: product.image,
    url: `${BASE_URL}/marketplace/${product.id}`,
    offers: {
      "@type": "Offer",
      price: product.pricePerUnit,
      priceCurrency: "NGN",
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Foodra" },
    },
    brand: { "@type": "Brand", name: "Foodra" },
  }
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Foodra",
    alternateName: ["Foodra Market", "Foodra Nigeria", "FoodraMarket"],
    url: BASE_URL,
    logo: `${BASE_URL}/foodra_logo.jpeg`,
    description: "Nigeria's leading AgriTech platform selling quality farm commodities directly to buyers, with training programs, agricultural funding, and an NGN digital wallet — built for Africa.",
    foundingLocation: { "@type": "Place", name: "Benue State, Nigeria" },
    areaServed: ["Nigeria", "Africa"],
    email: "support@foodramarket.com",
    sameAs: ["https://twitter.com/foodraapp"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@foodramarket.com",
      url: `${BASE_URL}/contact`,
      availableLanguage: ["English", "Yoruba", "Hausa", "Igbo"],
    },
  }
}
