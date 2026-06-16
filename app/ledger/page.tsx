import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TheLedger from '../../components/ledger/TheLedger';

export const dynamic = 'force-dynamic';

export default async function LedgerPage() {
  const store = await cookies();
  const ok = store.get('ledger_auth')?.value === '1';
  if (!ok) redirect('/');
  return <TheLedger />;
}
