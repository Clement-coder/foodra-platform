import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Foodra - Empowering Nigerian Farmers",
    short_name: "Foodra",
    description: "Blockchain-powered AgriTech platform connecting farmers with markets, training, and funding across Africa.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#118C4C",
    orientation: "portrait",
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    categories: ["food", "shopping", "finance"],
    lang: "en",
  };
}
