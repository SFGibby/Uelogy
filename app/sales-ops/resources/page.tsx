import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import PrimaryNav from '../../../components/sales-ops/PrimaryNav';

export const dynamic = 'force-dynamic';

export default async function ResourcesPage() {
  const store = await cookies();
  if (store.get('sales_ops_auth')?.value !== '1') redirect('/sales-ops');

  return (
    <div style={{ background: '#162241', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PrimaryNav />
      <iframe
        src="/sales-ops/resources.html"
        title="Resource Guide"
        style={{ flex: 1, border: 'none', width: '100%', minHeight: 'calc(100vh - 55px)', background: '#fff' }}
      />
    </div>
  );
}
