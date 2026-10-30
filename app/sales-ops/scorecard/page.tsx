import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import PrimaryNav from '../../../components/sales-ops/PrimaryNav';
import HubGibson from '../../../components/sales-ops/HubGibson';

export const dynamic = 'force-dynamic';

export default async function ScorecardPage() {
  const store = await cookies();
  if (store.get('sales_ops_auth')?.value !== '1') redirect('/sales-ops');
  return (
    <>
      <PrimaryNav />
      <HubGibson />
    </>
  );
}
