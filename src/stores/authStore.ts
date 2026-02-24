import { create } from "zustand";
import { Session } from "@supabase/supabase-js";
import { supabase, Profile } from "@/lib/supabase";

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  ready: boolean;

  boot: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  ready: false,

  boot: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        set({ session: null, profile: null, ready: true });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      set({ session, profile: profile ?? null, ready: true });
    } catch {
      set({ ready: true });
    }
  },

  setProfile: (profile) => set({ profile }),

  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return;
    set({ profile: { ...profile, ...updates } });
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id);
    if (error) {
      set({ profile });
      throw error;
    }
  },

  signOut: async () => {
    // Clear local state first so the UI redirects immediately
    set({ session: null, profile: null });
    // Then tell Supabase — we don't await or care about the result
    supabase.auth.signOut();
  },
}));
