import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SalesOpsUnlock from '../../components/sales-ops/SalesOpsUnlock';

export const dynamic = 'force-dynamic';

export default async function SalesOpsPage() {
  const store = await cookies();
  const authed = store.get('sales_ops_auth')?.value === '1';
  if (authed) redirect('/sales-ops/map');
  return <SalesOpsUnlock />;
}
