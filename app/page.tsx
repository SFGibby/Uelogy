'use client';

import dynamic from 'next/dynamic';

const BlockDrop = dynamic(() => import('../components/BlockDrop'), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-12" style={{fontFamily:'var(--font-vt323), monospace', color:'#33ff33', textShadow:'0 0 8px #33ff33'}}>
        <div className="text-2xl tracking-widest mb-1">SAMUEL GIBSON</div>
        <div className="text-lg" style={{color:'#1aaa1a'}}>DIRECTOR OF IT &amp; BUSINESS SYSTEMS</div>
        <div className="text-base mt-1" style={{color:'#0d660d'}}>SUNPOWER // SOLAR // AUTOMATION</div>
      </div>

      {/* Game */}
      <BlockDrop />

      {/* Scroll hint */}
      <div className="mt-16 text-white/20 font-mono text-xs tracking-widest animate-bounce">
        scroll down ↓
      </div>
    </main>
  );
}
