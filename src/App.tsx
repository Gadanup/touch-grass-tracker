import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { AuthCallbackPage } from "@/pages/AuthCallbackPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { MySchedulePage } from "@/pages/MySchedulePage";
import { CalendarPage } from "@/pages/CalendarPage";
import { FindTimePage } from "@/pages/FindTimePage";
import { ProfilePage } from "@/pages/PlaceholderPages";

export default function App() {
  const { boot } = useAuthStore();

  useEffect(() => {
    // Boot once on mount — no listener needed, signOut clears state directly
    boot();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
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
        <Route path="/" element={<Navigate to="/app/calendar" replace />} />
        <Route path="*" element={<Navigate to="/app/calendar" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
