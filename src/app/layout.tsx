import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/layout/Footer";
import FloatingDoodles from "@/components/3d/FloatingDoodles";
import AppProviders from "@/components/layout/AppProviders";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shiv AI — 3D AI Image Generator & Creative Studio",
  description: "Turn your imagination into images. Create stunning photorealistic, 3D animated, and cinematic AI artwork from simple text prompts with 50 free credits daily.",
  keywords: ["AI Image Generator", "Text to Image", "AI Art India", "Photorealistic AI", "3D AI Generator", "Shiv AI", "Prompt Assistant"],
  authors: [{ name: "Shiv AI Creative Lab" }],
  openGraph: {
    title: "Shiv AI — Turn Your Imagination Into Images",
    description: "Futuristic 3D scroll-driven AI image generator with daily free credits, 11 artistic styles, and prompt intelligence.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#050713] text-slate-100 antialiased selection:bg-purple-600 selection:text-white flex flex-col justify-between relative">
        {/* Ambient floating doodle universe in background */}
        <FloatingDoodles />

        {/* Global App Providers (Navbar + Global Auth Modal) */}
        <AppProviders>
          <main className="flex-1 relative z-10">{children}</main>
        </AppProviders>

        {/* Global Footer */}
        <Footer />
      </body>
    </html>
  );
}
