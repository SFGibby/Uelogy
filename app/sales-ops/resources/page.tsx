import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import PrimaryNav from '../../../components/sales-ops/PrimaryNav';
import ResourceGuide from '../../../components/sales-ops/ResourceGuide';
import { parseResources } from '../../../lib/sales-ops/parse-resources';

export const dynamic = 'force-dynamic';

export default async function ResourcesPage() {
  const store = await cookies();
  if (store.get('sales_ops_auth')?.value !== '1') redirect('/sales-ops');

  const tabs = parseResources();

  return (
    <>
      <PrimaryNav />
      <ResourceGuide tabs={tabs} />
    </>
  );
}
