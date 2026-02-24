import { create } from "zustand";
import { supabase, Schedule, NewSchedulePayload } from "@/lib/supabase";

interface ScheduleState {
  schedules: Schedule[];
  loading: boolean;
  error: string | null;

  fetchSchedules: (userId: string) => Promise<void>;
  addSchedule: (payload: NewSchedulePayload) => Promise<void>;
  updateSchedule: (
    id: string,
    updates: Partial<NewSchedulePayload>,
  ) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchSchedules: async (userId) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("user_id", userId)
      .order("starts_at", { ascending: true });

    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ schedules: data as Schedule[], loading: false });
    }
  },

  addSchedule: async (payload) => {
    set({ error: null });
    const { data, error } = await supabase
      .from("schedules")
      .insert(payload)
      .select()
      .single();

    if (error) {
      set({ error: error.message });
      throw error;
    } else {
      set((state) => ({
        schedules: [...state.schedules, data as Schedule].sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        ),
      }));
    }
  },

  updateSchedule: async (id, updates) => {
    set({ error: null });
    // Optimistic update
    const prev = get().schedules;
    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.id === id ? { ...s, ...updates } : s,
      ),
    }));

    const { error } = await supabase
      .from("schedules")
      .update(updates)
      .eq("id", id);

    if (error) {
      set({ schedules: prev, error: error.message });
      throw error;
    }
  },

  deleteSchedule: async (id) => {
    set({ error: null });
    const prev = get().schedules;
    // Optimistic remove
    set((state) => ({
      schedules: state.schedules.filter((s) => s.id !== id),
    }));

    const { error } = await supabase.from("schedules").delete().eq("id", id);

    if (error) {
      set({ schedules: prev, error: error.message });
      throw error;
    }
  },
}));
