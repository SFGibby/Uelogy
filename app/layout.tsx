import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import "./globals.css";

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Samuel Gibson",
  description: "Director of IT & Business Systems",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${vt323.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <nav style={{fontFamily:'var(--font-vt323), monospace', borderBottom:'1px solid #1aaa1a', background:'#000'}}>
          <div style={{maxWidth:'900px', margin:'0 auto', padding:'10px 24px', display:'flex', gap:'32px', alignItems:'center'}}>
            <a href="/" style={{color:'#33ff33', textDecoration:'none', fontSize:'18px', textShadow:'0 0 6px #33ff33'}}>UELOGY</a>
            <a href="/sql" style={{color:'#1aaa1a', textDecoration:'none', fontSize:'18px'}}>SQL</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
