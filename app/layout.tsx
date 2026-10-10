import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.friendlybasket.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description:
    "Friendly Basket is your local delivery partner for cafe-style food, biryanis, curries, groceries, fruits, vegetables and health essentials. Order online or on WhatsApp.",
  keywords: [
    "Friendly Basket",
    "local delivery",
    "online grocery",
    "food delivery",
    "biryani",
    "WhatsApp ordering",
  ],
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.supportingTagline,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.supportingTagline,
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: "#22c55e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jakarta.variable} ${fraunces.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
