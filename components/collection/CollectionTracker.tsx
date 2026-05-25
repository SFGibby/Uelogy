'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, CollectionItem } from '../../lib/supabase';
import AddItemModal from './AddItemModal';
import QuickAddBar from './QuickAddBar';

type FilterType = '' | 'mtg' | 'pokemon' | 'sports_card' | 'memorabilia' | 'other';

const TYPE_META: Record<string, { label: string; color: string; short: string }> = {
  mtg:          { label: 'Magic',       color: '#c98a2e', short: 'MTG' },
  pokemon:      { label: 'Pokémon',     color: '#b14040', short: 'PKM' },
  sports_card:  { label: 'Sports',      color: '#3f5a8c', short: 'SPT' },
  memorabilia:  { label: 'Memorabilia', color: '#6a5390', short: 'MEM' },
  other:        { label: 'Other',       color: '#5a5048', short: 'OTH' },
};

const TAB_FILTERS: { value: FilterType; label: string; color: string }[] = [
  { value: '',             label: 'All',         color: '#7a6a52' },
  { value: 'mtg',          label: 'Magic',       color: '#c98a2e' },
  { value: 'pokemon',      label: 'Pokémon',     color: '#b14040' },
  { value: 'sports_card',  label: 'Sports',      color: '#3f5a8c' },
  { value: 'memorabilia',  label: 'Memorabilia', color: '#6a5390' },
];

const PER_PAGE = 9; // 3x3 binder page

// Palette
const COLOR = {
  desk:         '#2a2118',
  deskGrain:    '#1f1810',
  binder:       '#1e2a45',
  binderEdge:   '#15203a',
  ring:         '#cbd0d6',
  ringShadow:   '#7d8186',
  page:         '#efe5cf',
  pageEdge:     '#d6c9a8',
  pageShadow:   'rgba(0,0,0,0.35)',
  pocket:       'rgba(0,0,0,0.06)',
  pocketEdge:   'rgba(0,0,0,0.18)',
  ink:          '#3a2e1f',
  inkSoft:      '#7a6a52',
  inkFaint:     '#a08a6a',
  warmWhite:    '#f4ebd6',
};

const SERIF = 'Georgia, "Hoefler Text", "Times New Roman", serif';
const MONO  = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export default function CollectionTracker() {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<CollectionItem | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('');
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'avg_sold_price' | 'purchase_price'>('created_at');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const a = params.get('admin');
    if (a === '1') {
      localStorage.setItem('collection_admin', '1');
      setAdminMode(true);
    } else if (a === '0') {
      localStorage.removeItem('collection_admin');
      setAdminMode(false);
    } else {
      setAdminMode(localStorage.getItem('collection_admin') === '1');
    }
  }, []);

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

  const filtered = useMemo(() => items.filter(i => {
    if (filterType && i.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return i.name.toLowerCase().includes(q)
        || (i.set_name ?? '').toLowerCase().includes(q)
        || (i.player ?? '').toLowerCase().includes(q)
        || (i.notes ?? '').toLowerCase().includes(q);
    }
    return true;
  }), [items, filterType, search]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [filterType, search, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalValue = filtered.reduce(
    (sum, i) => sum + (i.avg_sold_price ?? i.purchase_price ?? 0) * (i.quantity ?? 1),
    0
  );

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

  // Slot-fill: pad the page to PER_PAGE with nulls so the last page has visible empty sleeves
  const pageSlots: (CollectionItem | null)[] = [
    ...currentPageItems,
    ...Array(Math.max(0, PER_PAGE - currentPageItems.length)).fill(null),
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: COLOR.desk,
        backgroundImage: `repeating-linear-gradient(45deg, ${COLOR.deskGrain} 0 2px, transparent 2px 8px)`,
        color: COLOR.warmWhite,
        fontFamily: SERIF,
        padding: '40px 20px 80px',
        position: 'relative',
      }}
    >
      {/* Title strip */}
      <div style={{ maxWidth: 920, margin: '0 auto 24px', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'rgba(244,235,214,0.45)',
            marginBottom: 6,
          }}
        >
          The Collection
        </div>
        <h1
          style={{
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 36,
            margin: 0,
            color: COLOR.warmWhite,
            letterSpacing: -0.5,
          }}
        >
          Cards, sleeves, and signatures.
        </h1>
        <div
          style={{
            marginTop: 12,
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: '0.1em',
            color: 'rgba(244,235,214,0.55)',
          }}
        >
          {filtered.length} ITEM{filtered.length === 1 ? '' : 'S'}
          {totalValue > 0 && (
            <>
              <span style={{ margin: '0 10px', color: 'rgba(244,235,214,0.25)' }}>·</span>
              <span>${totalValue.toFixed(2)} TOTAL</span>
            </>
          )}
        </div>
      </div>

      {/* Admin row (only visible when admin) */}
      {adminMode && (
        <div
          style={{
            maxWidth: 920,
            margin: '0 auto 16px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            fontFamily: MONO,
            fontSize: 11,
          }}
        >
          <button
            onClick={exportCSV}
            style={adminBtn}
          >
            EXPORT CSV
          </button>
          <button
            onClick={() => { setEditItem(null); setShowModal(true); }}
            style={{ ...adminBtn, background: COLOR.warmWhite, color: COLOR.desk, borderColor: COLOR.warmWhite }}
          >
            + ADD ITEM
          </button>
        </div>
      )}

      {/* Quick-Add (admin only). Note: the QuickAddBar keeps the existing dark
          chrome for now; restyling it to match the binder is a follow-up. */}
      {adminMode && (
        <div style={{ maxWidth: 920, margin: '0 auto 24px' }}>
          <QuickAddBar
            onAdded={handleSaved}
            onRemoved={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
          />
        </div>
      )}

      {/* File-folder tabs (filter by type) */}
      <div
        style={{
          maxWidth: 920,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 4,
          paddingLeft: 32,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {TAB_FILTERS.map((t) => {
          const active = filterType === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setFilterType(t.value)}
              style={{
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: active ? COLOR.warmWhite : 'rgba(244,235,214,0.7)',
                background: active ? t.color : `${t.color}b3`,
                border: 'none',
                borderRadius: '6px 6px 0 0',
                padding: active ? '11px 18px 9px' : '8px 16px 7px',
                marginBottom: active ? -2 : 0,
                cursor: 'pointer',
                boxShadow: active ? '0 -2px 0 rgba(0,0,0,0.15) inset' : 'none',
                transform: active ? 'translateY(2px)' : 'none',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Binder body */}
      <div
        style={{
          maxWidth: 920,
          margin: '0 auto',
          background: COLOR.binder,
          borderTop: `1px solid ${COLOR.binderEdge}`,
          borderRadius: '0 6px 6px 6px',
          padding: '20px 20px 24px',
          boxShadow: `0 24px 60px ${COLOR.pageShadow}, 0 0 0 1px ${COLOR.binderEdge}`,
          display: 'flex',
          gap: 16,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Spine with rings */}
        <div
          style={{
            width: 28,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '28px 0',
            background: COLOR.binderEdge,
            borderRadius: 4,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: COLOR.ring,
                boxShadow: `inset 0 -2px 0 ${COLOR.ringShadow}, 0 1px 2px rgba(0,0,0,0.5)`,
              }}
            />
          ))}
        </div>

        {/* Page */}
        <div
          style={{
            flex: 1,
            background: COLOR.page,
            backgroundImage:
              `repeating-linear-gradient(0deg, rgba(0,0,0,0.015) 0 1px, transparent 1px 3px),` +
              `repeating-linear-gradient(90deg, rgba(0,0,0,0.015) 0 1px, transparent 1px 3px)`,
            borderRadius: 4,
            padding: '24px 22px 18px',
            color: COLOR.ink,
            boxShadow: `inset 1px 0 0 ${COLOR.pageEdge}, 0 2px 4px rgba(0,0,0,0.25)`,
            minHeight: 540,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Page header: search + sort */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              marginBottom: 18,
              borderBottom: `1px solid ${COLOR.pageEdge}`,
              paddingBottom: 12,
            }}
          >
            <input
              type="text"
              placeholder="Search this binder…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${COLOR.inkFaint}`,
                padding: '4px 0',
                fontFamily: SERIF,
                fontStyle: 'italic',
                fontSize: 14,
                color: COLOR.ink,
                outline: 'none',
                maxWidth: 280,
              }}
            />
            <select
              value={`${sortBy}:${sortDir}`}
              onChange={(e) => {
                const [f, d] = e.target.value.split(':');
                setSortBy(f as typeof sortBy);
                setSortDir(d as typeof sortDir);
              }}
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '0.06em',
                background: 'transparent',
                border: `1px solid ${COLOR.inkFaint}`,
                color: COLOR.ink,
                padding: '4px 8px',
                borderRadius: 3,
              }}
            >
              <option value="created_at:desc">Newest first</option>
              <option value="created_at:asc">Oldest first</option>
              <option value="name:asc">Name A–Z</option>
              <option value="name:desc">Name Z–A</option>
              <option value="avg_sold_price:desc">Highest value</option>
              <option value="avg_sold_price:asc">Lowest value</option>
            </select>
          </div>

          {/* Sleeves grid (3x3) or empty / loading state */}
          {loading ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: MONO,
                fontSize: 12,
                color: COLOR.inkSoft,
                letterSpacing: '0.1em',
              }}
            >
              LOADING…
            </div>
          ) : filtered.length === 0 ? (
            <EmptyBinder
              hasItems={items.length > 0}
              adminMode={adminMode}
              onAdd={() => setShowModal(true)}
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 14,
                flex: 1,
                alignContent: 'start',
              }}
            >
              {pageSlots.map((item, idx) =>
                item ? (
                  <Sleeve
                    key={item.id}
                    item={item}
                    onEdit={adminMode ? () => { setEditItem(item); setShowModal(true); } : undefined}
                    onDelete={adminMode ? () => handleDelete(item.id) : undefined}
                  />
                ) : (
                  <EmptySleeve key={`empty-${idx}`} />
                )
              )}
            </div>
          )}

          {/* Page footer: pagination */}
          {filtered.length > 0 && (
            <div
              style={{
                marginTop: 18,
                paddingTop: 12,
                borderTop: `1px solid ${COLOR.pageEdge}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: MONO,
                fontSize: 11,
                color: COLOR.inkSoft,
                letterSpacing: '0.08em',
              }}
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={pageNavBtn(page <= 1)}
              >
                ← PREV
              </button>
              <div>
                PAGE {page} OF {totalPages}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={pageNavBtn(page >= totalPages)}
              >
                NEXT →
              </button>
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

// ─────────────────────────────────────────────────────────────────

const adminBtn: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.18em',
  background: 'transparent',
  color: 'rgba(244,235,214,0.8)',
  border: `1px solid rgba(244,235,214,0.3)`,
  padding: '8px 14px',
  borderRadius: 3,
  cursor: 'pointer',
};

function pageNavBtn(disabled: boolean): React.CSSProperties {
  return {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: '0.1em',
    background: 'transparent',
    border: 'none',
    color: disabled ? 'rgba(58,46,31,0.25)' : COLOR.ink,
    cursor: disabled ? 'default' : 'pointer',
    padding: 0,
  };
}

// ─────────────────────────────────────────────────────────────────

function Sleeve({
  item,
  onEdit,
  onDelete,
}: {
  item: CollectionItem;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const meta = TYPE_META[item.type] ?? TYPE_META.other;
  const img = item.api_image_url || item.image_url;
  const value = item.avg_sold_price ?? item.purchase_price;
  const canEdit = !!onEdit && !!onDelete;
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: COLOR.pocket,
        border: `1px solid ${COLOR.pocketEdge}`,
        borderRadius: 3,
        aspectRatio: '2.5 / 3.5',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'transform 0.15s',
        cursor: 'default',
      }}
    >
      {/* Type strip on left edge */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 12,
          bottom: 12,
          width: 3,
          background: meta.color,
          borderTopRightRadius: 1,
          borderBottomRightRadius: 1,
        }}
      />

      {/* Card image area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
          marginBottom: 6,
        }}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={item.name}
            style={{
              maxHeight: '100%',
              maxWidth: '100%',
              objectFit: 'contain',
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          />
        ) : (
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: meta.color,
              opacity: 0.6,
            }}
          >
            {meta.short}
          </div>
        )}
      </div>

      {/* Caption: name + value */}
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 12,
          fontWeight: 600,
          color: COLOR.ink,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.3,
        }}
        title={item.name}
      >
        {item.name}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginTop: 2,
          fontFamily: MONO,
          fontSize: 10,
          color: COLOR.inkSoft,
          letterSpacing: '0.04em',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '60%',
          }}
          title={item.set_name ?? ''}
        >
          {item.set_name ?? ''}
        </span>
        {value != null && <span>${value.toFixed(0)}</span>}
      </div>

      {/* Foil indicator (subtle) */}
      {item.is_foil && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            fontFamily: MONO,
            fontSize: 8,
            letterSpacing: '0.12em',
            color: COLOR.ink,
            background: 'rgba(255,255,255,0.4)',
            padding: '1px 4px',
            borderRadius: 2,
          }}
        >
          FOIL
        </div>
      )}

      {/* Admin overlay (edit/delete) */}
      {canEdit && hover && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            display: 'flex',
            gap: 4,
          }}
        >
          <button
            onClick={onEdit}
            style={overlayBtn}
            title="Edit"
          >
            EDIT
          </button>
          <button
            onClick={onDelete}
            style={{ ...overlayBtn, color: '#a44040' }}
            title="Delete"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

const overlayBtn: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.1em',
  background: 'rgba(255,255,255,0.85)',
  color: COLOR.ink,
  border: `1px solid ${COLOR.pageEdge}`,
  borderRadius: 2,
  padding: '2px 6px',
  cursor: 'pointer',
};

// ─────────────────────────────────────────────────────────────────

function EmptySleeve() {
  return (
    <div
      style={{
        aspectRatio: '2.5 / 3.5',
        border: `1px dashed ${COLOR.pageEdge}`,
        borderRadius: 3,
        background: 'transparent',
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────

function EmptyBinder({
  hasItems,
  adminMode,
  onAdd,
}: {
  hasItems: boolean;
  adminMode: boolean;
  onAdd: () => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        textAlign: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontSize: 18,
          color: COLOR.ink,
        }}
      >
        {hasItems ? 'Nothing on this page.' : 'This binder is empty.'}
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          color: COLOR.inkSoft,
          letterSpacing: '0.1em',
        }}
      >
        {hasItems ? 'TRY ANOTHER FILTER OR SEARCH' : 'NO ITEMS YET'}
      </div>
      {!hasItems && adminMode && (
        <button
          onClick={onAdd}
          style={{
            marginTop: 8,
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            background: COLOR.ink,
            color: COLOR.page,
            border: 'none',
            padding: '10px 22px',
            borderRadius: 3,
            cursor: 'pointer',
          }}
        >
          ADD FIRST ITEM
        </button>
      )}
    </div>
  );
}
