import type React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lehana Studio",
  description: "",
  applicationName: "Lehana Studio",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full flex flex-col overflow-hidden">

        {/* 🔹 NAVBAR (altura automática) */}
        <header className="shrink-0">
          {/* Aquí va tu navbar */}
        </header>

        {/* 🔹 CONTENIDO PRINCIPAL: debe tener min-h-0 */}
        <main className="flex-1 min-h-0 overflow-hidden">
          {children}
        </main>

      </body>
    </html>
  );
}
