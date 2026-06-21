import { createClient } from "@/lib/supabase/client";

// Admin write operations live in a server-only module ("use server").
export {
  createDiscountCode, updateDiscountCode, deleteDiscountCode,
  saveSubscriptionPrices,
} from "./pricing-actions";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
export interface DiscountCode {
  id: string;
  code: string;
  discountPercent: number;
  uses: number;
  maxUses: number;
  expiryDate: string | null;
  createdAt: string;
}

// A single subscription price tier (e.g. monthly / quarterly / yearly).
export interface SubscriptionPrice {
  id: string;
  label: string;
  months: number;
  price: number;
  discountedPrice: number | null;
  isActive: boolean;
}

const PRICES_KEY = "subscription_prices";

// ---------------------------------------------------------------------
// Read API (browser, anon key + RLS)
// ---------------------------------------------------------------------
export async function fetchDiscountCodes(): Promise<DiscountCode[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message === 'Failed to fetch' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      console.warn("Network offline, cannot fetch discount codes.");
    } else {
      console.warn("Error fetching discount codes:", error);
    }
    return [];
  }

  return data.map((d: any) => ({
    id: d.id,
    code: d.code,
    discountPercent: d.discount_percent ?? 0,
    uses: d.uses ?? 0,
    maxUses: d.max_uses ?? 0,
    expiryDate: d.expiry_date,
    createdAt: d.created_at,
  }));
}

// Validate a code at checkout: returns the code if usable, otherwise null.
export async function validateDiscountCode(rawCode: string): Promise<DiscountCode | null> {
  const supabase = createClient();
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) return null;

  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) return null;

  const expired = data.expiry_date
    ? new Date(data.expiry_date) < new Date(new Date().toDateString())
    : false;
  const usedUp = data.max_uses > 0 && data.uses >= data.max_uses;
  if (expired || usedUp) return null;

  return {
    id: data.id,
    code: data.code,
    discountPercent: data.discount_percent ?? 0,
    uses: data.uses ?? 0,
    maxUses: data.max_uses ?? 0,
    expiryDate: data.expiry_date,
    createdAt: data.created_at,
  };
}

export async function fetchSubscriptionPrices(): Promise<SubscriptionPrice[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", PRICES_KEY)
    .maybeSingle();

  if (error) {
    if (error.message === 'Failed to fetch' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      console.warn("Network offline, cannot fetch subscription prices.");
    } else {
      console.warn("Error fetching subscription prices:", error);
    }
    return [];
  }
  if (!data || !Array.isArray(data.value)) return [];
  return data.value as SubscriptionPrice[];
}
