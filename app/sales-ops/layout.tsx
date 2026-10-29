import { Instrument_Serif, Geist, Geist_Mono, Archivo_Black, Fraunces } from 'next/font/google';
import type { ReactNode } from 'react';

const geist = Geist({ subsets: ['latin'], variable: '--font-sales-ops-sans', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-sales-ops-mono', display: 'swap' });
const instrument = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-sales-ops-serif', display: 'swap' });
const instrumentItalic = Instrument_Serif({ subsets: ['latin'], weight: '400', style: 'italic', variable: '--font-sales-ops-serif-italic', display: 'swap' });
const archivo = Archivo_Black({ subsets: ['latin'], weight: '400', variable: '--font-sales-ops-display', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-sales-ops-fraunces', display: 'swap' });

export default function SalesOpsLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${geist.variable} ${geistMono.variable} ${instrument.variable} ${instrumentItalic.variable} ${archivo.variable} ${fraunces.variable}`}
      style={{ minHeight: '100vh' }}
    >
      {children}
    </div>
  );
}
