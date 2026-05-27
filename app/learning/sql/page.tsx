'use client';

import dynamic from 'next/dynamic';
const SQLLearn = dynamic(() => import('../../../components/SQLLearn'), { ssr: false });

export default function SQLPage() {
  return <SQLLearn />;
}
