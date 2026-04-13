import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const name = searchParams.get('name');
  const set = searchParams.get('set') ?? '';

  if (!type || !name) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  try {
    if (type === 'mtg') {
      const query = set ? `!"${name}" set:${set}` : `!"${name}"`;
      const res = await fetch(
        `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}${set ? `&set=${encodeURIComponent(set)}` : ''}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) return NextResponse.json({ prices: null });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const card: any = await res.json();
      return NextResponse.json({
        avg_sold_price: card.prices?.usd ? parseFloat(card.prices.usd) : null,
        avg_listing_price: card.prices?.usd ? parseFloat(card.prices.usd) * 1.1 : null,
        api_image_url: card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? null,
        source: 'Scryfall',
        _unused: query,
      });
    }

    if (type === 'pokemon') {
      const q = set
        ? `name:"${name}" set.name:"${set}"`
        : `name:"${name}"`;
      const res = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(q)}&pageSize=1`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) return NextResponse.json({ prices: null });
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const card: any = data.data?.[0];
      if (!card) return NextResponse.json({ prices: null });
      const market = card.tcgplayer?.prices?.normal?.market
        ?? card.tcgplayer?.prices?.holofoil?.market
        ?? null;
      return NextResponse.json({
        avg_sold_price: market,
        avg_listing_price: market ? market * 1.1 : null,
        api_image_url: card.images?.large ?? null,
        source: 'TCGPlayer via Pokémon TCG API',
      });
    }

    // eBay slot — wired in once App ID is approved
    return NextResponse.json({ prices: null, note: 'eBay pricing pending account approval' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
