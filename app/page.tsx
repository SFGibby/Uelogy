'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const BlockDrop = dynamic(() => import('../components/BlockDrop'), { ssr: false });

const SOCIALS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/samuelfgibson/' },
  { label: 'Instagram', href: 'https://www.instagram.com/samuelgibby/' },
  { label: 'Facebook', href: 'https://www.facebook.com/samuel.gibson.73/' },
];

const WHAT_I_DO = [
  {
    icon: '⚙️',
    title: 'IT Leadership',
    desc: 'Director of IT & Business Systems at SunPower. Managing infrastructure, teams, and the technology that keeps operations running.',
  },
  {
    icon: '🔁',
    title: 'Systems & Automation',
    desc: 'Building workflows and integrations that eliminate busywork — connecting business tools so they actually talk to each other.',
  },
  {
    icon: '☀️',
    title: 'Solar Industry',
    desc: 'Working at the intersection of clean energy and enterprise tech. SunPower is one of the most recognized names in residential solar.',
  },
];

const PHOTOS = [
  { src: '/photos/utah-group.jpg',  alt: 'Family reunion at the red rocks' },
  { src: '/photos/milky-way.jpg',   alt: 'Milky Way over Lake Powell' },
  { src: '/photos/lake-powell.jpg', alt: 'Friends at Lake Powell' },
  { src: '/photos/volleyball.jpg',  alt: 'Volleyball in the water' },
  { src: '/photos/zion.jpg',        alt: 'The Narrows, Zion National Park' },
  { src: '/photos/leeds.jpg',       alt: 'Leeds Christmas market' },
];

const term: React.CSSProperties = {
  fontFamily: 'var(--font-vt323), monospace',
  color: '#33ff33',
  textShadow: '0 0 8px #33ff33',
};

export default function Home() {
  const [milestone, setMilestone] = useState(0);
  const [gameVisible, setGameVisible] = useState(true);

  const showGame = () => {
    setMilestone(0);
    setGameVisible(true);
  };

  return (
    <>
      {/* ──────────── GAME OVERLAY ──────────── */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 20px',
        transition: 'opacity 0.9s ease, visibility 0.9s',
        opacity: gameVisible ? 1 : 0,
        visibility: gameVisible ? 'visible' : 'hidden',
        pointerEvents: gameVisible ? 'all' : 'none',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20, ...term }}>
          <div style={{ fontSize: 32, letterSpacing: '0.1em' }}>SAMUEL GIBSON</div>
          {milestone >= 1 && (
            <div className="reveal" style={{ fontSize: 16, color: '#1aaa1a', textShadow: 'none', marginTop: 4 }}>
              DIRECTOR OF IT &amp; BUSINESS SYSTEMS
            </div>
          )}
          {milestone >= 2 && (
            <div className="reveal" style={{ fontSize: 14, color: '#0d660d', textShadow: 'none', marginTop: 4 }}>
              SUNPOWER · SOLAR · AUTOMATION
            </div>
          )}
          {milestone >= 3 && (
            <div className="reveal" style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 10 }}>
              {SOCIALS.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#1aaa1a', textDecoration: 'none', fontSize: 14, letterSpacing: '0.04em', ...term, textShadow: 'none' }}>
                  [{s.label.toUpperCase()}]
                </a>
              ))}
            </div>
          )}
        </div>

        <BlockDrop
          onMilestone={level => setMilestone(prev => Math.max(prev, level))}
          onGameEnd={() => setGameVisible(false)}
        />

        <div style={{ marginTop: 14, ...term, fontSize: 13, color: '#0d660d', textShadow: 'none', letterSpacing: '0.08em' }}>
          PLAY TO UNLOCK PROFILE ↓
        </div>
      </div>

      {/* ──────────── FULL PAGE ──────────── */}
      <div style={{ background: '#080810', color: '#e8e8e8', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {/* NEW GAME — fixed bottom-right */}
        <div style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 50,
          transition: 'opacity 0.6s ease 0.8s, transform 0.6s ease 0.8s',
          opacity: gameVisible ? 0 : 1,
          transform: gameVisible ? 'translateY(8px)' : 'translateY(0)',
          pointerEvents: gameVisible ? 'none' : 'all',
        }}>
          <button onClick={showGame} style={{
            background: 'rgba(0,0,0,0.7)',
            border: '1px solid #33ff33',
            color: '#33ff33',
            padding: '8px 20px',
            fontFamily: 'var(--font-vt323), monospace',
            fontSize: 16,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            borderRadius: 4,
          }}>
            NEW GAME
          </button>
        </div>

        {/* ── HERO ── */}
        <section style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px 48px 80px', maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-vt323), monospace', color: '#33ff33', fontSize: 14, letterSpacing: '0.12em', marginBottom: 20, textShadow: '0 0 6px #33ff33' }}>
            DIRECTOR OF IT &amp; BUSINESS SYSTEMS · SUNPOWER · UTAH
          </div>
          <h1 style={{ fontSize: 'clamp(52px, 9vw, 104px)', fontWeight: 900, margin: 0, lineHeight: 1, letterSpacing: -3, color: '#fff' }}>
            Samuel<br />Gibson.
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', maxWidth: 540, lineHeight: 1.7, margin: '28px 0 0' }}>
            I run IT and business systems at SunPower — building the infrastructure and automations
            that keep a solar company operating at scale. Outside of work: cards, memorabilia, and the occasional Tetris session.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 40 }}>
            {SOCIALS.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontSize: 13, letterSpacing: '0.1em', fontWeight: 700, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
                {s.label.toUpperCase()} ↗
              </a>
            ))}
          </div>
        </section>

        {/* ── WHAT I DO ── */}
        <section style={{ padding: '80px 48px', borderTop: '1px solid rgba(255,255,255,0.06)', maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-vt323), monospace', color: '#33ff33', fontSize: 14, letterSpacing: '0.12em', marginBottom: 10, textShadow: '0 0 6px #33ff33' }}>
            WHAT I DO
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 48px', letterSpacing: -0.5 }}>
            Building things that actually work.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            {WHAT_I_DO.map(card => (
              <div key={card.title} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                padding: '28px 24px',
                transition: 'border-color 0.2s, background 0.2s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(51,255,51,0.2)';
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(51,255,51,0.03)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
                }}
              >
                <div style={{ fontSize: 30, marginBottom: 14 }}>{card.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{card.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>{card.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── THE COLLECTION ── */}
        <section style={{ padding: '80px 48px', borderTop: '1px solid rgba(255,255,255,0.06)', maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-vt323), monospace', color: '#33ff33', fontSize: 14, letterSpacing: '0.12em', marginBottom: 10, textShadow: '0 0 6px #33ff33' }}>
            THE COLLECTION
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: -0.5 }}>
              Cards, memorabilia,<br />and everything in between.
            </h2>
            <a href="/collection" style={{
              padding: '10px 24px',
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.4)',
              borderRadius: 40,
              color: '#a78bfa',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.15)')}>
              View Collection →
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { label: 'MTG', color: '#f59e0b', icon: '⚔️', desc: 'Magic: The Gathering' },
              { label: 'Pokémon', color: '#ef4444', icon: '⚡', desc: 'TCG cards' },
              { label: 'Sports', color: '#3b82f6', icon: '🏅', desc: 'Cards & rookie pulls' },
              { label: 'Memorabilia', color: '#a78bfa', icon: '🏆', desc: 'Signed shoes, balls & more' },
            ].map(cat => (
              <div key={cat.label} style={{
                background: cat.color + '0d',
                border: `1px solid ${cat.color}33`,
                borderRadius: 12,
                padding: '18px 16px',
              }}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{cat.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: cat.color }}>{cat.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{cat.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── INSTAGRAM ── */}
        <section style={{ padding: '80px 48px', borderTop: '1px solid rgba(255,255,255,0.06)', maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-vt323), monospace', color: '#33ff33', fontSize: 14, letterSpacing: '0.12em', marginBottom: 10, textShadow: '0 0 6px #33ff33' }}>
            LIFE
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: -0.5 }}>
              @samuelgibby
            </h2>
            <a href="https://www.instagram.com/samuelgibby/" target="_blank" rel="noopener noreferrer"
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, rgba(131,58,180,0.2), rgba(253,29,29,0.2), rgba(252,176,69,0.2))',
                border: '1px solid rgba(253,29,29,0.3)',
                borderRadius: 40,
                color: '#fda4af',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}>
              Follow on Instagram ↗
            </a>
          </div>

          {/* Photo grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, maxWidth: 600 }}>
            {PHOTOS.map((photo, i) => (
              <a
                key={i}
                href="https://www.instagram.com/samuelgibby/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  aspectRatio: '1',
                  display: 'block',
                  overflow: 'hidden',
                  borderRadius: 4,
                  position: 'relative',
                }}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease, filter 0.3s ease',
                    filter: 'brightness(0.85)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.06)';
                    (e.currentTarget as HTMLImageElement).style.filter = 'brightness(1)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)';
                    (e.currentTarget as HTMLImageElement).style.filter = 'brightness(0.85)';
                  }}
                />
              </a>
            ))}
          </div>
        </section>

        {/* ── CONNECT ── */}
        <section style={{ padding: '80px 48px 100px', borderTop: '1px solid rgba(255,255,255,0.06)', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-vt323), monospace', color: '#33ff33', fontSize: 14, letterSpacing: '0.12em', marginBottom: 16, textShadow: '0 0 6px #33ff33' }}>
            CONNECT
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: -0.5 }}>Say hi.</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 16, margin: '0 0 48px' }}>
            Always down to talk cards, tech, or solar.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 16 }}>
            {SOCIALS.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                style={{
                  padding: '12px 28px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 40,
                  color: 'rgba(255,255,255,0.6)',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}>
                {s.label}
              </a>
            ))}
          </div>
        </section>

      </div>
    </>
  );
}
