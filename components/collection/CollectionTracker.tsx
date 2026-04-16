'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, CollectionItem } from '../../lib/supabase';
import AddItemModal from './AddItemModal';

const TYPE_META: Record<string, { label: string; color: string; glow: string }> = {
  mtg:          { label: 'MTG',         color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  pokemon:      { label: 'Pokémon',     color: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
  sports_card:  { label: 'Sports Card', color: '#3b82f6', glow: 'rgba(59,130,246,0.3)' },
  memorabilia:  { label: 'Memorabilia', color: '#a78bfa', glow: 'rgba(167,139,250,0.3)' },
  other:        { label: 'Other',       color: '#6b7280', glow: 'rgba(107,114,128,0.3)' },
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

  const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    padding: '8px 14px',
    color: '#e8e8e8',
    fontSize: 13,
    outline: 'none',
    backdropFilter: 'blur(8px)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a14 0%, #0d0d1a 40%, #0a0f0a 100%)',
      color: '#e8e8e8',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background glow blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)', filter: 'blur(40px)', transform: 'translate(-50%, -50%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '28px 32px',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: -0.5, background: 'linear-gradient(135deg, #e8e8e8 0%, #a0a0a0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                The Collection
              </h1>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 5, letterSpacing: '0.02em' }}>
                {filtered.length} item{filtered.length !== 1 ? 's' : ''}
                {totalValue > 0 && (
                  <span style={{ marginLeft: 16, color: '#4ade80', fontWeight: 700, fontSize: 14 }}>
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
                  background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                  color: '#fff',
                  border: '1px solid rgba(167,139,250,0.4)',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(124,58,237,0.3)',
                  letterSpacing: '0.02em',
                }}
              >
                + Add Item
              </button>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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

        {/* Wall */}
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 32px 64px' }}>
          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', padding: 80 }}>
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        boxShadow: hovered
          ? `0 20px 60px ${meta.glow}, 0 0 0 1px ${meta.color}55, inset 0 1px 0 rgba(255,255,255,0.15)`
          : '0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      {/* Glass case frame */}
      <div style={{
        background: hovered
          ? `linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 50%, ${meta.color}18 100%)`
          : 'linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.01) 100%)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${hovered ? meta.color + '44' : 'rgba(255,255,255,0.10)'}`,
        borderRadius: 16,
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
          background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 100%)',
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
                boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)`,
                filter: hovered ? 'brightness(1.08)' : 'brightness(1)',
                transition: 'filter 0.25s ease',
              }}
            />
          ) : (
            <div style={{
              width: 120,
              height: 168,
              background: `linear-gradient(135deg, ${meta.color}22, ${meta.color}08)`,
              border: `1px solid ${meta.color}33`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
            }}>
              {item.type === 'memorabilia' ? '🏆' : item.type === 'sports_card' ? '🏅' : '🃏'}
            </div>
          )}

          {/* Type badge */}
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: meta.color + 'cc',
            color: '#fff',
            fontSize: 9,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 20,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: `0 2px 8px ${meta.glow}`,
          }}>
            {meta.label}
          </div>

          {/* Special badges */}
          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            {item.is_foil && (
              <div style={{ background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#000', fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 20, letterSpacing: '0.05em' }}>
                ✨ FOIL
              </div>
            )}
            {item.is_rookie && (
              <div style={{ background: 'rgba(74,222,128,0.85)', color: '#000', fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 20, letterSpacing: '0.05em' }}>
                RC
              </div>
            )}
            {item.is_autographed && (
              <div style={{ background: 'rgba(251,191,36,0.85)', color: '#000', fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 20, letterSpacing: '0.05em' }}>
                AUTO
              </div>
            )}
            {item.grade && (
              <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
                {item.grade}
              </div>
            )}
          </div>

          {/* Hover menu */}
          {hovered && (
            <div style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              display: 'flex',
              gap: 6,
            }}>
              <button
                onClick={e => { e.stopPropagation(); onEdit(); }}
                style={{
                  padding: '5px 12px',
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 20,
                  color: '#fff',
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
                  background: 'rgba(239,68,68,0.2)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(239,68,68,0.3)',
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
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#f0f0f0',
            lineHeight: 1.3,
            wordBreak: 'break-word',
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
              color: 'rgba(255,255,255,0.4)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {item.player || item.set_name}
              {item.team ? ` · ${item.team}` : item.card_number ? ` · #${item.card_number}` : ''}
            </div>
          )}
          {(item.condition || item.year) && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
              {[item.condition, item.year].filter(Boolean).join(' · ')}
            </div>
          )}
          {value != null && (
            <div style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#4ade80',
              marginTop: 8,
              textShadow: '0 0 20px rgba(74,222,128,0.4)',
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
      <div style={{
        width: 120,
        height: 120,
        margin: '0 auto 24px',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(59,130,246,0.10))',
        border: '1px solid rgba(124,58,237,0.2)',
        borderRadius: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 52,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 40px rgba(124,58,237,0.15)',
      }}>
        🏛️
      </div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 8 }}>
        {hasItems ? 'No items match your filters.' : 'The wall is empty.'}
      </div>
      {!hasItems && (
        <>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, marginBottom: 28 }}>
            Add your first piece to start your collection.
          </div>
          <button
            onClick={onAdd}
            style={{
              padding: '11px 28px',
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              color: '#fff',
              border: '1px solid rgba(167,139,250,0.4)',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 30px rgba(124,58,237,0.4)',
            }}
          >
            Add First Item
          </button>
        </>
      )}
    </div>
  );
}
