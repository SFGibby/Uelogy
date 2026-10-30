import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import PrimaryNav from '../../../components/sales-ops/PrimaryNav';
import OpsMap from '../../../components/sales-ops/map/OpsMap';

export const dynamic = 'force-dynamic';

export default async function MapPage() {
  const store = await cookies();
  if (store.get('sales_ops_auth')?.value !== '1') redirect('/sales-ops');

  return (
    <>
      <PrimaryNav />
      <OpsMap />
    </>
  );
}
