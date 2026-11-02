import type { ReactNode } from 'react';
import { Archivo_Black, Geist, Geist_Mono } from 'next/font/google';
import FeedbackWidget from '../../components/sales-ops/FeedbackWidget';
import PageviewBeacon from '../../components/sales-ops/PageviewBeacon';
import ScreenshotSignals from '../../components/sales-ops/ScreenshotSignals';

const archivo = Archivo_Black({ subsets: ['latin'], weight: '400', variable: '--font-gibson-display', display: 'swap' });
const geist = Geist({ subsets: ['latin'], variable: '--font-gibson-sans', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-gibson-mono', display: 'swap' });

export default function SalesOpsLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${archivo.variable} ${geist.variable} ${geistMono.variable}`}
      style={{ minHeight: '100vh', background: '#0D1023' }}
    >
      {children}
      <PageviewBeacon />
      <ScreenshotSignals />
      <FeedbackWidget />
    </div>
  );
}
