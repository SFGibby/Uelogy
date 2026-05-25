'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, CollectionItem } from '../../lib/supabase';
import type { SearchResult } from '../../app/api/search/route';

type CardType = 'mtg' | 'pokemon';

const TYPES: { value: CardType; label: string; color: string }[] = [
  { value: 'mtg', label: 'MTG', color: '#f59e0b' },
  { value: 'pokemon', label: 'Pokémon', color: '#ef4444' },
];

const CONDITIONS = [
  'Near Mint (NM)',
  'Mint (M)',
  'Lightly Played (LP)',
  'Moderately Played (MP)',
  'Heavily Played (HP)',
  'Damaged (DMG)',
];

interface Props {
  onAdded: (item: CollectionItem) => void;
  onRemoved?: (id: string) => void;
}

export default function QuickAddBar({ onAdded, onRemoved }: Props) {
  const [type, setType] = useState<CardType>('mtg');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [qty, setQty] = useState('1');
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [isFoil, setIsFoil] = useState(false);
  const [saving, setSaving] = useState(false);

  const [recent, setRecent] = useState<CollectionItem[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('quick_add_type');
    if (saved === 'mtg' || saved === 'pokemon') setType(saved as CardType);
  }, []);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const accent = TYPES.find((t) => t.value === type)?.color ?? '#f59e0b';

  const changeType = (t: CardType) => {
    setType(t);
    localStorage.setItem('quick_add_type', t);
    setResults([]);
    setQuery('');
    setSelected(null);
    searchInputRef.current?.focus();
  };

  const runSearch = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(`/api/search?type=${type}&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setHighlight(0);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [type]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || selected) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected, runSearch]);

  const selectResult = (r: SearchResult) => {
    setSelected(r);
    setResults([]);
    setQuery('');
    requestAnimationFrame(() => qtyInputRef.current?.select());
  };

  const clearSelection = () => {
    setSelected(null);
    setQty('1');
    setCondition(CONDITIONS[0]);
    setPurchasePrice('');
    setIsFoil(false);
    searchInputRef.current?.focus();
  };

  const save = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      const payload = {
        type,
        name: selected.name,
        set_name: selected.set || null,
        card_number: selected.number ?? null,
        condition: condition || null,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        avg_sold_price: selected.marketPrice ?? null,
        avg_listing_price: selected.marketPrice ? selected.marketPrice * 1.1 : null,
        last_price_check: selected.marketPrice ? new Date().toISOString() : null,
        api_image_url: selected.imageUrl ?? null,
        quantity: parseInt(qty, 10) || 1,
        is_foil: type === 'mtg' ? isFoil : null,
      };
      const { data, error } = await supabase.from('collection').insert(payload).select().single();
      if (error) throw error;
      const item = data as CollectionItem;
      setRecent((r) => [item, ...r].slice(0, 10));
      onAdded(item);
      clearSelection();
    } catch (err) {
      alert('Save failed: ' + String(err));
    } finally {
      setSaving(false);
    }
  };

  const undoRecent = async (id: string) => {
    if (!confirm('Remove this card from the collection?')) return;
    const { error } = await supabase.from('collection').delete().eq('id', id);
    if (error) {
      alert('Delete failed: ' + error.message);
      return;
    }
    setRecent((r) => r.filter((i) => i.id !== id));
    onRemoved?.(id);
  };

  // Container styles match the existing dark-glass aesthetic. Will be
  // restyled when the binder visual lands; for now it lives at the top
  // of CollectionTracker.
  const containerStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    backdropFilter: 'blur(8px)',
  };
  const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    padding: '8px 12px',
    color: '#e8e8e8',
    fontSize: 13,
    outline: 'none',
  };

  return (
    <div style={containerStyle}>
      {/* Top row: type chips + recent count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => changeType(t.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: `1px solid ${type === t.value ? t.color : 'rgba(255,255,255,0.12)'}`,
                background: type === t.value ? t.color + '22' : 'transparent',
                color: type === t.value ? t.color : 'rgba(255,255,255,0.55)',
                fontSize: 12,
                fontWeight: type === t.value ? 700 : 500,
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginLeft: 'auto',
          }}
        >
          Quick Add · {recent.length} this session
        </div>
      </div>

      {/* Search input OR selected card panel */}
      {!selected ? (
        <div style={{ position: 'relative' }}>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' && results.length > 0) {
                e.preventDefault();
                setHighlight((h) => Math.min(h + 1, results.length - 1));
              } else if (e.key === 'ArrowUp' && results.length > 0) {
                e.preventDefault();
                setHighlight((h) => Math.max(h - 1, 0));
              } else if (e.key === 'Enter' && results.length > 0) {
                e.preventDefault();
                selectResult(results[highlight]);
              } else if (e.key === 'Escape') {
                setQuery('');
                setResults([]);
              }
            }}
            placeholder={`Type a ${type === 'mtg' ? 'Magic' : 'Pokémon'} card name…`}
            style={{
              ...inp,
              width: '100%',
              padding: '12px 14px',
              fontSize: 15,
              boxSizing: 'border-box',
            }}
          />
          {(searching || results.length > 0) && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#1a1a24',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                marginTop: 6,
                maxHeight: 320,
                overflowY: 'auto',
                zIndex: 20,
                boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
              }}
            >
              {searching && (
                <div style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                  Searching…
                </div>
              )}
              {results.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => selectResult(r)}
                  onMouseEnter={() => setHighlight(i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    background: i === highlight ? 'rgba(255,255,255,0.06)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: '#e8e8e8',
                    fontFamily: 'inherit',
                  }}
                >
                  {r.imageUrl && (
                    <img
                      src={r.imageUrl}
                      alt=""
                      style={{ width: 32, height: 44, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }}
                    />
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {r.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{r.set}</div>
                  </div>
                  {r.marketPrice != null && (
                    <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      ${r.marketPrice.toFixed(2)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.35)',
              marginTop: 8,
              letterSpacing: '0.04em',
            }}
          >
            ↑↓ to navigate · ↵ to select · Esc to clear
          </div>
        </div>
      ) : (
        <div
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'SELECT') {
              e.preventDefault();
              save();
            } else if (e.key === 'Escape') {
              clearSelection();
            }
          }}
          style={{
            display: 'flex',
            gap: 14,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${accent}44`,
            borderRadius: 10,
            padding: 12,
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          {selected.imageUrl && (
            <img
              src={selected.imageUrl}
              alt=""
              style={{ width: 56, height: 78, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
            />
          )}
          <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                  {selected.set}
                  {selected.marketPrice != null && (
                    <>
                      <span style={{ margin: '0 6px', color: 'rgba(255,255,255,0.25)' }}>·</span>
                      <span style={{ color: '#4ade80', fontWeight: 600 }}>
                        ${selected.marketPrice.toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                title="Cancel (Esc)"
                style={{
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 6,
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                Qty
                <input
                  ref={qtyInputRef}
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  style={{ ...inp, width: 64 }}
                />
              </label>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                Condition
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  style={{ ...inp, minWidth: 160 }}
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                Purchase $
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="optional"
                  style={{ ...inp, width: 100 }}
                />
              </label>
              {type === 'mtg' && (
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-end', paddingBottom: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isFoil}
                    onChange={(e) => setIsFoil(e.target.checked)}
                  />
                  Foil
                </label>
              )}
              <button
                type="button"
                onClick={save}
                disabled={saving}
                style={{
                  marginLeft: 'auto',
                  alignSelf: 'flex-end',
                  padding: '10px 20px',
                  background: saving ? '#333' : accent,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: saving ? 'default' : 'pointer',
                  letterSpacing: '0.02em',
                  fontFamily: 'inherit',
                }}
              >
                {saving ? 'Saving…' : 'Add ↵'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recently added stack (this session) */}
      {recent.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {recent.map((item) => {
            const value = item.avg_sold_price ?? item.purchase_price;
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20,
                  padding: '5px 10px 5px 5px',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.75)',
                }}
              >
                {item.api_image_url && (
                  <img
                    src={item.api_image_url}
                    alt=""
                    style={{ width: 22, height: 30, objectFit: 'cover', borderRadius: 3 }}
                  />
                )}
                <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </span>
                {value != null && (
                  <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 600 }}>${value.toFixed(2)}</span>
                )}
                <button
                  type="button"
                  onClick={() => undoRecent(item.id)}
                  title="Undo"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: 0,
                    marginLeft: 2,
                    fontFamily: 'inherit',
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
