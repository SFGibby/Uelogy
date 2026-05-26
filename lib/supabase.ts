import { createClient } from '@supabase/supabase-js';

// These are public-facing keys (safe to hardcode — anon key has no write access beyond RLS)
const SUPABASE_URL = 'https://zusoxekerqrvdlctbkcc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rsJEEE17xhg45mkpVDithw_mCwwlDFh';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface GridStage {
  id: string;
  name: string;
  color: string;
  position: number;
  created_at: string;
}

export interface GridType {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface GridTaskLink {
  label: string;
  url: string;
}

export interface GridTask {
  id: string;
  title: string;
  description?: string | null;
  stage_id?: string | null;
  type_id?: string | null;
  position: number;
  due_at?: string | null;
  links: GridTaskLink[];
  created_at: string;
  updated_at: string;
}

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
