"use client"

import { useEffect, useState } from "react"

export default function AppLoader({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Wait for fonts + first paint, then fade out splash
    if (document.readyState === "complete") {
      setTimeout(() => setReady(true), 300)
    } else {
      const handler = () => setTimeout(() => setReady(true), 300)
      window.addEventListener("load", handler)
      return () => window.removeEventListener("load", handler)
    }
  }, [])

  return (
    <>
      {/* Splash screen */}
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500"
        style={{
          opacity: ready ? 0 : 1,
          pointerEvents: ready ? "none" : "all",
          paddingTop: "env(safe-area-inset-top)",
        }}
        aria-hidden={ready}
      >
        <img
          src="/foodra_logo.jpeg"
          alt="Foodra"
          className="w-20 h-20 rounded-2xl rounded-bl-3xl rounded-tr-3xl shadow-lg mb-6 object-cover"
        />
        <span className="text-2xl font-bold text-[#118C4C] tracking-tight mb-8">FOODRA</span>

        {/* Animated dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-[#118C4C]"
              style={{
                animation: `foodra-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes foodra-bounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>

      {/* App content — visible immediately but behind splash */}
      <div style={{ opacity: ready ? 1 : 0, transition: "opacity 0.4s ease 0.1s" }}>
        {children}
      </div>
    </>
  )
}
