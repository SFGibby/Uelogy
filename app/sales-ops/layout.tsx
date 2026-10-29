import type { ReactNode } from 'react';
import FeedbackWidget from '../../components/sales-ops/FeedbackWidget';

export default function SalesOpsLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      {children}
      <FeedbackWidget />
    </div>
  );
}
