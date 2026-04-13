'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, CollectionItem } from '../../lib/supabase';
import AddItemModal from './AddItemModal';

const TYPE_META: Record<string, { label: string; color: string }> = {
  mtg:          { label: 'MTG',         color: '#f59e0b' },
  pokemon:      { label: 'Pokémon',     color: '#ef4444' },
  sports_card:  { label: 'Sports Card', color: '#3b82f6' },
  memorabilia:  { label: 'Memorabilia', color: '#8b5cf6' },
  other:        { label: 'Other',       color: '#6b7280' },
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
  const [view, setView] = useState<'grid' | 'list'>('grid');

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
  const c = { bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a', text: '#f0f0f0', muted: '#888' };

  const inp: React.CSSProperties = { background: '#1a1a1a', border: `1px solid ${c.border}`, borderRadius: 8, padding: '8px 14px', color: c.text, fontSize: 13, outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${c.border}`, padding: '24px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>My Collection</h1>
            <div style={{ color: c.muted, fontSize: 13, marginTop: 4 }}>
              {filtered.length} item{filtered.length !== 1 ? 's' : ''}
              {totalValue > 0 && <span style={{ marginLeft: 12, color: '#4ade80', fontWeight: 600 }}>≈ ${totalValue.toFixed(2)}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportCSV} style={{ ...inp, cursor: 'pointer', fontSize: 12 }}>Export CSV</button>
            <button onClick={() => { setEditItem(null); setShowModal(true); }}
              style={{ padding: '8px 18px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              + Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ borderBottom: `1px solid ${c.border}`, padding: '14px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input style={{ ...inp, minWidth: 200, flex: 1 }} placeholder="Search by name, set, player…"
            value={search} onChange={e => setSearch(e.target.value)} />
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
          <div style={{ display: 'flex', border: `1px solid ${c.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {(['grid', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: '8px 12px', background: view === v ? '#2a2a2a' : 'transparent', border: 'none', color: view === v ? c.text : c.muted, cursor: 'pointer', fontSize: 13 }}>
                {v === 'grid' ? '⊞' : '☰'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
        {loading ? (
          <div style={{ color: c.muted, fontSize: 14, textAlign: 'center', padding: 60 }}>Loading collection…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📦</div>
            <div style={{ color: c.muted, fontSize: 15 }}>{items.length === 0 ? 'Nothing here yet — add your first item.' : 'No items match your filters.'}</div>
            {items.length === 0 && (
              <button onClick={() => setShowModal(true)} style={{ marginTop: 20, padding: '10px 24px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Add First Item
              </button>
            )}
          </div>
        ) : view === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {filtered.map(item => <ItemCard key={item.id} item={item} onEdit={() => { setEditItem(item); setShowModal(true); }} onDelete={() => handleDelete(item.id)} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(item => <ItemRow key={item.id} item={item} onEdit={() => { setEditItem(item); setShowModal(true); }} onDelete={() => handleDelete(item.id)} />)}
          </div>
        )}
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

function ItemCard({ item, onEdit, onDelete }: { item: CollectionItem; onEdit: () => void; onDelete: () => void }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.other;
  const img = item.api_image_url || item.image_url;
  const value = item.avg_sold_price ?? item.purchase_price;

  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'border-color 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}>
      <div style={{ height: 180, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {img ? (
          <img src={img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: item.type === 'mtg' || item.type === 'pokemon' ? 8 : 0 }} />
        ) : (
          <div style={{ fontSize: 40 }}>{item.type === 'memorabilia' ? '🏆' : '🃏'}</div>
        )}
        <div style={{ position: 'absolute', top: 8, left: 8, background: meta.color + 'dd', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, letterSpacing: '0.05em' }}>
          {meta.label}
        </div>
        {item.is_foil && <div style={{ position: 'absolute', top: 8, right: 8, background: '#fff2', color: '#fff', fontSize: 10, padding: '2px 7px', borderRadius: 10 }}>✨ Foil</div>}
      </div>
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0', lineHeight: 1.3, wordBreak: 'break-word' }}>{item.name}</div>
        {item.set_name && <div style={{ fontSize: 11, color: '#888' }}>{item.set_name}{item.card_number ? ` · #${item.card_number}` : ''}</div>}
        {item.player && <div style={{ fontSize: 11, color: '#888' }}>{item.player}</div>}
        {item.condition && <div style={{ fontSize: 11, color: '#888' }}>{item.grade || item.condition}</div>}
        {value != null && (
          <div style={{ fontSize: 15, fontWeight: 700, color: '#4ade80', marginTop: 4 }}>${value.toFixed(2)}</div>
        )}
      </div>
      <div style={{ display: 'flex', borderTop: '1px solid #2a2a2a' }}>
        <button onClick={onEdit} style={{ flex: 1, padding: '8px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12, borderRight: '1px solid #2a2a2a' }}>Edit</button>
        <button onClick={onDelete} style={{ flex: 1, padding: '8px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12 }}>Remove</button>
      </div>
    </div>
  );
}

function ItemRow({ item, onEdit, onDelete }: { item: CollectionItem; onEdit: () => void; onDelete: () => void }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.other;
  const img = item.api_image_url || item.image_url;
  const value = item.avg_sold_price ?? item.purchase_price;

  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 64, background: '#111', borderRadius: 6, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 20 }}>{item.type === 'memorabilia' ? '🏆' : '🃏'}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0' }}>{item.name}</span>
          <span style={{ background: meta.color + '22', color: meta.color, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>{meta.label}</span>
          {item.is_foil && <span style={{ color: '#888', fontSize: 11 }}>✨ Foil</span>}
          {item.is_rookie && <span style={{ color: '#888', fontSize: 11 }}>RC</span>}
          {item.is_autographed && <span style={{ color: '#888', fontSize: 11 }}>AUTO</span>}
        </div>
        <div style={{ color: '#888', fontSize: 12, marginTop: 3 }}>
          {[item.set_name, item.card_number ? `#${item.card_number}` : null, item.grade || item.condition, item.year].filter(Boolean).join(' · ')}
        </div>
      </div>
      {value != null && <div style={{ fontSize: 16, fontWeight: 700, color: '#4ade80', flexShrink: 0 }}>${value.toFixed(2)}</div>}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={onEdit} style={{ padding: '6px 12px', background: '#2a2a2a', border: 'none', color: '#bbb', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Edit</button>
        <button onClick={onDelete} style={{ padding: '6px 12px', background: '#2a2a2a', border: 'none', color: '#bbb', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>✕</button>
      </div>
    </div>
  );
}
