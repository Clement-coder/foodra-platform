import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-6">
        <span className="text-8xl font-black text-[#118C4C]/20 select-none">404</span>
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/">
          <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white">Go Home</Button>
        </Link>
        <Link href="/marketplace">
          <Button variant="outline" className="border-[#118C4C]/30 hover:bg-[#118C4C]/5">
            Browse Marketplace
          </Button>
        </Link>
      </div>
    </div>
  )
}
