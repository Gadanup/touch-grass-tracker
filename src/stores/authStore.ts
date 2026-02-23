import { create } from "zustand";
import { Session } from "@supabase/supabase-js";
import { supabase, Profile } from "@/lib/supabase";

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  loading: true,

  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      // PGRST116 = row not found (new user, no profile yet) — expected
      if (error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
      }
      set({ profile: null });
    } else {
      set({ profile: data as Profile });
    }
  },

  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return;

    // Optimistic update
    set({ profile: { ...profile, ...updates } });

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id);

    if (error) {
      // Rollback on failure
      set({ profile });
      throw error;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
}));
