import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface CollectionItem {
  id: string;
  type: 'mtg' | 'pokemon' | 'sports_card' | 'memorabilia' | 'other';
  name: string;
  set_name?: string | null;
  card_number?: string | null;
  year?: string | null;
  brand?: string | null;
  condition?: string | null;
  grade?: string | null;
  is_foil?: boolean | null;
  is_rookie?: boolean | null;
  is_autographed?: boolean | null;
  item_subtype?: string | null;
  player?: string | null;
  sport?: string | null;
  team?: string | null;
  is_authenticated?: boolean | null;
  cert_number?: string | null;
  purchase_price?: number | null;
  purchase_date?: string | null;
  avg_sold_price?: number | null;
  avg_listing_price?: number | null;
  last_price_check?: string | null;
  api_image_url?: string | null;
  image_url?: string | null;
  notes?: string | null;
  quantity?: number | null;
  created_at: string;
}
