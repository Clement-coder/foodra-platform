export function GET() {
  return new Response(
    `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /wallet
Disallow: /profile
Disallow: /orders
Disallow: /sales
Disallow: /shop

Sitemap: https://foodramarket.com/sitemap.xml
`,
    { headers: { "Content-Type": "text/plain" } }
  );
}
