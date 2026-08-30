import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/how-it-works",
    "/apply",
    "/pennsylvania",
    "/official-sites",
    "/faq",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/refund",
    "/disclaimer",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
  }));
}
