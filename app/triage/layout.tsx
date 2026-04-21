import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import TriageHeader from './_components/TriageHeader';
import TriageWidget from './_components/TriageWidget';
import './triage.css';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SunPower · Triage',
  description: 'In-appointment backup for SunPower sales reps.',
  icons: {
    icon: [
      { url: '/sunpower/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/sunpower/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/sunpower/apple-touch-icon.png',
  },
};

export default function TriageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${figtree.variable} triage-root`}>
      <TriageHeader />
      {children}
      <TriageWidget />
    </div>
  );
}
