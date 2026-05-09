import type { Metadata } from "next"

const BASE_URL = "https://foodramarket.com"
const DEFAULT_IMAGE = `${BASE_URL}/foodra.png`

export const SITE_KEYWORDS = [
  // Brand
  "Foodra", "Foodra Market", "foodramarket.com", "Foodra Nigeria", "Foodra AgriTech",
  // Core product
  "buy farm produce Nigeria", "sell agricultural products online Nigeria",
  "farmer marketplace Nigeria", "agricultural marketplace Africa",
  "fresh farm produce online", "buy vegetables online Nigeria",
  "buy grains Nigeria", "buy rice online Nigeria", "buy tomatoes online Nigeria",
  "buy yam online Nigeria", "buy cassava Nigeria", "buy maize Nigeria",
  // Farmer empowerment
  "smallholder farmer platform", "farmer empowerment Nigeria",
  "farmer income Nigeria", "farming business Nigeria",
  "agribusiness Nigeria", "agribusiness Africa",
  // Training
  "agricultural training Nigeria", "farming training online Nigeria",
  "modern farming techniques", "crop farming training Africa",
  "free farming courses Nigeria",
  // Funding
  "farm loans Nigeria", "agricultural grants Nigeria",
  "farming funding Nigeria", "agri loans Africa",
  "agricultural credit Nigeria", "farmer loan application",
  // Tech
  "AgriTech Nigeria", "AgriTech Africa", "blockchain agriculture",
  "Web3 agriculture", "decentralized marketplace Nigeria",
  "crypto wallet farmers", "Base blockchain Nigeria",
  // Food security
  "food security Nigeria", "food security Africa",
  "African food supply chain", "Nigerian food market",
  // Location
  "Lagos farm produce", "Abuja farm market", "Nigerian farmers online",
  "African farmers marketplace",
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
      seller: { "@type": "Person", name: product.farmerName },
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
    description: "Nigeria's leading blockchain-powered AgriTech marketplace connecting smallholder farmers with buyers, training programs, and agricultural funding across Africa.",
    foundingLocation: { "@type": "Place", name: "Lagos, Nigeria" },
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
