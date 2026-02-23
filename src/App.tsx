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
    let didInit = false;

    const init = async () => {
      // Step 1: immediately restore session from localStorage
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await fetchProfile(session.user.id);
      }
      didInit = true;
      setLoading(false);
    };

    init();

    // Step 2: listen for subsequent changes (tab focus, token refresh, sign out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Skip the first fire — init() already handled it
      if (!didInit) return;
      setSession(session);
      if (session) {
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Safety net: if something above hangs for 5s, unblock the UI anyway
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
