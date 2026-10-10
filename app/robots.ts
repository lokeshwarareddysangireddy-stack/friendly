import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${SITE.domain}`;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/checkout",
          "/cart",
          "/order/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
