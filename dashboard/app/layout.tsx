import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/ui/Nav";
import { RealtimeRefresh } from "@/components/ui/RealtimeRefresh";
import { ServiceWorkerRegister } from "@/components/ui/ServiceWorkerRegister";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vektra Trader",
  description: "Autonom tradingagent — porteføljen, agentene og hva de tenker.",
  applicationName: "Vektra",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Vektra" },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0d10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="nb"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        <RealtimeRefresh />
        <ServiceWorkerRegister />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-4 sm:pt-8">
          {children}
        </main>
      </body>
    </html>
  );
}
