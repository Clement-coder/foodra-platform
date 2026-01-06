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
  description: "Connect farmers with markets, training, and funding opportunities",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
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
          <CartProvider>
            <NavBar />
            <main className="min-h-screen pb-20 md:pb-8">{children}</main>
            <BottomTabBar />
            <Footer />
          </CartProvider>
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
