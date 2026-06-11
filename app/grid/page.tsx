import { cookies } from 'next/headers';
import FlynnsExterior from '../../components/grid/FlynnsExterior';
import FlynnsInterior from '../../components/grid/FlynnsInterior';
import GridKanbanView from '../../components/grid/GridKanbanView';

export const dynamic = 'force-dynamic';

export default async function GridPage() {
  const store = await cookies();
  const flynns = store.get('flynns_auth')?.value === '1';
  const grid = store.get('grid_auth')?.value === '1';

  if (!flynns) return <FlynnsExterior />;
  if (!grid) return <FlynnsInterior />;
  return <GridKanbanView />;
}
