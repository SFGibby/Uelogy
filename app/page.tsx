'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';

const BlockDrop = dynamic(() => import('../components/BlockDrop'), { ssr: false });
const SamSprite = dynamic(() => import('../components/SamSprite'), { ssr: false });

const SOCIALS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/samuelfgibson/' },
  { label: 'Instagram', href: 'https://www.instagram.com/samuelgibby/' },
  { label: 'Facebook', href: 'https://www.facebook.com/samuel.gibson.73/' },
];

const WHAT_I_DO = [
  {
    title: 'IT Leadership',
    desc: 'Director of IT & Business Systems at SunPower. Managing infrastructure, teams, and the technology that keeps operations running.',
  },
  {
    title: 'Systems & Automation',
    desc: 'Building workflows and integrations that eliminate busywork — connecting business tools so they actually talk to each other.',
  },
  {
    title: 'Solar Industry',
    desc: 'Working at the intersection of clean energy and enterprise tech. SunPower is one of the most recognized names in residential solar.',
  },
];


const term: React.CSSProperties = {
  fontFamily: 'var(--font-vt323), monospace',
  color: '#33ff33',
  textShadow: '0 0 8px #33ff33',
};

export default function Home() {
  const [milestone, setMilestone] = useState(0);
  const [gameVisible, setGameVisible] = useState(true);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/tetris.mp3');
    audio.loop = true;
    audio.volume = 0.35;
    audioRef.current = audio;
    return () => { audio.pause(); audio.src = ''; };
  }, []);

  const playMusic = () => { audioRef.current?.play().catch(() => {}); setMusicPlaying(true); };
  const stopMusic = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setMusicPlaying(false);
  };

  const toggleMusic = () => musicPlaying ? stopMusic() : playMusic();

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

        {gameVisible && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
            <div style={{ paddingBottom: 8 }}>
              <SamSprite />
            </div>
            <BlockDrop
              audioRef={audioRef}
              onMilestone={level => setMilestone(prev => Math.max(prev, level))}
              onGameEnd={() => { stopMusic(); setGameVisible(false); }}
            />
          </div>
        )}

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ ...term, fontSize: 13, color: '#0d660d', textShadow: 'none', letterSpacing: '0.08em' }}>
            PLAY TO UNLOCK PROFILE ↓
          </div>
          <button
            onClick={() => { playMusic(); setGameVisible(false); }}
            style={{ background: 'none', border: 'none', ...term, fontSize: 12, color: '#1a4d1a', textShadow: 'none', letterSpacing: '0.08em', cursor: 'pointer', textDecoration: 'underline' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#33ff33')}
            onMouseLeave={e => (e.currentTarget.style.color = '#1a4d1a')}
          >
            SKIP →
          </button>
        </div>
      </div>

      {/* ──────────── FULL PAGE ──────────── */}
      <div style={{ background: '#080810', color: '#e8e8e8', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {/* MUSIC — fixed bottom-left */}
        <button
          onClick={toggleMusic}
          title={musicPlaying ? 'Pause music' : 'Play music'}
          style={{
            position: 'fixed',
            bottom: 28,
            left: 28,
            zIndex: 50,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: musicPlaying ? 'rgba(51,255,51,0.1)' : 'rgba(0,0,0,0.5)',
            border: `1px solid ${musicPlaying ? 'rgba(51,255,51,0.5)' : 'rgba(51,255,51,0.2)'}`,
            color: musicPlaying ? '#33ff33' : 'rgba(51,255,51,0.3)',
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(12px)',
            transition: 'opacity 0.6s ease 0.8s, transform 0.6s ease 0.8s, color 0.2s, border-color 0.2s, background 0.2s',
            opacity: gameVisible ? 0 : 1,
            transform: gameVisible ? 'translateY(8px)' : 'translateY(0)',
            pointerEvents: gameVisible ? 'none' : 'all',
            fontFamily: 'inherit',
          }}
        >
          ♪
        </button>

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
        <section style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '100px 48px 80px', maxWidth: 1000, margin: '0 auto', gap: 40 }}>
          <div style={{ flex: 1 }}>
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
          </div>

          {/* 8-bit Sam */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, paddingTop: 40 }}>
            <div style={{ transform: 'scale(2)', transformOrigin: 'bottom center', marginBottom: 16 }}>
              <SamSprite />
            </div>
            {/* Shadow */}
            <div style={{
              width: 72,
              height: 8,
              borderRadius: '50%',
              background: 'rgba(51,255,51,0.12)',
              filter: 'blur(4px)',
            }} />
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
                <div style={{ width: 28, height: 2, background: 'rgba(51,255,51,0.5)', borderRadius: 2, marginBottom: 18 }} />
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
              { label: 'MTG', color: '#f59e0b', desc: 'Magic: The Gathering' },
              { label: 'Pokémon', color: '#ef4444', desc: 'TCG cards' },
              { label: 'Sports', color: '#3b82f6', desc: 'Cards & rookie pulls' },
              { label: 'Memorabilia', color: '#a78bfa', desc: 'Signed shoes, balls & more' },
            ].map(cat => (
              <div key={cat.label} style={{
                background: cat.color + '0d',
                border: `1px solid ${cat.color}33`,
                borderRadius: 12,
                padding: '18px 16px',
              }}>
                <div style={{ width: 24, height: 2, background: cat.color, borderRadius: 2, marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: cat.color }}>{cat.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{cat.desc}</div>
              </div>
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
