'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, CollectionItem } from '../../lib/supabase';
import type { SearchResult } from '../../app/api/search/route';

type CardType = 'mtg' | 'pokemon';

const TYPES: { value: CardType; label: string; color: string }[] = [
  { value: 'mtg',     label: 'Magic',   color: '#c98a2e' },
  { value: 'pokemon', label: 'Pokémon', color: '#b14040' },
];

const CONDITIONS = [
  'Near Mint (NM)',
  'Mint (M)',
  'Lightly Played (LP)',
  'Moderately Played (MP)',
  'Heavily Played (HP)',
  'Damaged (DMG)',
];

const COLOR = {
  page:        '#efe5cf',
  pageEdge:    '#d6c9a8',
  ink:         '#3a2e1f',
  inkSoft:     '#7a6a52',
  inkFaint:    '#a08a6a',
  ringShadow:  '#bda57e',
};

const SERIF = 'Georgia, "Hoefler Text", "Times New Roman", serif';
const MONO  = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

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

  const accent = TYPES.find((t) => t.value === type)?.color ?? '#c98a2e';

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

  // Card-on-desk look: cream paper with a thin dark border, no blur, no glow.
  const containerStyle: React.CSSProperties = {
    background: COLOR.page,
    border: `1px solid ${COLOR.ink}`,
    borderRadius: 3,
    padding: 18,
    color: COLOR.ink,
    fontFamily: SERIF,
    boxShadow: `0 6px 16px rgba(0,0,0,0.25)`,
  };
  const fieldInp: React.CSSProperties = {
    background: 'transparent',
    border: `1px solid ${COLOR.inkFaint}`,
    borderRadius: 2,
    padding: '6px 8px',
    color: COLOR.ink,
    fontSize: 12,
    fontFamily: MONO,
    outline: 'none',
  };

  return (
    <div style={containerStyle}>
      {/* Top row: type tabs + session count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', color: COLOR.inkSoft, textTransform: 'uppercase', fontWeight: 700, marginRight: 6 }}>
          Quick Add
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => changeType(t.value)}
              style={{
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: type === t.value ? '#fff' : t.color,
                background: type === t.value ? t.color : 'transparent',
                border: `1px solid ${t.color}`,
                borderRadius: 2,
                padding: '5px 12px',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.16em',
            color: COLOR.inkFaint,
            textTransform: 'uppercase',
            marginLeft: 'auto',
          }}
        >
          {recent.length} added this session
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
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderBottom: `1px solid ${COLOR.ink}`,
              padding: '10px 0',
              fontSize: 18,
              fontFamily: SERIF,
              fontStyle: 'italic',
              color: COLOR.ink,
              outline: 'none',
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
                background: COLOR.page,
                border: `1px solid ${COLOR.ink}`,
                borderRadius: 2,
                marginTop: 4,
                maxHeight: 340,
                overflowY: 'auto',
                zIndex: 20,
                boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
              }}
            >
              {searching && (
                <div style={{ padding: '12px 14px', fontFamily: MONO, fontSize: 11, color: COLOR.inkSoft, letterSpacing: '0.1em' }}>
                  SEARCHING…
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
                    background: i === highlight ? COLOR.pageEdge : 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${COLOR.pageEdge}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: COLOR.ink,
                    fontFamily: SERIF,
                  }}
                >
                  {r.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.imageUrl}
                      alt=""
                      style={{ width: 30, height: 42, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }}
                    />
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {r.name}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: COLOR.inkSoft, letterSpacing: '0.04em' }}>
                      {r.set}
                    </div>
                  </div>
                  {r.marketPrice != null && (
                    <div style={{ fontFamily: MONO, fontSize: 11, color: COLOR.ink, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      ${r.marketPrice.toFixed(2)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: COLOR.inkFaint,
              marginTop: 6,
              letterSpacing: '0.06em',
            }}
          >
            ↑↓ navigate &middot; ↵ select &middot; Esc clear
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
            gap: 16,
            background: 'rgba(255,255,255,0.4)',
            border: `1px solid ${accent}`,
            borderRadius: 2,
            padding: 14,
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          {selected.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.imageUrl}
              alt=""
              style={{
                width: 60,
                height: 84,
                objectFit: 'cover',
                borderRadius: 2,
                flexShrink: 0,
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: COLOR.ink, fontFamily: SERIF }}>
                  {selected.name}
                </div>
                <div style={{ fontSize: 11, fontFamily: MONO, color: COLOR.inkSoft, letterSpacing: '0.06em', marginTop: 2 }}>
                  {selected.set}
                  {selected.marketPrice != null && (
                    <>
                      <span style={{ margin: '0 6px', color: COLOR.inkFaint }}>·</span>
                      <span style={{ color: COLOR.ink, fontWeight: 700 }}>${selected.marketPrice.toFixed(2)}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                title="Cancel (Esc)"
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  background: 'transparent',
                  border: `1px solid ${COLOR.inkFaint}`,
                  borderRadius: 2,
                  color: COLOR.inkSoft,
                  padding: '3px 7px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label style={{ fontFamily: MONO, fontSize: 9, color: COLOR.inkSoft, display: 'flex', flexDirection: 'column', gap: 3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Qty
                <input
                  ref={qtyInputRef}
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  style={{ ...fieldInp, width: 56 }}
                />
              </label>
              <label style={{ fontFamily: MONO, fontSize: 9, color: COLOR.inkSoft, display: 'flex', flexDirection: 'column', gap: 3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Condition
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  style={{ ...fieldInp, minWidth: 160 }}
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ fontFamily: MONO, fontSize: 9, color: COLOR.inkSoft, display: 'flex', flexDirection: 'column', gap: 3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Purchase $
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="optional"
                  style={{ ...fieldInp, width: 90 }}
                />
              </label>
              {type === 'mtg' && (
                <label style={{ fontFamily: MONO, fontSize: 11, color: COLOR.inkSoft, display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 6, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
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
                  fontFamily: MONO,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  background: saving ? COLOR.inkFaint : COLOR.ink,
                  color: COLOR.page,
                  border: 'none',
                  borderRadius: 2,
                  padding: '9px 18px',
                  cursor: saving ? 'default' : 'pointer',
                  textTransform: 'uppercase',
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
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${COLOR.pageEdge}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {recent.map((item) => {
            const value = item.avg_sold_price ?? item.purchase_price;
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255,255,255,0.4)',
                  border: `1px solid ${COLOR.pageEdge}`,
                  borderRadius: 2,
                  padding: '3px 8px 3px 3px',
                  fontFamily: MONO,
                  fontSize: 11,
                  color: COLOR.ink,
                }}
              >
                {item.api_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.api_image_url}
                    alt=""
                    style={{ width: 20, height: 28, objectFit: 'cover', borderRadius: 1 }}
                  />
                )}
                <span
                  style={{
                    maxWidth: 180,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: SERIF,
                    fontSize: 12,
                  }}
                >
                  {item.name}
                </span>
                {value != null && (
                  <span style={{ color: COLOR.inkSoft, fontSize: 10 }}>${value.toFixed(0)}</span>
                )}
                <button
                  type="button"
                  onClick={() => undoRecent(item.id)}
                  title="Undo"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: COLOR.inkFaint,
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: 0,
                    marginLeft: 2,
                    fontFamily: MONO,
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
