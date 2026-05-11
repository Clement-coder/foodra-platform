import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/wallet", "/profile", "/orders", "/sales", "/shop"],
    },
    sitemap: "https://foodramarket.com/sitemap.xml",
  };
}
