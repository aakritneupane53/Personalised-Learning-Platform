"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/axios";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Bootstraps the session exactly once per app load, regardless of which
    // route the user lands on first (public or protected).
    if (useAuthStore.getState().isInitialized) return;

    let active = true;

    async function bootstrap() {
      const { setAccessToken, clear, initialize } = useAuthStore.getState();

      try {
        const response = await api.post("/auth/refresh");
        if (active) {
          setAccessToken(response.data.accessToken);
        }
      } catch {
        if (active) {
          clear();
        }
      } finally {
        if (active) {
          initialize();
        }
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  return <>{children}</>;
}
