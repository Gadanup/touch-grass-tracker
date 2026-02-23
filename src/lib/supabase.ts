import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase env vars — check your .env.local file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Explicitly use localStorage (default, but being explicit avoids edge cases)
    storage: window.localStorage,
    // Don't auto-refresh in the background before we've confirmed the session
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// ─── Database types ───────────────────────────────────────────────────────────

export type ScheduleType = "busy" | "available" | "maybe";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  avatar_emoji: string;
  avatar_color: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  user_id: string;
  title: string | null;
  type: ScheduleType;
  is_all_day: boolean;
  starts_at: string;
  ends_at: string;
  repeat_rule: string | null;
  note: string | null;
  created_at: string;
}

export type NewSchedulePayload = Omit<Schedule, "id" | "created_at">;
