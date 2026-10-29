import type { ReactNode } from 'react';
import { Archivo_Black, Geist, Geist_Mono } from 'next/font/google';
import FeedbackWidget from '../../components/sales-ops/FeedbackWidget';

const archivo = Archivo_Black({ subsets: ['latin'], weight: '400', variable: '--font-swagger-display', display: 'swap' });
const geist = Geist({ subsets: ['latin'], variable: '--font-swagger-sans', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-swagger-mono', display: 'swap' });

export default function SalesOpsLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${archivo.variable} ${geist.variable} ${geistMono.variable}`}
      style={{ minHeight: '100vh', background: '#0D1023' }}
    >
      {children}
      <FeedbackWidget />
    </div>
  );
}
