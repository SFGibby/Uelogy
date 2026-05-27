'use client';

// Hallway — the index for the Learning section. Each classroom is a door,
// labeled with a chalkboard sign above. SQL is open; the rest are placeholders
// for future classrooms (Python, dbt, whatever comes next).

import Link from 'next/link';
import dynamic from 'next/dynamic';

const ProfessorUel = dynamic(() => import('../../components/ProfessorUel'), { ssr: false });

interface Door {
  label: string;
  href?: string;
  status: 'open' | 'locked';
  blurb?: string;
}

const DOORS: Door[] = [
  { label: 'SQL', href: '/learning/sql', status: 'open', blurb: '11 lessons' },
  { label: 'Python', status: 'locked' },
  { label: 'dbt', status: 'locked' },
  { label: '???', status: 'locked' },
];

const C = {
  hall:     '#1a1d28',
  wall:     '#22252f',
  floor:    '#2a2530',
  floorTop: '#4a3422',
  wood:     '#5e4b2e',
  woodHi:   '#7a5e3a',
  woodLow:  '#3a2820',
  chalk:    '#1e3a2a',
  chalkInk: '#f0ebd0',
  chalkDust:'#a8a290',
  brass:    '#e3b465',
  text:     '#f0ead8',
  muted:    '#a89d80',
  glow:     '#ffcd6b',
  lockerHi: 'rgba(255,235,200,0.08)',
};

const SERIF = 'Georgia, "Hoefler Text", "Times New Roman", serif';
const MONO  = 'ui-monospace, "SF Mono", Menlo, monospace';
const CHALK = '"Bradley Hand", "Comic Sans MS", "Marker Felt", cursive';

export default function HallwayPage() {
  return (
    <main
      style={{
        background: C.hall,
        minHeight: '100vh',
        color: C.text,
        fontFamily: SERIF,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Warm overhead glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: `radial-gradient(ellipse at 50% -5%, rgba(255,205,107,0.06) 0%, transparent 55%)`,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1100,
          margin: '0 auto',
          padding: '48px 32px 0',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.28em',
              color: C.muted,
              textTransform: 'uppercase',
              marginBottom: 10,
              fontWeight: 700,
            }}
          >
            The Hallway
          </div>
          <h1
            style={{
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 38,
              margin: 0,
              letterSpacing: -0.5,
              color: C.text,
            }}
          >
            Pick a classroom.
          </h1>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 14, fontStyle: 'italic' }}>
            Subjects Prof. Uel teaches. SQL is open. The rest are coming.
          </p>
        </div>

        {/* Back-of-hallway lockers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: 4,
            marginBottom: 22,
          }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 42,
                background: C.wood,
                border: `1px solid ${C.floorTop}`,
                borderRadius: 2,
                boxShadow: `inset 0 1px 0 ${C.lockerHi}, inset 0 -2px 0 rgba(0,0,0,0.18)`,
                position: 'relative',
              }}
            >
              {/* Vent line near top */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: '20%',
                  right: '20%',
                  height: 1,
                  background: 'rgba(0,0,0,0.3)',
                }}
              />
            </div>
          ))}
        </div>

        {/* Doors row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${DOORS.length}, 1fr)`,
            gap: 22,
            alignItems: 'end',
          }}
        >
          {DOORS.map((door) => (
            <DoorPanel key={door.label} door={door} />
          ))}
        </div>

        {/* Floor */}
        <div
          style={{
            marginTop: 0,
            height: 10,
            background: C.floor,
            borderTop: `2px solid ${C.floorTop}`,
            boxShadow: `inset 0 6px 12px rgba(0,0,0,0.35)`,
          }}
        />

        {/* Uel standing in hallway */}
        <div
          style={{
            marginTop: 28,
            display: 'flex',
            justifyContent: 'center',
            paddingBottom: 80,
          }}
        >
          <ProfessorUel scale={0.85} />
        </div>
      </div>
    </main>
  );
}

function DoorPanel({ door }: { door: Door }) {
  const isOpen = door.status === 'open';
  const inner = (
    <div
      style={{
        textAlign: 'center',
        cursor: isOpen ? 'pointer' : 'default',
      }}
    >
      {/* Chalkboard sign above the door */}
      <div
        style={{
          background: C.chalk,
          border: `5px solid ${C.wood}`,
          padding: '10px 6px',
          marginBottom: 6,
          fontFamily: CHALK,
          fontSize: 22,
          color: C.chalkInk,
          textShadow: '0 1px 0 rgba(0,0,0,0.25)',
          lineHeight: 1.1,
          minHeight: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {door.label}
      </div>

      {/* Door */}
      <div
        style={{
          height: 220,
          background: isOpen ? C.woodHi : C.woodLow,
          border: `3px solid ${C.wood}`,
          position: 'relative',
          boxShadow: isOpen
            ? `inset 0 0 36px rgba(255,205,107,0.18), 0 0 24px rgba(255,205,107,0.12)`
            : `inset 0 -8px 16px rgba(0,0,0,0.35)`,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        className={isOpen ? 'hallway-door-open' : ''}
      >
        {/* Panel lines */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            height: 70,
            border: `1px solid ${C.wood}`,
            background: isOpen ? 'rgba(255,205,107,0.05)' : 'rgba(0,0,0,0.2)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 100,
            left: 16,
            right: 16,
            height: 70,
            border: `1px solid ${C.wood}`,
            background: isOpen ? 'rgba(255,205,107,0.05)' : 'rgba(0,0,0,0.2)',
          }}
        />

        {/* Light strip on door edge (open only) */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: C.glow,
              boxShadow: `0 0 12px ${C.glow}`,
            }}
          />
        )}

        {/* Brass doorknob */}
        <div
          style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: isOpen ? C.brass : '#6b5a3a',
            boxShadow: isOpen ? `0 0 6px ${C.brass}` : 'inset 0 -1px 0 rgba(0,0,0,0.3)',
          }}
        />

        {/* Coming soon sign */}
        {!isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-3deg)',
              background: C.chalkInk,
              color: C.woodLow,
              fontSize: 9,
              fontWeight: 800,
              padding: '4px 8px',
              letterSpacing: '0.18em',
              fontFamily: MONO,
              textTransform: 'uppercase',
              border: `1px solid ${C.wood}`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            Coming Soon
          </div>
        )}
      </div>

      {/* Subtitle / status caption */}
      <div
        style={{
          marginTop: 8,
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: '0.16em',
          color: isOpen ? C.brass : C.muted,
          textTransform: 'uppercase',
          fontWeight: 700,
          minHeight: 16,
        }}
      >
        {door.blurb ?? (isOpen ? 'Enter' : '')}
      </div>
    </div>
  );

  if (isOpen && door.href) {
    return (
      <>
        <style>{`
          .hallway-door-open:hover {
            transform: translateY(-3px);
            box-shadow: inset 0 0 40px rgba(255,205,107,0.22), 0 4px 28px rgba(255,205,107,0.18) !important;
          }
        `}</style>
        <Link href={door.href} style={{ textDecoration: 'none', color: 'inherit' }}>
          {inner}
        </Link>
      </>
    );
  }
  return inner;
}
