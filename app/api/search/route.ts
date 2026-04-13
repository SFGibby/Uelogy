import { NextRequest, NextResponse } from 'next/server';

export interface SearchResult {
  id: string;
  name: string;
  set: string;
  number?: string;
  imageUrl?: string;
  marketPrice?: number | null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const q = searchParams.get('q');
  if (!type || !q || q.length < 2) return NextResponse.json({ results: [] });

  try {
    if (type === 'mtg') {
      const res = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&unique=cards&order=name`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) return NextResponse.json({ results: [] });
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: SearchResult[] = (data.data || []).slice(0, 8).map((c: any) => ({
        id: c.id,
        name: c.name,
        set: c.set_name,
        number: c.collector_number,
        imageUrl: c.image_uris?.small ?? c.card_faces?.[0]?.image_uris?.small,
        marketPrice: c.prices?.usd ? parseFloat(c.prices.usd) : null,
      }));
      return NextResponse.json({ results });
    }

    if (type === 'pokemon') {
      const res = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=name:"${encodeURIComponent(q)}"&pageSize=8&orderBy=name`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) return NextResponse.json({ results: [] });
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: SearchResult[] = (data.data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        set: c.set?.name ?? '',
        number: c.number,
        imageUrl: c.images?.small,
        marketPrice: c.tcgplayer?.prices?.normal?.market
          ?? c.tcgplayer?.prices?.holofoil?.market
          ?? null,
      }));
      return NextResponse.json({ results });
    }

    return NextResponse.json({ results: [] });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
