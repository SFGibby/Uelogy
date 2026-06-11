'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Digitize from './Digitize';
import PasswordModal from './PasswordModal';

const CYAN = '#00f0ff';
const MAGENTA = '#ff45c8';
const AMBER = '#ffb13a';
const GREEN = '#7cff5a';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const DISPLAY = '"Geist Mono", "JetBrains Mono", ui-monospace, monospace';

// Each row of "covered" cabinets bleeds one saturated color through the plastic.
const COVERED_ROW = [MAGENTA, AMBER, CYAN, GREEN, MAGENTA, AMBER, CYAN];

export default function FlynnsInterior() {
  const router = useRouter();
  const [tronOpen, setTronOpen] = useState(false);
  const [digitizing, setDigitizing] = useState(false);

  function openLedger() {
    router.push('/grid/budget');
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(120% 70% at 50% 110%, #0a1a22 0%, #050a10 60%, #000 100%)',
        position: 'relative',
        overflow: 'hidden',
        color: CYAN,
        fontFamily: MONO,
      }}
    >
      {/* faint floor grid */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '46vh',
          background:
            'linear-gradient(180deg, transparent 0%, rgba(0,240,255,0.04) 100%)',
          backgroundImage:
            'linear-gradient(rgba(0,240,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.08) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          transform: 'perspective(700px) rotateX(60deg)',
          transformOrigin: 'bottom',
        }}
      />

      {/* back wall HOME OF TRON neon */}
      <div
        style={{
          position: 'absolute',
          top: '14vh',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 28px',
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: 'clamp(18px, 3vw, 30px)',
          letterSpacing: '0.36em',
          color: '#bff8ff',
          textShadow: `0 0 6px ${CYAN}, 0 0 18px ${CYAN}, 0 0 38px ${CYAN}aa`,
          border: `2px solid ${CYAN}`,
          boxShadow: `0 0 10px ${CYAN}, 0 0 30px ${CYAN}66, inset 0 0 14px ${CYAN}55`,
          background: 'rgba(0,20,28,0.55)',
        }}
      >
        HOME OF TRON
      </div>

      {/* row of covered cabinets behind the open one */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '34vh',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 12,
          opacity: 0.85,
        }}
      >
        {COVERED_ROW.map((color, i) => (
          <CoveredCabinet key={i} color={color} />
        ))}
      </div>

      {/* foreground floor: two playable cabinets */}
      <div
        style={{
          position: 'absolute',
          bottom: '4vh',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(40px, 8vw, 120px)',
          alignItems: 'flex-end',
        }}
      >
        <Cabinet
          label="TRON"
          accent={CYAN}
          spotlight
          onClick={() => setTronOpen(true)}
        />
        <Cabinet
          label="LEDGER"
          accent={AMBER}
          spotlight
          onClick={openLedger}
        />
      </div>

      {/* status line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 18,
          textAlign: 'center',
          fontSize: 10,
          letterSpacing: '0.36em',
          color: 'rgba(0,240,255,0.5)',
          textTransform: 'uppercase',
        }}
      >
        Inside Flynn&apos;s &middot; Pick a Cabinet
      </div>

      <PasswordModal
        gate="tron"
        title="TRON"
        hint="The cabinet hums. It wants a passcode before it boots."
        accent={CYAN}
        open={tronOpen}
        onClose={() => setTronOpen(false)}
        onSuccess={() => {
          setTronOpen(false);
          setDigitizing(true);
        }}
      />

      {digitizing && (
        <Digitize
          onComplete={() => {
            router.refresh();
          }}
        />
      )}
    </main>
  );
}

function CoveredCabinet({ color }: { color: string }) {
  return (
    <div
      aria-hidden
      style={{
        width: 'clamp(56px, 6vw, 88px)',
        height: 'clamp(140px, 18vh, 200px)',
        position: 'relative',
        background:
          'linear-gradient(180deg, rgba(80,80,80,0.18) 0%, rgba(110,110,110,0.32) 60%, rgba(60,60,60,0.18) 100%)',
        boxShadow: `0 0 22px ${color}55, inset 0 0 18px ${color}33`,
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* plastic wrinkle */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(95deg, rgba(255,255,255,0.05) 0 4px, transparent 4px 14px), repeating-linear-gradient(80deg, rgba(255,255,255,0.04) 0 6px, transparent 6px 18px)',
        }}
      />
      {/* color bleed at the bottom */}
      <div
        style={{
          position: 'absolute',
          left: '12%',
          right: '12%',
          bottom: 8,
          height: 4,
          background: color,
          filter: `blur(3px)`,
          opacity: 0.7,
        }}
      />
    </div>
  );
}

function Cabinet({
  label,
  accent,
  spotlight,
  onClick,
}: {
  label: string;
  accent: string;
  spotlight?: boolean;
  onClick: () => void;
}) {
  return (
    <div style={{ position: 'relative' }}>
      {spotlight && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -20,
            transform: 'translateX(-50%)',
            width: 220,
            height: 320,
            background: `radial-gradient(50% 60% at 50% 100%, ${accent}33 0%, transparent 70%)`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      <button
        onClick={onClick}
        aria-label={`${label} cabinet`}
        style={{
          position: 'relative',
          zIndex: 1,
          width: 'clamp(120px, 14vw, 170px)',
          height: 'clamp(240px, 36vh, 360px)',
          background: 'linear-gradient(180deg, #0c1418 0%, #050a0d 100%)',
          border: `2px solid ${accent}`,
          boxShadow: `0 0 18px ${accent}88, inset 0 0 14px ${accent}33`,
          cursor: 'pointer',
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          fontFamily: DISPLAY,
          color: accent,
        }}
      >
        <span
          style={{
            fontSize: 14,
            letterSpacing: '0.36em',
            textShadow: `0 0 8px ${accent}`,
          }}
        >
          {label}
        </span>
        {/* screen */}
        <span
          aria-hidden
          style={{
            marginTop: 12,
            width: '100%',
            height: '34%',
            background: '#000',
            border: `1px solid ${accent}66`,
            boxShadow: `inset 0 0 10px ${accent}66`,
          }}
        />
        {/* controls bay */}
        <span
          aria-hidden
          style={{
            marginTop: 'auto',
            marginBottom: 14,
            width: '90%',
            height: 22,
            background: 'linear-gradient(180deg, #1a1f23 0%, #0c1014 100%)',
            border: `1px solid ${accent}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          <span style={{ width: 6, height: 6, background: accent, borderRadius: '50%' }} />
          <span style={{ width: 6, height: 6, background: '#ff5050', borderRadius: '50%' }} />
          <span style={{ width: 18, height: 4, background: accent, opacity: 0.7 }} />
        </span>
      </button>
    </div>
  );
}
