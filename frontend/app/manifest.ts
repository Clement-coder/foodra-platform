import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Foodra - Empowering Nigerian Farmers",
    short_name: "Foodra",
    description: "Blockchain-powered AgriTech platform connecting farmers with markets, training, and funding across Africa.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5faf6",
    theme_color: "#f5faf6",
    orientation: "portrait",
    scope: "/",
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcuts: [
      { name: "Marketplace", short_name: "Market", url: "/marketplace", description: "Browse farm products" },
      { name: "My Wallet", short_name: "Wallet", url: "/wallet", description: "View your crypto wallet" },
      { name: "Training", short_name: "Training", url: "/training", description: "Agricultural training programs" },
      { name: "Funding", short_name: "Funding", url: "/funding", description: "Apply for farm funding" },
    ],
    categories: ["food", "shopping", "finance"],
    lang: "en",
  };
}
