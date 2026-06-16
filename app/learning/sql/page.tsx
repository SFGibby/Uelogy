'use client';

import dynamic from 'next/dynamic';
import ReturnHome from '../../../components/site/ReturnHome';

const SQLLearn = dynamic(() => import('../../../components/SQLLearn'), { ssr: false });

export default function SQLPage() {
  return (
    <>
      <ReturnHome variant="bell" href="/learning" label="Hallway" />
      <SQLLearn />
    </>
  );
}
