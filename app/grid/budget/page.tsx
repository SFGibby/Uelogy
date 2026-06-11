import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Ledger from '../../../components/budget/Ledger';

export const dynamic = 'force-dynamic';

export default async function BudgetPage() {
  const store = await cookies();
  const flynns = store.get('flynns_auth')?.value === '1';
  if (!flynns) redirect('/grid');
  return <Ledger />;
}
