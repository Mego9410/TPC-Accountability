/**
 * Centralised environment access with "is configured" flags.
 *
 * The platform is built foundation-first: every external integration degrades
 * to a clearly-marked demo stub when its key is absent, so the product remains
 * fully navigable without any third-party setup.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  supabase: {
    // Placeholder values keep the client constructor from throwing during
    // build/prerender. Real usage is always gated behind `isConfigured`.
    url: SUPABASE_URL || "https://placeholder.supabase.co",
    anonKey: SUPABASE_ANON_KEY || "placeholder-anon-key",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    isConfigured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
  },

  daily: {
    apiKey: process.env.DAILY_API_KEY ?? "",
    domain: process.env.NEXT_PUBLIC_DAILY_DOMAIN ?? "",
    get isConfigured() {
      return Boolean(process.env.DAILY_API_KEY);
    },
  },

  deepgram: {
    apiKey: process.env.DEEPGRAM_API_KEY ?? "",
    get isConfigured() {
      return Boolean(process.env.DEEPGRAM_API_KEY);
    },
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    get isConfigured() {
      return Boolean(process.env.OPENAI_API_KEY);
    },
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ??
      "http://localhost:3000/api/calendar/google/callback",
    get isConfigured() {
      return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    },
  },

  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID ?? "",
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET ?? "",
    tenantId: process.env.MICROSOFT_TENANT_ID ?? "common",
    redirectUri:
      process.env.MICROSOFT_REDIRECT_URI ??
      "http://localhost:3000/api/calendar/microsoft/callback",
    get isConfigured() {
      return Boolean(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
    },
  },
};

export const isSupabaseConfigured = env.supabase.isConfigured;
