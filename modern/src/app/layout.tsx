import type { Metadata } from "next";
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
  title: "Nikart",
  description: "Nikart portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* Kept out of globals.css — the CSS pipeline drops ::view-transition-group(*). */}
        <style>{`
          ::view-transition,
          ::view-transition-group(*),
          ::view-transition-image-pair(*),
          ::view-transition-old(*),
          ::view-transition-new(*) {
            pointer-events: none;
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}
