'use client';

import dynamic from 'next/dynamic';

const CollectionTracker = dynamic(() => import('../../components/collection/CollectionTracker'), { ssr: false });

export default function CollectionPage() {
  return <CollectionTracker />;
}
