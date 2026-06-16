'use client';

// Sam's Arcade — the home page scene. Replaces the old Tetris-gate hero.
// Mobile-first single column; desktop reflows into back wall + cabinet row + side bulletin.

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Bulletin from './Bulletin';
import Cabinet from './Cabinet';
import MuteToggle, { useMute } from './MuteToggle';
import PasswordModal from '../grid/PasswordModal';
import SocialNeons from './SocialNeons';

const SamSprite = dynamic(() => import('../SamSprite'), { ssr: false });
const TetrisCabinetOverlay = dynamic(
  () => import('../games/TetrisCabinetOverlay'),
  { ssr: false }
);

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

export default function SamsInterior() {
  const router = useRouter();
  const [tronOpen, setTronOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [tetrisOpen, setTetrisOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted] = useMute();

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
      {/* Faint floor grid suggestion */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(0,240,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage:
            'linear-gradient(180deg, transparent 0%, transparent 50%, black 100%)',
          WebkitMaskImage:
            'linear-gradient(180deg, transparent 0%, transparent 50%, black 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

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
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: 10,
            }}
          >
            <div style={{ transform: 'scale(1.6)', transformOrigin: 'bottom center' }}>
              <SamSprite />
            </div>
          </div>
          <div
            aria-hidden
            style={{
              width: 96,
              height: 8,
              borderRadius: '50%',
              background: 'rgba(51,255,51,0.12)',
              filter: 'blur(4px)',
              margin: '8px auto 0',
            }}
          />
        </header>

        {/* Cabinet column → desktop becomes a row */}
        <section
          className="sams-cabinets"
          style={{
            display: 'grid',
            gap: 16,
          }}
        >
          <Cabinet
            label="The Grid"
            variant="grid"
            sublabel="PROJECT TRACKER"
            locked
            onClick={() => setTronOpen(true)}
          />
          <Cabinet
            label="The Ledger"
            variant="ledger"
            sublabel="HOUSEHOLD BOOK"
            locked
            onClick={() => setLedgerOpen(true)}
          />
          <Cabinet
            label="Learning"
            variant="learning"
            sublabel="HALLWAY"
            href="/learning"
          />
          <Cabinet
            label="Collection"
            variant="collection"
            sublabel="GALLERY"
            href="/collection"
          />
          <Cabinet
            label="Tetris"
            variant="tetris"
            sublabel="PRESS START"
            onClick={() => setTetrisOpen(true)}
          />
        </section>

        {/* Also here — back row */}
        <section
          aria-label="Also here"
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
            Also here
          </div>
          <div
            className="sams-back-row"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            <Cabinet
              label="Triage"
              variant="triage"
              sublabel="WORK"
              href="/triage"
            />
            <Cabinet label="Soon" variant="covered" sublabel="—" />
            <Cabinet label="Soon" variant="covered" sublabel="—" />
          </div>
        </section>

        {/* Bulletin */}
        <Bulletin cards={WHAT_I_DO} header="What I Do" />

        {/* Social neons above the (figurative) door */}
        <section
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <SocialNeons socials={SOCIALS} />
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
        @media (min-width: 1024px) {
          .sams-grid {
            grid-template-columns: 1.4fr 1fr;
            grid-template-areas:
              "marquee marquee"
              "cabinets bulletin"
              "back back"
              "socials socials";
            gap: 32px;
          }
          .sams-marquee { grid-area: marquee; }
          .sams-cabinets { grid-area: cabinets; grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .sams-cabinets > * { max-width: 100%; }
        }
        @media (min-width: 1280px) {
          .sams-cabinets { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
      `}</style>
    </main>
  );
}
