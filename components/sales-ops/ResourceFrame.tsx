'use client';

const SANS = 'var(--font-swagger-sans), -apple-system, system-ui, sans-serif';
const DISPLAY = 'var(--font-swagger-display), "Archivo Black", Impact, sans-serif';
const MONO = 'var(--font-swagger-mono), ui-monospace, monospace';

const INK = '#0D1023';
const LINE = 'rgba(255,255,255,0.08)';
const TEXT = '#FFFFFF';
const SUBTLE = '#CED3E8';
const SUN = '#FAD646';

export default function ResourceFrame() {
  return (
    <div style={{ background: INK, color: TEXT, fontFamily: SANS, minHeight: 'calc(100vh - 55px)' }}>
      <section style={{ padding: '32px 32px 20px', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.3em', color: SUN, textTransform: 'uppercase', marginBottom: 12 }}>
          Resource guide
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: DISPLAY,
            fontSize: 'clamp(32px, 5vw, 56px)',
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
          }}
        >
          Mid-pitch,<span style={{ color: SUN }}> on tap.</span>
        </h1>
        <p style={{ marginTop: 10, maxWidth: 580, fontSize: 14, lineHeight: 1.6, color: SUBTLE }}>
          Contacts, financing, calculators, adders, equipment, FAQs. Live mirror of Colten&rsquo;s guide.
        </p>
      </section>

      <iframe
        src="/sales-ops/resources.html"
        title="Resource guide"
        style={{
          display: 'block',
          width: '100%',
          height: 'calc(100vh - 55px - 160px)',
          minHeight: 600,
          border: 0,
          background: '#162241',
        }}
      />
    </div>
  );
}
