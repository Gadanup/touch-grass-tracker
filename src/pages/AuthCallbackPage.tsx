import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { boot } = useAuthStore();

  useEffect(() => {
    const run = async () => {
      // Supabase parses the URL hash automatically on getSession()
      // For password recovery the hash contains type=recovery
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace("#", "?"));
      const type = params.get("type");

      // Let the SDK process the token
      await boot();

      if (type === "recovery") {
        // Send them to profile where the change-password section lives
        navigate("/app/profile?changePassword=1", { replace: true });
      } else {
        const { profile } = useAuthStore.getState();
        navigate(profile ? "/app/calendar" : "/welcome", { replace: true });
      }
    };

    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <LoadingScreen />;
}
