import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/lib/pwa/register";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BiteLens — Food Scanner",
  description: "Scan packaged food, see what's in it, decide instantly.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "BiteLens", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/icon", sizes: "32x32", type: "image/png" },
      { url: "/icon1", sizes: "192x192", type: "image/png" },
      { url: "/icon2", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg text-text">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
