'use client';

import { usePathname } from 'next/navigation';
import TriageWidget from './TriageWidget';

// Hide the floating widget on /triage/demo — the demo IS the chat surface,
// so a second floating chat would be redundant.
export default function TriageWidgetMount() {
  const pathname = usePathname();
  if (pathname === '/triage/demo') return null;
  return <TriageWidget />;
}
