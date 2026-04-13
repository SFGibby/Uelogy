'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase, CollectionItem } from '../../lib/supabase';
import type { SearchResult } from '../../app/api/search/route';

const TYPES = [
  { value: 'mtg', label: 'MTG Card', color: '#f59e0b' },
  { value: 'pokemon', label: 'Pokémon Card', color: '#ef4444' },
  { value: 'sports_card', label: 'Sports Card', color: '#3b82f6' },
  { value: 'memorabilia', label: 'Memorabilia', color: '#8b5cf6' },
  { value: 'other', label: 'Other', color: '#6b7280' },
];

const SUBTYPES = ['Shoe', 'Hat', 'Ball', 'Jersey', 'Helmet', 'Bat', 'Glove', 'Photo', 'Other'];
const CONDITIONS: Record<string, string[]> = {
  mtg: [
    'Mint (M)',
    'Near Mint (NM)',
    'Lightly Played (LP)',
    'Moderately Played (MP)',
    'Heavily Played (HP)',
    'Damaged (DMG)',
  ],
  pokemon: [
    'Mint (M)',
    'Near Mint (NM)',
    'Lightly Played (LP)',
    'Moderately Played (MP)',
    'Heavily Played (HP)',
    'Damaged (DMG)',
    'Graded — PSA',
    'Graded — BGS',
    'Graded — CGC',
    'Graded — SGC',
  ],
  sports_card: [
    'Raw — Mint',
    'Raw — Near Mint/Mint (NM-MT)',
    'Raw — Near Mint (NM)',
    'Raw — Excellent/Mint (EX-MT)',
    'Raw — Excellent (EX)',
    'Raw — Very Good/Excellent (VG-EX)',
    'Raw — Very Good (VG)',
    'Raw — Good (G)',
    'Raw — Fair',
    'Raw — Poor',
    'Graded — PSA 10',
    'Graded — PSA 9',
    'Graded — PSA 8',
    'Graded — PSA 7',
    'Graded — PSA 6',
    'Graded — PSA 5 or below',
    'Graded — BGS 10 (Pristine)',
    'Graded — BGS 9.5 (Gem Mint)',
    'Graded — BGS 9',
    'Graded — BGS 8.5',
    'Graded — BGS 8 or below',
    'Graded — SGC 10',
    'Graded — SGC 9.5',
    'Graded — SGC 9',
    'Graded — CGC 10',
    'Graded — CGC 9.5',
    'Graded — CGC 9',
  ],
  memorabilia: [
    'Mint / Unplayed',
    'Excellent',
    'Very Good',
    'Good',
    'Fair',
    'Poor',
    'Authenticated (PSA/DNA)',
    'Authenticated (JSA)',
    'Authenticated (Beckett)',
    'Authenticated (Fanatics)',
  ],
  other: [
    'Mint',
    'Near Mint',
    'Good',
    'Fair',
    'Poor',
  ],
};

interface Props {
  onClose: () => void;
  onSaved: (item: CollectionItem) => void;
  editItem?: CollectionItem | null;
}

export default function AddItemModal({ onClose, onSaved, editItem }: Props) {
  const [type, setType] = useState(editItem?.type ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({
    name: editItem?.name ?? '',
    set_name: editItem?.set_name ?? '',
    card_number: editItem?.card_number ?? '',
    year: editItem?.year ?? '',
    brand: editItem?.brand ?? '',
    condition: editItem?.condition ?? '',
    grade: editItem?.grade ?? '',
    is_foil: editItem?.is_foil ?? false,
    is_rookie: editItem?.is_rookie ?? false,
    is_autographed: editItem?.is_autographed ?? false,
    item_subtype: editItem?.item_subtype ?? '',
    player: editItem?.player ?? '',
    sport: editItem?.sport ?? '',
    team: editItem?.team ?? '',
    is_authenticated: editItem?.is_authenticated ?? false,
    cert_number: editItem?.cert_number ?? '',
    purchase_price: editItem?.purchase_price?.toString() ?? '',
    purchase_date: editItem?.purchase_date ?? '',
    image_url: editItem?.image_url ?? '',
    notes: editItem?.notes ?? '',
    quantity: editItem?.quantity?.toString() ?? '1',
  });

  const [apiImageUrl, setApiImageUrl] = useState(editItem?.api_image_url ?? '');
  const [avgSoldPrice, setAvgSoldPrice] = useState(editItem?.avg_sold_price ?? null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setForm(f => ({ ...f, image_url: data.url }));
      else alert('Upload failed: ' + data.error);
    } finally {
      setUploading(false);
    }
  }, []);

  const isCard = type === 'mtg' || type === 'pokemon' || type === 'sports_card';

  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2 || (type !== 'mtg' && type !== 'pokemon')) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?type=${type}&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.results ?? []);
    } finally {
      setSearching(false);
    }
  }, [type]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(searchQuery), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, search]);

  const selectResult = async (result: SearchResult) => {
    setSelected(result);
    setSearchResults([]);
    setSearchQuery('');
    setForm(f => ({ ...f, name: result.name, set_name: result.set, card_number: result.number ?? '' }));
    setApiImageUrl(result.imageUrl ?? '');
    if (result.marketPrice != null) setAvgSoldPrice(result.marketPrice);
    // Fetch full price
    setFetchingPrice(true);
    try {
      const res = await fetch(`/api/price?type=${type}&name=${encodeURIComponent(result.name)}&set=${encodeURIComponent(result.set)}`);
      const data = await res.json();
      if (data.avg_sold_price != null) setAvgSoldPrice(data.avg_sold_price);
      if (data.api_image_url) setApiImageUrl(data.api_image_url);
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleSave = async () => {
    if (!type || !form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        type,
        name: form.name.trim(),
        set_name: form.set_name || null,
        card_number: form.card_number || null,
        year: form.year || null,
        brand: form.brand || null,
        condition: form.condition || null,
        grade: form.grade || null,
        is_foil: isCard ? form.is_foil : null,
        is_rookie: type === 'sports_card' ? form.is_rookie : null,
        is_autographed: form.is_autographed,
        item_subtype: form.item_subtype || null,
        player: form.player || null,
        sport: form.sport || null,
        team: form.team || null,
        is_authenticated: form.is_authenticated,
        cert_number: form.cert_number || null,
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
        purchase_date: form.purchase_date || null,
        avg_sold_price: avgSoldPrice,
        avg_listing_price: avgSoldPrice ? avgSoldPrice * 1.1 : null,
        last_price_check: avgSoldPrice ? new Date().toISOString() : null,
        api_image_url: apiImageUrl || null,
        image_url: form.image_url || null,
        notes: form.notes || null,
        quantity: parseInt(form.quantity) || 1,
      };

      let result;
      if (editItem) {
        const { data, error } = await supabase.from('collection').update(payload).eq('id', editItem.id).select().single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase.from('collection').insert(payload).select().single();
        if (error) throw error;
        result = data;
      }
      onSaved(result as CollectionItem);
    } catch (err) {
      alert('Save failed: ' + String(err));
    } finally {
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', background: '#0f0f0f', border: '1px solid #2a2a2a',
    borderRadius: 6, padding: '8px 12px', color: '#f0f0f0',
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };
  const label: React.CSSProperties = { fontSize: 11, color: '#888', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' };
  const row: React.CSSProperties = { display: 'flex', gap: 12 };
  const field = (flex = 1): React.CSSProperties => ({ flex, display: 'flex', flexDirection: 'column' });

  const typeColor = TYPES.find(t => t.value === type)?.color ?? '#6b7280';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#f0f0f0', fontSize: 16, fontWeight: 700 }}>{editItem ? 'Edit Item' : 'Add to Collection'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Type selector */}
          {!editItem && (
            <div>
              <div style={label}>Item Type</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {TYPES.map(t => (
                  <button key={t.value} onClick={() => { setType(t.value); setSelected(null); setSearchQuery(''); setSearchResults([]); }}
                    style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${type === t.value ? t.color : '#2a2a2a'}`, background: type === t.value ? t.color + '22' : 'transparent', color: type === t.value ? t.color : '#888', fontSize: 12, cursor: 'pointer', fontWeight: type === t.value ? 600 : 400 }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {type && (
            <>
              {/* Card search */}
              {(type === 'mtg' || type === 'pokemon') && !editItem && (
                <div style={{ position: 'relative' }}>
                  <div style={label}>Search Card</div>
                  {selected ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#0f0f0f', border: `1px solid ${typeColor}44`, borderRadius: 8, padding: '10px 12px' }}>
                      {selected.imageUrl && <img src={selected.imageUrl} alt="" style={{ width: 36, height: 50, objectFit: 'cover', borderRadius: 4 }} />}
                      <div>
                        <div style={{ color: '#f0f0f0', fontSize: 14, fontWeight: 600 }}>{selected.name}</div>
                        <div style={{ color: '#888', fontSize: 12 }}>{selected.set}</div>
                      </div>
                      <button onClick={() => { setSelected(null); setForm(f => ({ ...f, name: '', set_name: '', card_number: '' })); setApiImageUrl(''); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <>
                      <input style={inp} placeholder={`Search ${type === 'mtg' ? 'Magic card' : 'Pokémon card'} name…`}
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus />
                      {(searching || searchResults.length > 0) && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#222', border: '1px solid #333', borderRadius: 8, zIndex: 10, maxHeight: 260, overflowY: 'auto', marginTop: 4 }}>
                          {searching && <div style={{ padding: '12px 16px', color: '#888', fontSize: 13 }}>Searching…</div>}
                          {searchResults.map(r => (
                            <button key={r.id} onClick={() => selectResult(r)}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #2a2a2a' }}>
                              {r.imageUrl && <img src={r.imageUrl} alt="" style={{ width: 32, height: 44, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />}
                              <div>
                                <div style={{ color: '#f0f0f0', fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                                <div style={{ color: '#888', fontSize: 11 }}>{r.set}</div>
                              </div>
                              {r.marketPrice != null && (
                                <div style={{ marginLeft: 'auto', color: '#4ade80', fontSize: 12, fontWeight: 600 }}>${r.marketPrice.toFixed(2)}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {fetchingPrice && <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>Fetching price…</div>}
                </div>
              )}

              {/* Image preview */}
              {apiImageUrl && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <img src={apiImageUrl} alt="" style={{ maxHeight: 180, borderRadius: 8, objectFit: 'contain' }} />
                </div>
              )}

              {/* Name (manual for non-API card types + memorabilia) */}
              {(type === 'sports_card' || type === 'memorabilia' || type === 'other' || editItem) && (
                <div>
                  <div style={label}>Name / Description</div>
                  <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. LeBron James 2003 Topps Rookie" />
                </div>
              )}

              {/* Memorabilia subtype */}
              {type === 'memorabilia' && (
                <div style={row}>
                  <div style={field()}>
                    <div style={label}>Item Type</div>
                    <select style={inp} value={form.item_subtype} onChange={e => setForm(f => ({ ...f, item_subtype: e.target.value }))}>
                      <option value="">Select…</option>
                      {SUBTYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={field()}>
                    <div style={label}>Player / Person</div>
                    <input style={inp} value={form.player} onChange={e => setForm(f => ({ ...f, player: e.target.value }))} placeholder="e.g. Michael Jordan" />
                  </div>
                </div>
              )}

              {/* Set + Number (cards) */}
              {isCard && (
                <div style={row}>
                  <div style={field(2)}>
                    <div style={label}>Set / Series</div>
                    <input style={inp} value={form.set_name} onChange={e => setForm(f => ({ ...f, set_name: e.target.value }))} placeholder="e.g. Base Set" />
                  </div>
                  <div style={field(1)}>
                    <div style={label}>Card #</div>
                    <input style={inp} value={form.card_number} onChange={e => setForm(f => ({ ...f, card_number: e.target.value }))} placeholder="4/102" />
                  </div>
                </div>
              )}

              {/* Year + Brand (sports) */}
              {(type === 'sports_card' || type === 'memorabilia') && (
                <div style={row}>
                  <div style={field()}>
                    <div style={label}>Year</div>
                    <input style={inp} value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2003" />
                  </div>
                  <div style={field()}>
                    <div style={label}>{type === 'memorabilia' ? 'Sport / Team' : 'Brand'}</div>
                    <input style={inp}
                      value={type === 'memorabilia' ? form.sport : form.brand}
                      onChange={e => setForm(f => type === 'memorabilia' ? { ...f, sport: e.target.value } : { ...f, brand: e.target.value })}
                      placeholder={type === 'memorabilia' ? 'NBA / Lakers' : 'Topps, Panini…'} />
                  </div>
                </div>
              )}

              {/* Condition */}
              <div>
                <div style={label}>Condition</div>
                <select style={inp} value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
                  <option value="">Select condition…</option>
                  {(CONDITIONS[type] ?? CONDITIONS.other).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Checkboxes */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {type === 'mtg' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#bbb', fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_foil} onChange={e => setForm(f => ({ ...f, is_foil: e.target.checked }))} /> Foil
                  </label>
                )}
                {type === 'sports_card' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#bbb', fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_rookie} onChange={e => setForm(f => ({ ...f, is_rookie: e.target.checked }))} /> Rookie Card
                  </label>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#bbb', fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_autographed} onChange={e => setForm(f => ({ ...f, is_autographed: e.target.checked }))} /> Autographed
                </label>
                {type === 'memorabilia' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#bbb', fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_authenticated} onChange={e => setForm(f => ({ ...f, is_authenticated: e.target.checked }))} /> Authenticated
                  </label>
                )}
              </div>

              {/* Auth cert # */}
              {form.is_authenticated && (
                <div>
                  <div style={label}>Certificate #</div>
                  <input style={inp} value={form.cert_number} onChange={e => setForm(f => ({ ...f, cert_number: e.target.value }))} placeholder="Authentication cert number" />
                </div>
              )}

              {/* Pricing */}
              <div style={row}>
                <div style={field()}>
                  <div style={label}>Purchase Price ($)</div>
                  <input style={inp} type="number" min="0" step="0.01" value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} placeholder="0.00" />
                </div>
                <div style={field()}>
                  <div style={label}>Purchase Date</div>
                  <input style={inp} type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} />
                </div>
                <div style={field()}>
                  <div style={label}>Qty</div>
                  <input style={inp} type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
              </div>

              {/* Market price display */}
              {avgSoldPrice != null && (
                <div style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#888', fontSize: 12 }}>Market Value</span>
                  <span style={{ color: '#4ade80', fontSize: 16, fontWeight: 700 }}>${avgSoldPrice.toFixed(2)}</span>
                </div>
              )}

              {/* Image upload zone — for non-API card types and as override for any type */}
              {(type === 'sports_card' || type === 'memorabilia' || type === 'other' || (editItem && !apiImageUrl)) && (
                <div>
                  <div style={label}>Photo of card / item</div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
                  />

                  {form.image_url ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={form.image_url} alt="" style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 8, objectFit: 'contain', display: 'block' }} />
                      <button
                        onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                        style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', border: '1px solid #444', borderRadius: '50%', color: '#ccc', width: 24, height: 24, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >✕</button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{ marginTop: 8, display: 'block', background: 'none', border: '1px solid #333', borderRadius: 6, color: '#888', fontSize: 11, padding: '4px 10px', cursor: 'pointer' }}
                      >Replace photo</button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e: DragEvent<HTMLDivElement>) => {
                        e.preventDefault();
                        setDragOver(false);
                        const f = e.dataTransfer.files?.[0];
                        if (f) uploadFile(f);
                      }}
                      style={{
                        border: `2px dashed ${dragOver ? '#7c3aed' : '#333'}`,
                        borderRadius: 8,
                        padding: '28px 20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: dragOver ? 'rgba(124,58,237,0.06)' : 'transparent',
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                    >
                      {uploading ? (
                        <div style={{ color: '#888', fontSize: 13 }}>Uploading…</div>
                      ) : (
                        <>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
                          <div style={{ color: '#888', fontSize: 13 }}>Click to upload or drag a photo here</div>
                          <div style={{ color: '#555', fontSize: 11, marginTop: 4 }}>JPG, PNG, HEIC, WebP</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <div style={label}>Notes</div>
                <textarea style={{ ...inp, resize: 'vertical', minHeight: 60 }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional details…" />
              </div>

              {/* Save */}
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                style={{ padding: '12px', background: saving ? '#333' : typeColor, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer', marginTop: 4 }}>
                {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add to Collection'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
