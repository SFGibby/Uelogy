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
    <html lang="en" className={`${vt323.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <nav style={{
          background: '#111',
          borderBottom: '1px solid #222',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            maxWidth: '960px',
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            gap: '28px',
            alignItems: 'center',
          }}>
            <a href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 600, letterSpacing: '0.03em' }}>HOME</a>
            <a href="/learning" style={{ color: '#888', textDecoration: 'none', fontSize: '14px', fontWeight: 400, letterSpacing: '0.03em' }}>LEARNING</a>
            <a href="/collection" style={{ color: '#888', textDecoration: 'none', fontSize: '14px', fontWeight: 400, letterSpacing: '0.03em' }}>COLLECTION</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
