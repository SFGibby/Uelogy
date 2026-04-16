'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, CollectionItem } from '../../lib/supabase';
import AddItemModal from './AddItemModal';

const TYPE_META: Record<string, { label: string; color: string; glow: string }> = {
  mtg:          { label: 'MTG',         color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  pokemon:      { label: 'Pokémon',     color: '#fb923c', glow: 'rgba(251,146,60,0.3)' },
  sports_card:  { label: 'Sports Card', color: '#fbbf24', glow: 'rgba(251,191,36,0.3)' },
  memorabilia:  { label: 'Memorabilia', color: '#f97316', glow: 'rgba(249,115,22,0.3)' },
  other:        { label: 'Other',       color: '#78716c', glow: 'rgba(120,113,108,0.3)' },
};

// Solar panel grid CSS used in multiple places
const SOLAR_GRID_BG = {
  backgroundImage: [
    'linear-gradient(rgba(245,158,11,0.06) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(245,158,11,0.06) 1px, transparent 1px)',
  ].join(', '),
  backgroundSize: '44px 44px',
};

const inp: React.CSSProperties = {
  background: 'rgba(245,158,11,0.06)',
  border: '1px solid rgba(245,158,11,0.18)',
  borderRadius: 8,
  padding: '8px 14px',
  color: '#e8e4d8',
  fontSize: 13,
  outline: 'none',
  backdropFilter: 'blur(8px)',
};

export default function CollectionTracker() {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<CollectionItem | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'avg_sold_price' | 'purchase_price'>('created_at');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('collection')
      .select('*')
      .order(sortBy, { ascending: sortDir === 'asc' });
    setItems((data as CollectionItem[]) ?? []);
    setLoading(false);
  }, [sortBy, sortDir]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (item: CollectionItem) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      return exists ? prev.map(i => i.id === item.id ? item : i) : [item, ...prev];
    });
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this item from your collection?')) return;
    await supabase.from('collection').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const exportCSV = () => {
    const cols = ['name', 'type', 'set_name', 'condition', 'grade', 'purchase_price', 'avg_sold_price', 'notes', 'created_at'];
    const rows = [cols.join(','), ...filtered.map(i =>
      cols.map(c => JSON.stringify(i[c as keyof CollectionItem] ?? '')).join(',')
    )];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `collection-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const filtered = items.filter(i => {
    if (filterType && i.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return i.name.toLowerCase().includes(q)
        || (i.set_name ?? '').toLowerCase().includes(q)
        || (i.player ?? '').toLowerCase().includes(q)
        || (i.notes ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  const totalValue = filtered.reduce((sum, i) => sum + (i.avg_sold_price ?? i.purchase_price ?? 0) * (i.quantity ?? 1), 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0906',
      color: '#e8e4d8',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Solar panel grid texture + corona glow */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        ...SOLAR_GRID_BG,
      }} />
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '55vh',
        pointerEvents: 'none',
        zIndex: 0,
        background: 'radial-gradient(ellipse at 50% -10%, rgba(245,158,11,0.13) 0%, rgba(234,88,12,0.06) 45%, transparent 70%)',
      }} />
      {/* Horizon line glow */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        pointerEvents: 'none',
        zIndex: 0,
        background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.4) 30%, rgba(245,158,11,0.6) 50%, rgba(245,158,11,0.4) 70%, transparent 100%)',
        boxShadow: '0 0 24px 4px rgba(245,158,11,0.25)',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{
          borderBottom: '1px solid rgba(245,158,11,0.12)',
          padding: '28px 32px',
          background: 'rgba(10,9,6,0.7)',
          backdropFilter: 'blur(16px)',
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: -0.5,
                background: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 50%, #ea580c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                The Collection
              </h1>
              <div style={{ color: 'rgba(245,158,11,0.45)', fontSize: 13, marginTop: 5, letterSpacing: '0.04em' }}>
                {filtered.length} item{filtered.length !== 1 ? 's' : ''}
                {totalValue > 0 && (
                  <span style={{ marginLeft: 16, color: '#fbbf24', fontWeight: 700, fontSize: 14 }}>
                    ≈ ${totalValue.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={exportCSV} style={{ ...inp, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Export CSV
              </button>
              <button
                onClick={() => { setEditItem(null); setShowModal(true); }}
                style={{
                  padding: '9px 22px',
                  background: 'linear-gradient(135deg, #d97706, #ea580c)',
                  color: '#fff',
                  border: '1px solid rgba(245,158,11,0.4)',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(245,158,11,0.25)',
                  letterSpacing: '0.02em',
                }}
              >
                + Add Item
              </button>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ padding: '16px 32px', borderBottom: '1px solid rgba(245,158,11,0.08)' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              style={{ ...inp, minWidth: 220, flex: 1 }}
              placeholder="Search by name, set, player…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select style={inp} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {Object.entries(TYPE_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
            </select>
            <select style={inp} value={`${sortBy}:${sortDir}`} onChange={e => {
              const [f, d] = e.target.value.split(':');
              setSortBy(f as typeof sortBy);
              setSortDir(d as typeof sortDir);
            }}>
              <option value="created_at:desc">Newest First</option>
              <option value="created_at:asc">Oldest First</option>
              <option value="name:asc">Name A–Z</option>
              <option value="name:desc">Name Z–A</option>
              <option value="avg_sold_price:desc">Highest Value</option>
              <option value="avg_sold_price:asc">Lowest Value</option>
              <option value="purchase_price:desc">Purchase Price ↓</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 32px 64px' }}>
          {loading ? (
            <div style={{ color: 'rgba(245,158,11,0.3)', fontSize: 14, textAlign: 'center', padding: 80 }}>
              Loading collection…
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState hasItems={items.length > 0} onAdd={() => setShowModal(true)} />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 20,
            }}>
              {filtered.map(item => (
                <DisplayCase
                  key={item.id}
                  item={item}
                  onEdit={() => { setEditItem(item); setShowModal(true); }}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <AddItemModal
          editItem={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function DisplayCase({ item, onEdit, onDelete }: { item: CollectionItem; onEdit: () => void; onDelete: () => void }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.other;
  const img = item.api_image_url || item.image_url;
  const value = item.avg_sold_price ?? item.purchase_price;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        boxShadow: hovered
          ? `0 20px 50px ${meta.glow}, 0 0 0 1px ${meta.color}50`
          : '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.10)',
      }}
    >
      <div style={{
        background: hovered
          ? `linear-gradient(160deg, rgba(245,158,11,0.10) 0%, rgba(10,9,6,0.95) 60%, ${meta.color}12 100%)`
          : 'linear-gradient(160deg, rgba(245,158,11,0.05) 0%, rgba(10,9,6,0.98) 100%)',
        border: `1px solid ${hovered ? meta.color + '40' : 'rgba(245,158,11,0.12)'}`,
        borderRadius: 14,
        transition: 'background 0.25s ease, border-color 0.25s ease',
      }}>

        {/* Image area */}
        <div style={{
          height: 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          position: 'relative',
          background: 'rgba(0,0,0,0.25)',
        }}>
          {img ? (
            <img
              src={img}
              alt={item.name}
              style={{
                maxHeight: '100%',
                maxWidth: '100%',
                objectFit: 'contain',
                borderRadius: item.type === 'memorabilia' ? 8 : 6,
                boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
                filter: hovered ? 'brightness(1.08)' : 'brightness(0.95)',
                transition: 'filter 0.25s ease',
              }}
            />
          ) : (
            // Solar panel grid placeholder — no emojis
            <div style={{
              width: 120,
              height: 168,
              borderRadius: 8,
              border: `1px solid ${meta.color}30`,
              backgroundImage: [
                `linear-gradient(${meta.color}12 1px, transparent 1px)`,
                `linear-gradient(90deg, ${meta.color}12 1px, transparent 1px)`,
                `linear-gradient(135deg, ${meta.color}08 0%, transparent 60%)`,
              ].join(', '),
              backgroundSize: '24px 24px, 24px 24px, 100% 100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{
                color: meta.color,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.12em',
                opacity: 0.6,
                textTransform: 'uppercase',
              }}>
                {meta.label}
              </span>
            </div>
          )}

          {/* Type badge */}
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: meta.color + 'cc',
            color: '#0a0906',
            fontSize: 9,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 20,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            {meta.label}
          </div>

          {/* Special badges */}
          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            {item.is_foil && (
              <div style={{ background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#000', fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 20, letterSpacing: '0.05em' }}>
                FOIL
              </div>
            )}
            {item.is_rookie && (
              <div style={{ background: 'rgba(245,158,11,0.85)', color: '#0a0906', fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 20, letterSpacing: '0.05em' }}>
                RC
              </div>
            )}
            {item.is_autographed && (
              <div style={{ background: 'rgba(251,191,36,0.85)', color: '#0a0906', fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 20, letterSpacing: '0.05em' }}>
                AUTO
              </div>
            )}
            {item.grade && (
              <div style={{ background: 'rgba(245,158,11,0.15)', backdropFilter: 'blur(8px)', color: '#fbbf24', fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 20, border: '1px solid rgba(245,158,11,0.3)', letterSpacing: '0.05em' }}>
                {item.grade}
              </div>
            )}
          </div>

          {/* Hover actions */}
          {hovered && (
            <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: 6 }}>
              <button
                onClick={e => { e.stopPropagation(); onEdit(); }}
                style={{
                  padding: '5px 12px',
                  background: 'rgba(245,158,11,0.15)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 20,
                  color: '#fbbf24',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Edit
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(); }}
                style={{
                  padding: '5px 10px',
                  background: 'rgba(239,68,68,0.15)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 20,
                  color: '#fca5a5',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div style={{
          padding: '12px 14px 14px',
          borderTop: '1px solid rgba(245,158,11,0.08)',
          background: 'rgba(0,0,0,0.3)',
        }}>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#f0ebe0',
            lineHeight: 1.3,
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {item.name}
          </div>
          {(item.set_name || item.player || item.team) && (
            <div style={{
              fontSize: 11,
              color: 'rgba(245,158,11,0.4)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {item.player || item.set_name}
              {item.team ? ` · ${item.team}` : item.card_number ? ` · #${item.card_number}` : ''}
            </div>
          )}
          {(item.condition || item.year) && (
            <div style={{ fontSize: 11, color: 'rgba(245,158,11,0.25)', marginTop: 2 }}>
              {[item.condition, item.year].filter(Boolean).join(' · ')}
            </div>
          )}
          {value != null && (
            <div style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#fbbf24',
              marginTop: 8,
              textShadow: '0 0 16px rgba(251,191,36,0.4)',
            }}>
              ${value.toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasItems, onAdd }: { hasItems: boolean; onAdd: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
      {/* CSS sun — no emoji */}
      <div style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #fde68a 0%, #f59e0b 50%, #d97706 100%)',
        margin: '0 auto 32px',
        boxShadow: [
          '0 0 0 12px rgba(245,158,11,0.08)',
          '0 0 0 24px rgba(245,158,11,0.04)',
          '0 0 60px rgba(245,158,11,0.3)',
        ].join(', '),
      }} />
      <div style={{ color: 'rgba(245,158,11,0.5)', fontSize: 16, marginBottom: 8 }}>
        {hasItems ? 'No items match your filters.' : 'The wall is empty.'}
      </div>
      {!hasItems && (
        <>
          <div style={{ color: 'rgba(245,158,11,0.25)', fontSize: 13, marginBottom: 28 }}>
            Add your first piece to start your collection.
          </div>
          <button
            onClick={onAdd}
            style={{
              padding: '11px 28px',
              background: 'linear-gradient(135deg, #d97706, #ea580c)',
              color: '#fff',
              border: '1px solid rgba(245,158,11,0.4)',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 30px rgba(245,158,11,0.25)',
            }}
          >
            Add First Item
          </button>
        </>
      )}
    </div>
  );
}
