'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const BlockDrop = dynamic(() => import('../components/BlockDrop'), { ssr: false });

const termStyle: React.CSSProperties = {
  fontFamily: 'var(--font-vt323), monospace',
  color: '#33ff33',
  textShadow: '0 0 8px #33ff33',
};

const SOCIALS = [
  { label: 'LINKEDIN', href: 'https://www.linkedin.com/in/samuelfgibson/' },
  { label: 'INSTAGRAM', href: 'https://www.instagram.com/samuelgibby/' },
  { label: 'FACEBOOK', href: 'https://www.facebook.com/samuel.gibson.73/' },
];

export default function Home() {
  const [milestone, setMilestone] = useState(0);

  const handleMilestone = (level: number) => {
    setMilestone(prev => Math.max(prev, level));
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-10" style={termStyle}>
        <div className="text-3xl tracking-widest mb-1">SAMUEL GIBSON</div>
        {milestone >= 1 && (
          <div className="reveal text-lg mt-1" style={{ color: '#1aaa1a', textShadow: 'none' }}>
            DIRECTOR OF IT &amp; BUSINESS SYSTEMS
          </div>
        )}
        {milestone >= 2 && (
          <div className="reveal text-base mt-1" style={{ color: '#0d660d', textShadow: 'none' }}>
            SUNPOWER // SOLAR // AUTOMATION
          </div>
        )}
        {milestone >= 3 && (
          <div className="reveal flex gap-5 justify-center mt-3">
            {SOCIALS.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#1aaa1a', textDecoration: 'none', fontSize: '14px', letterSpacing: '0.05em' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#33ff33')}
                onMouseLeave={e => (e.currentTarget.style.color = '#1aaa1a')}
              >
                [{s.label}]
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Game */}
      <BlockDrop onMilestone={handleMilestone} />

      {/* Scroll hint */}
      <div className="mt-16 text-white/20 font-mono text-xs tracking-widest animate-bounce">
        scroll down ↓
      </div>
    </main>
  );
}
