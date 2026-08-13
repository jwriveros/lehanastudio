import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { VhFixer } from "../components/utils/VhFixer";
import Script from "next/script";

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
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // CAMBIA ESTE NÚMERO CADA VEZ QUE SUBAS ALGO IMPORTANTE A GITHUB
  const APP_VERSION = "1.0.5";

  return (
    // suppressHydrationWarning evita advertencias de Next.js cuando next-themes modifica las clases de <html>
    <html lang="es" className="h-full" suppressHydrationWarning>
      <head>
        {/* Script para limpiar caché si la versión cambia */}
        <Script id="cache-cleaner" strategy="beforeInteractive">
          {`
            (function() {
              const currentVersion = "${APP_VERSION}";
              const lastVersion = localStorage.getItem('app_version');
              if (lastVersion !== currentVersion) {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(regs => {
                    for(let reg of regs) reg.unregister();
                  });
                }
                localStorage.clear();
                sessionStorage.clear();
                localStorage.setItem('app_version', currentVersion);
                window.location.reload(true);
              }
            })();
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-200`}
      >
        <VhFixer />
        {/* Providers envuelve la aplicación permitiendo el cambio de tema global */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}