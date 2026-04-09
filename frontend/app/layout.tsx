import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import { NavBar } from "@/components/NavBar"
import { BottomTabBar } from "@/components/BottomTableBar"
import Footer from "@/components/Footer"
import { CartProvider } from "@/lib/useCart"
import "./globals.css"
import Providers from "./Provider"
import { SupportChat } from "@/components/SupportChat"
import { ToastProvider } from "@/lib/toast"

// ---- LOCAL FONTS ----

// Geist (download and put in public/fonts/Geist/)
// Geist
// const geist = localFont({
//   src: [
//     {
//       path: "../public/fonts/Geist/Geist-Regular.ttf", // ✅ correct
//       weight: "400",
//       style: "normal",
//     },
//     {
//       path: "../public/fonts/Geist/Geist-Bold.ttf",
//       weight: "700",
//       style: "normal",
//     },
//   ],
//   variable: "--font-geist-sans",
// })

// Geist Mono
const geistMono = localFont({
  src: [
    {
      path: "../public/fonts/Geist_Mono/static/GeistMono-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Geist_Mono/static/GeistMono-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
})


// ---- METADATA ----
export const metadata: Metadata = {
  title: "Foodra - Empowering Nigerian Farmers",
  description: "Foodra is a blockchain-powered AgriTech platform empowering smallholder farmers in Nigeria and Africa with direct market access, agricultural training, funding opportunities, and crypto wallets for financial inclusion.",
  keywords: [
    "Foodra",
    "AgriTech Nigeria",
    "African agriculture platform",
    "smallholder farmers",
    "farmer marketplace Nigeria",
    "agricultural funding",
    "farm loans Nigeria",
    "farming training online",
    "blockchain agriculture",
    "crypto wallet farmers",
    "food security Africa",
    "farmer empowerment",
    "buy farm produce Nigeria",
    "sell agricultural products",
    "Base blockchain",
    "Web3 agriculture",
    "decentralized marketplace",
    "Nigerian farmers",
    "agribusiness Africa",
    "farm produce marketplace",
  ],
  authors: [{ name: "Foodra" }],
  creator: "Foodra",
  metadataBase: new URL("https://foodra.vercel.app"),
  openGraph: {
    title: "Foodra - Empowering Nigerian Farmers",
    description: "Blockchain-powered AgriTech platform connecting farmers with markets, training, and funding across Africa.",
    url: "https://foodra.vercel.app",
    siteName: "Foodra",
    images: [{ url: "/foodra_logo.jpeg", width: 800, height: 600, alt: "Foodra Logo" }],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Foodra - Empowering Nigerian Farmers",
    description: "Blockchain-powered AgriTech platform connecting farmers with markets, training, and funding across Africa.",
    images: ["/foodra_logo.jpeg"],
  },
  icons: {
    icon: [
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    shortcut: "/icon-32x32.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Foodra",
  },
}

// ---- ROOT LAYOUT ----
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#f5faf6" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1a2420" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Foodra" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        <style>
          {`
            [data-privy-logo] {
              border-bottom-left-radius: 1rem;
              border-top-right-radius: 1.5rem;
            }
          `}
        </style>
        <Providers>
          <ToastProvider>
          <CartProvider>
            <NavBar />
            <main className="min-h-screen pb-24 md:pb-8">{children}</main>
            <div className="mb-20 md:mb-0">
              <Footer />
            </div>
            <BottomTabBar />
            <SupportChat />
          </CartProvider>
          </ToastProvider>
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
