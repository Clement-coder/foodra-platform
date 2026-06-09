"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Foodra GlobalError]", error)
  }, [error])

  return (
    <html>
      <body style={{ margin: 0, fontFamily: "sans-serif", background: "#f4f7f0", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#1a1a1a" }}>Foodra ran into a problem</h1>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>
            Something unexpected happened. Please refresh the page.
          </p>
          <button
            onClick={reset}
            style={{ background: "#118C4C", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Refresh
          </button>
          <br />
          <a href="/" style={{ display: "inline-block", marginTop: 16, fontSize: 13, color: "#118C4C" }}>← Back to Home</a>
          {error?.digest && (
            <p style={{ marginTop: 16, fontSize: 11, color: "#aaa" }}>ID: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  )
}
