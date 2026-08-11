'use client';

// Sam's Arcade — the home page scene. Replaces the old Tetris-gate hero.
// Mobile-first single column; desktop reflows into back wall + cabinet row + side bulletin.

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ArcadeCabinet, { type Score } from './ArcadeCabinet';
import ArcadeCarpet from './ArcadeCarpet';
import ExitSign from './ExitSign';
import MuteToggle, { useMute } from './MuteToggle';
import OperatorsLicense from './OperatorsLicense';
import PasswordModal from '../grid/PasswordModal';
import { fetchAllTopScores } from '../../lib/leaderboards';
import type { LeaderboardGame } from '../../lib/supabase';

const TetrisCabinetOverlay = dynamic(
  () => import('../games/TetrisCabinetOverlay'),
  { ssr: false }
);
const BlockDropDemo = dynamic(() => import('./demos/BlockDropDemo'), { ssr: false });
const LightcycleDemo = dynamic(() => import('./demos/LightcycleDemo'), { ssr: false });
const LedgerVineDemo = dynamic(() => import('./demos/LedgerVineDemo'), { ssr: false });
const DojoQueryDemo = dynamic(() => import('./demos/DojoQueryDemo'), { ssr: false });
const CardFlipDemo = dynamic(() => import('./demos/CardFlipDemo'), { ssr: false });
const OfficeChatDemo = dynamic(() => import('./demos/OfficeChatDemo'), { ssr: false });
const HustleTickerDemo = dynamic(() => import('./demos/HustleTickerDemo'), { ssr: false });

const SOCIALS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/samuelfgibson/' },
  { label: 'Instagram', href: 'https://www.instagram.com/samuelgibby/' },
  { label: 'Letterboxd', href: 'https://boxd.it/10W7.5' },
  { label: 'Beli', href: 'https://beliapp.co/app/SolemnX' },
  { label: 'Facebook', href: 'https://www.facebook.com/samuel.gibson.73/' },
];

const WHAT_I_DO = [
  {
    title: 'SunPower',
    desc: 'Director of Business Systems. I keep the day-to-day tech, automations, and reporting running across a residential solar company.',
  },
  {
    title: 'RT Management',
    desc: 'Same systems playbook on the side for another sales team — integrations, automations, executive reporting.',
  },
  {
    title: 'Ride Southern Utah',
    desc: 'Admin since 2012 for the bike event org. 500–1,000 riders per race, plus the new site they needed.',
  },
];

const AMBIENT_SRC = '/sfx/arcade-ambient.mp3';

// Fun static fallbacks for cabinets without a real game leaderboard.
const FALLBACKS: Record<string, Score[]> = {
  ledger: [
    { rank: 1, initials: 'SAM', score: 400000 },
    { rank: 2, initials: 'UEL', score: 315000 },
    { rank: 3, initials: 'IRA', score: 220000 },
  ],
  collection: [
    { rank: 1, initials: 'MTG', score: 999000 },
    { rank: 2, initials: 'PSA', score: 730000 },
    { rank: 3, initials: 'HOF', score: 610000 },
  ],
  office: [
    { rank: 1, initials: 'P0', score: 999999 },
    { rank: 2, initials: 'P1', score: 512000 },
    { rank: 3, initials: 'P2', score: 240000 },
  ],
  hustle: [
    { rank: 1, initials: 'SAM', score: 480000 },
    { rank: 2, initials: 'CAM', score: 310000 },
    { rank: 3, initials: 'RSU', score: 200000 },
  ],
};

export default function SamsInterior() {
  const router = useRouter();
  const [tronOpen, setTronOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [tetrisOpen, setTetrisOpen] = useState(false);
  const [scores, setScores] = useState<Record<LeaderboardGame, Score[]>>({
    grid: [],
    tetris: [],
    learning: [],
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted] = useMute();

  // One fetch on mount, distribute per-cabinet. Empty games fall back to static tables.
  useEffect(() => {
    let alive = true;
    fetchAllTopScores(3).then((groups) => {
      if (alive) setScores(groups);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Ambient audio. Missing-safe — if /sfx/arcade-ambient.mp3 isn't dropped yet, we just don't play.
  useEffect(() => {
    const audio = new Audio(AMBIENT_SRC);
    audio.loop = true;
    audio.volume = 0.22;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (muted) {
      a.pause();
    } else if (!tetrisOpen) {
      void a.play().catch(() => {});
    } else {
      a.pause();
    }
  }, [muted, tetrisOpen]);

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(120% 80% at 50% 0%, #0a1a22 0%, #050810 60%, #000 100%)',
        color: '#e8e8e8',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px 16px 80px',
      }}
    >
      {/* Arcade carpet floor with perspective */}
      <ArcadeCarpet />

      <div
        className="sams-grid"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gap: 24,
        }}
      >
        {/* Back wall: marquee + Sam sprite */}
        <header
          className="sams-marquee"
          style={{
            textAlign: 'center',
            paddingTop: 12,
          }}
        >
          <h1
            style={{
              fontFamily: '"Geist Mono", ui-monospace, monospace',
              fontSize: 'clamp(48px, 9vw, 96px)',
              fontWeight: 900,
              letterSpacing: '0.04em',
              margin: 0,
              color: '#ffe1c8',
              textShadow:
                '0 0 6px #ff8a3a, 0 0 18px #ff6a18, 0 0 38px #ff4a08, 0 0 70px rgba(255,106,24,0.55)',
            }}
          >
            SAM&apos;S
          </h1>
          <div
            style={{
              marginTop: 6,
              fontFamily: 'var(--font-vt323), monospace',
              color: '#33ff33',
              fontSize: 13,
              letterSpacing: '0.36em',
              textShadow: '0 0 6px #33ff33',
            }}
          >
            ARCADE · EVERYTHING IS A GAME
          </div>
          {/* Sprite lives as ambient decoration walking the arcade — see SamAmbient below */}
        </header>

        {/* Front row */}
        <section
          className="sams-cabinets"
          style={{
            display: 'grid',
            gap: 20,
            justifyItems: 'center',
          }}
        >
          <ArcadeCabinet
            marquee="GRID"
            accent="#00f0ff"
            locked
            onActivate={() => setTronOpen(true)}
            demo={<LightcycleDemo />}
            scores={scores.grid}
            startOffsetMs={0}
            stateDurationMs={6500}
            ariaLabel="Grid — locked cabinet, opens password"
          />
          <ArcadeCabinet
            marquee="LEDGER"
            accent="#6b8e4e"
            locked
            onActivate={() => setLedgerOpen(true)}
            demo={<LedgerVineDemo />}
            fallbackScores={FALLBACKS.ledger}
            startOffsetMs={1500}
            stateDurationMs={9200}
            ariaLabel="Ledger — locked cabinet, opens password"
          />
          <ArcadeCabinet
            marquee="DOJO"
            accent="#f0c060"
            href="/learning"
            demo={<DojoQueryDemo />}
            scores={scores.learning}
            startOffsetMs={3000}
            stateDurationMs={7800}
            ariaLabel="Dojo — learning notes"
          />
          <ArcadeCabinet
            marquee="COLLECTION"
            accent="#d040a0"
            href="/collection"
            demo={<CardFlipDemo />}
            fallbackScores={FALLBACKS.collection}
            startOffsetMs={4500}
            stateDurationMs={10400}
            ariaLabel="Collection — gallery"
          />
          <ArcadeCabinet
            marquee="OFFICE"
            accent="#ffb020"
            href="/triage"
            demo={<OfficeChatDemo />}
            fallbackScores={FALLBACKS.office}
            startOffsetMs={6000}
            stateDurationMs={6100}
            ariaLabel="Office — triage chat"
          />
        </section>

        {/* Back row */}
        <section
          className="sams-back"
          aria-label="Back row"
          style={{
            display: 'grid',
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-vt323), monospace',
              color: 'rgba(51,255,51,0.55)',
              fontSize: 12,
              letterSpacing: '0.36em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Back row
          </div>
          <div
            className="sams-back-row"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 20,
              justifyItems: 'center',
            }}
          >
            <ArcadeCabinet
              marquee="TETRIS"
              accent="#33ff33"
              onActivate={() => setTetrisOpen(true)}
              demo={<BlockDropDemo />}
              scores={scores.tetris}
              startOffsetMs={750}
              stateDurationMs={8600}
              ariaLabel="Tetris — playable"
            />
            <ArcadeCabinet
              marquee="HUSTLE"
              accent="#ffd700"
              href="/hustle"
              demo={<HustleTickerDemo />}
              fallbackScores={FALLBACKS.hustle}
              startOffsetMs={2250}
              stateDurationMs={7300}
              ariaLabel="Hustle — client roster (coming soon)"
            />
          </div>
        </section>

        {/* Operator's License — below the fold, quiet */}
        <OperatorsLicense cards={WHAT_I_DO} />

        {/* EXIT sign absorbs the social/contact links */}
        <section
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 24,
          }}
        >
          <ExitSign socials={SOCIALS} email="sam@uelogy.com" />
        </section>
      </div>

      <MuteToggle />

      <PasswordModal
        gate="tron"
        title="The Grid"
        hint="The cabinet hums. It wants a passcode before it boots."
        accent="#00f0ff"
        open={tronOpen}
        onClose={() => setTronOpen(false)}
        onSuccess={() => {
          setTronOpen(false);
          router.push('/grid');
        }}
      />

      <PasswordModal
        gate="ledger"
        title="The Ledger"
        hint="A brass key turns in the leaded-glass door."
        accent="#6b8e4e"
        open={ledgerOpen}
        onClose={() => setLedgerOpen(false)}
        onSuccess={() => {
          setLedgerOpen(false);
          router.push('/ledger');
        }}
      />

      {tetrisOpen && <TetrisCabinetOverlay onClose={() => setTetrisOpen(false)} />}

      <style>{`
        @media (min-width: 768px) {
          .sams-cabinets {
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            justify-items: center;
          }
        }
        @media (min-width: 1024px) {
          .sams-grid { gap: 40px; }
          .sams-cabinets { grid-template-columns: repeat(5, minmax(0, 1fr)); }
          .sams-cabinets > * { max-width: 100%; }
        }
      `}</style>
    </main>
  );
}
