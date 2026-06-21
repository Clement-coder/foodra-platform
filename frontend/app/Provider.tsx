"use client"

import { PrivyProvider } from "@privy-io/react-auth"
import { ThemeProvider } from "next-themes"
import { privyConfig } from "./PrivyConfig"
import { CartProvider } from "@/lib/useCart"
import { ToastProvider } from "@/lib/toast"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!} config={privyConfig}>
        <ToastProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </ToastProvider>
      </PrivyProvider>
    </ThemeProvider>
  )
}
