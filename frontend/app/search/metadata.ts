import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Search | Foodra",
  description: "Search for farm products, training programs, and farmers on Foodra.",
  robots: { index: false, follow: false },
}

export { default } from "./page"
