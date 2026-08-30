import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "METIX — Platform Tiketing Event Konser & Festival",
  description: "Beli tiket resmi event, konser musik, seminar, dan festival pilihan Anda.",
  icons: {
    icon: [
      { url: "/icon_metix.jpeg", type: "image/jpeg" },
      { url: "/icon.jpeg", type: "image/jpeg" },
    ],
    shortcut: "/icon_metix.jpeg",
    apple: "/icon_metix.jpeg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
