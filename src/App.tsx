import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { AuthCallbackPage } from "@/pages/AuthCallbackPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import {
  CalendarPage,
  MySchedulePage,
  FindTimePage,
  ProfilePage,
} from "@/pages/PlaceholderPages";

export default function App() {
  const { setSession, setLoading, fetchProfile } = useAuthStore();

  useEffect(() => {
    // Initial session check on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Keep session in sync (magic link redirect, OAuth, tab changes, expiry)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setLoading, fetchProfile]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ───────────────────────────────────────────────────────── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* ── Onboarding (authenticated, but profile not yet created) ──────── */}
        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* ── App shell (authenticated + profile required) ─────────────────── */}
        <Route
          path="/app"
          element={
            <ProtectedRoute requireProfile>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/calendar" replace />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="schedule" element={<MySchedulePage />} />
          <Route path="find" element={<FindTimePage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* ── Fallbacks ────────────────────────────────────────────────────── */}
        <Route path="/" element={<Navigate to="/app/calendar" replace />} />
        <Route path="*" element={<Navigate to="/app/calendar" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
