import type React from "react"
import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import { NavBar } from "@/components/NavBar"
import { BottomTabBar } from "@/components/BottomTableBar"
import Footer from "@/components/Footer"
import { CartProvider } from "@/lib/useCart"
import AppLoader from "@/components/AppLoader"
import PWAManager from "@/components/PWAManager"
import "./globals.css"
import Providers from "./Provider"
import { SupportChat } from "@/components/SupportChat"
import { ToastProvider } from "@/lib/toast"
import { OfflineBanner } from "@/components/OfflineBanner"
import { organizationJsonLd } from "@/lib/seo"

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


// ---- VIEWPORT (controls status bar color on Android + iOS PWA) ----
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5faf6" },
    { media: "(prefers-color-scheme: dark)", color: "#1b2b24" },
  ],
}

// ---- METADATA ----
export const metadata: Metadata = {
  title: "Foodra — Nigeria's #1 Farm Marketplace | Buy & Sell Fresh Farm Produce",
  description: "Foodra is Nigeria's leading AgriTech marketplace where farmers sell fresh produce directly to buyers. Buy rice, yam, tomatoes, vegetables & more. Access farm loans, training programs, and blockchain-powered payments. Join 5,000+ farmers across Africa.",
  keywords: [
    "Foodra", "Foodra Market", "foodramarket.com",
    "buy farm produce Nigeria", "sell farm produce online Nigeria",
    "farmer marketplace Nigeria", "agricultural marketplace Africa",
    "fresh vegetables online Nigeria", "buy rice Nigeria", "buy yam online",
    "buy tomatoes Nigeria", "buy cassava Nigeria", "buy maize Nigeria",
    "buy groundnut Nigeria", "buy palm oil Nigeria", "buy plantain Nigeria",
    "Nigerian farm market", "Benue State farm produce", "Abuja farm market",
    "smallholder farmer platform Nigeria", "farmer empowerment Africa",
    "agribusiness Nigeria", "AgriTech Nigeria", "AgriTech Africa",
    "agricultural training Nigeria", "farming courses online Nigeria",
    "farm loans Nigeria", "agricultural grants Nigeria", "farmer funding Nigeria",
    "blockchain agriculture Nigeria", "Web3 farm marketplace",
    "food security Nigeria", "food security Africa",
    "African food supply chain", "buy organic produce Nigeria",
    "direct from farmer Nigeria", "farm to table Nigeria",
  ],
  authors: [{ name: "Foodra", url: "https://foodramarket.com" }],
  creator: "Foodra Technologies Ltd",
  publisher: "Foodra Technologies Ltd",
  metadataBase: new URL("https://foodramarket.com"),
  alternates: { canonical: "https://foodramarket.com" },
  openGraph: {
    title: "Foodra — Nigeria's #1 Farm Marketplace",
    description: "Buy fresh farm produce directly from verified Nigerian farmers. Rice, yam, vegetables, grains & more. Plus farm loans, training, and blockchain payments.",
    url: "https://foodramarket.com",
    siteName: "Foodra",
    images: [{ url: "/foodra.png", width: 1200, height: 630, alt: "Foodra — Nigeria's Farm Marketplace" }],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Foodra — Nigeria's #1 Farm Marketplace",
    description: "Buy fresh farm produce directly from verified Nigerian farmers. Rice, yam, vegetables, grains & more.",
    images: ["/foodra.png"],
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
    statusBarStyle: "black-translucent",
    title: "Foodra",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
  },
  category: "Agriculture, Marketplace, Technology",
}

// ---- ROOT LAYOUT ----
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* iOS PWA: black-translucent overlays status bar with app color */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Foodra" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{})}
              // Keep theme-color meta in sync with app theme so status bar always matches
              (function(){
                var LIGHT='#f5faf6', DARK='#1b2b24';
                function update(){
                  var isDark=document.documentElement.classList.contains('dark');
                  var color=isDark?DARK:LIGHT;
                  document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute('content',color)});
                }
                update();
                new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
              })();
            `,
          }}
        />
        <Providers>
          <ToastProvider>
          <CartProvider>
            <AppLoader>
              <NavBar />
              <main className="min-h-screen pb-24 md:pb-8 pt-[56px]">{children}</main>
              <div className="mb-20 md:mb-0">
                <Footer />
              </div>
              <BottomTabBar />
              <SupportChat />
              <PWAManager />
              <OfflineBanner />
            </AppLoader>
          </CartProvider>
          </ToastProvider>
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
