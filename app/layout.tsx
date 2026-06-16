import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import FaviconRandomizer from "../components/FaviconRandomizer";

const vt323 = localFont({
  src: "../public/fonts/VT323.woff2",
  variable: "--font-vt323",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Samuel Gibson",
  description: "Director of IT & Business Systems",
  icons: {
    icon: '/favicon-s.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${vt323.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <FaviconRandomizer />
        {children}
      </body>
    </html>
  );
}
