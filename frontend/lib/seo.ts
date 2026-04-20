import type { Metadata } from "next"

const BASE_URL = "https://foodra.app"
const DEFAULT_IMAGE = `${BASE_URL}/foodra.png`

export function buildMetadata({
  title,
  description,
  path = "",
  image,
  type = "website",
}: {
  title: string
  description: string
  path?: string
  image?: string
  type?: "website" | "article"
}): Metadata {
  const url = `${BASE_URL}${path}`
  const ogImage = image || DEFAULT_IMAGE

  return {
    title: `${title} | Foodra`,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | Foodra`,
      description,
      url,
      siteName: "Foodra",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
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
    url: BASE_URL,
    logo: `${BASE_URL}/foodra_logo.jpeg`,
    description: "Blockchain-powered AgriTech platform empowering African smallholder farmers",
    sameAs: ["https://twitter.com/foodraapp"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${BASE_URL}/contact`,
    },
  }
}
