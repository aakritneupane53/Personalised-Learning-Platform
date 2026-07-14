"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useProfileQuery } from "@/lib/queries/auth";
import DashboardNav from "@/components/nav/DashboardNav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isInitialized, clear } = useAuthStore();

  const { data: profile, isLoading: isProfileLoading, isError: isProfileError } = useProfileQuery();

  // Session bootstrap (POST /auth/refresh) runs once, globally, in AuthProvider.
  // This layout only guards the route based on the already-resolved auth state.
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/login");
    }
  }, [isInitialized, isAuthenticated, router]);

  // Loading skeleton during bootstrap
  if (!isInitialized) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-canvas">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ink"></div>
          <p className="body-sm text-body">Loading secure session...</p>
        </div>
      </div>
    );
  }

  // Prevent flash before redirect completes
  if (!isAuthenticated) {
    return null;
  }

  // Loading skeleton during profile loading
  if (isProfileLoading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-canvas">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ink"></div>
          <p className="body-sm text-body">Fetching learning profile...</p>
        </div>
      </div>
    );
  }

  if (isProfileError || !profile) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-canvas p-6">
        <div className="max-w-md w-full border border-hairline rounded-lg p-8 text-center bg-canvas">
          <h2 className="heading-lg text-ink mb-4">Error Loading Profile</h2>
          <p className="body-md text-body mb-6">
            We encountered a problem loading your user profile. Please try logging in again.
          </p>
          <button
            onClick={() => {
              clear();
              router.push("/login");
            }}
            className="w-full h-9 rounded-full bg-ink text-white button-md flex items-center justify-center hover:bg-ink-deep transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <DashboardNav />
      {children}
    </div>
  );
}
