/**
 * Centralised environment access with "is configured" flags.
 *
 * The platform is built foundation-first: every external integration degrades
 * to a clearly-marked demo stub when its key is absent, so the product remains
 * fully navigable without any third-party setup.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// Supports both the newer publishable key (sb_publishable_…) and the legacy
// anon key. The publishable key is a drop-in replacement for the anon key.
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

const PREVIEW_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PREVIEW !== "false";

export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  // The furnished example ("the tour"). Normally available only when Supabase
  // is unconfigured; set NEXT_PUBLIC_ENABLE_PREVIEW=true to keep it available
  // even once real records are connected.
  previewEnabled: PREVIEW_ENABLED,

  supabase: {
    // Placeholder values keep the client constructor from throwing during
    // build/prerender. Real usage is always gated behind `isConfigured`.
    url: SUPABASE_URL || "https://placeholder.supabase.co",
    anonKey: SUPABASE_ANON_KEY || "placeholder-anon-key",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    isConfigured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    get isConfigured() {
      return Boolean(process.env.OPENAI_API_KEY);
    },
  },
};

export const isSupabaseConfigured = env.supabase.isConfigured;
