import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import PrimaryNav from '../../../components/sales-ops/PrimaryNav';
import OrgChart from '../../../components/sales-ops/OrgChart';

export const dynamic = 'force-dynamic';

export default async function OrgPage() {
  const store = await cookies();
  if (store.get('sales_ops_auth')?.value !== '1') redirect('/sales-ops');
  return (
    <>
      <PrimaryNav />
      <OrgChart />
    </>
  );
}
