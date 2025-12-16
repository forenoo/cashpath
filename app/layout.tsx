import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// Fonts configuration
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  ? process.env.NEXT_PUBLIC_BASE_URL
  : "http://localhost:3000";

// Metadata configuration for SEO, social sharing, and browser display
export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Cashpath | Perencanaan Keuangan & Simulasi Masa Depan",
    template: "%s | Cashpath",
  },
  description:
    "Bukan sekadar pencatat pengeluaran. Cashpath membantu kamu mensimulasikan masa depan finansial, membangun habit menabung, dan mencapai financial goals dengan fitur yang mudah digunakan.",
  keywords: [
    "Aplikasi Keuangan",
    "Financial Planner",
    "Simulasi Tabungan",
    "Expense Tracker",
    "Cara Mengatur Keuangan",
    "Cashpath",
  ],
  authors: [{ name: "Foreno Faisal Fahri", url: baseUrl }],
  creator: "Foreno Faisal Fahri",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: baseUrl,
    siteName: "Cashpath",
    title: "Cashpath: Perencanaan Keuangan & Simulasi Masa Depan",
    description:
      "Bukan sekadar pencatat pengeluaran. Cashpath membantu kamu mensimulasikan masa depan finansial, membangun habit menabung, dan mencapai financial goals dengan fitur yang mudah digunakan.",
    images: [
      {
        url: "/og-image-id.png",
        width: 1200,
        height: 630,
        alt: "Preview Aplikasi Cashpath",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cashpath: Perencanaan Keuangan & Simulasi Masa Depan",
    description:
      "Bukan sekadar pencatat pengeluaran. Cashpath membantu kamu mensimulasikan masa depan finansial, membangun habit menabung, dan mencapai financial goals dengan fitur yang mudah digunakan.",
    images: ["/twitter-image-id.png"],
    creator: "@forenoo",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: "./",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}
      >
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
