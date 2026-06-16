'use client';

// GridEntry orchestrates the intro sequence at /grid:
// Digitize transition → Lightcycle (with Skip) → Kanban view.

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Digitize from './Digitize';
import GridKanbanView from './GridKanbanView';

const Lightcycle = dynamic(() => import('./Lightcycle'), { ssr: false });

type Phase = 'digitize' | 'intro' | 'board';

export default function GridEntry() {
  const [phase, setPhase] = useState<Phase>('digitize');

  return (
    <>
      {phase === 'board' && <GridKanbanView />}
      {phase === 'intro' && (
        <Lightcycle
          onEnd={() => setPhase('board')}
          onSkip={() => setPhase('board')}
        />
      )}
      {phase === 'digitize' && <Digitize onComplete={() => setPhase('intro')} />}
    </>
  );
}
