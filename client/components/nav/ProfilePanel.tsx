"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { useProfileQuery } from "@/lib/queries/auth";

export default function ProfilePanel({ onClose }: { onClose: () => void }) {
  const { data: profile, isLoading, isError } = useProfileQuery();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/20 p-4 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Profile details"
    >
      <div
        className="w-full max-w-sm bg-canvas border border-hairline rounded-lg p-6 mt-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-md text-ink">Profile</h2>
          <button
            onClick={onClose}
            aria-label="Close profile panel"
            className="text-body hover:text-ink transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {isLoading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-surface-soft rounded-full w-2/3" />
            <div className="h-4 bg-surface-soft rounded-full w-full" />
            <div className="h-4 bg-surface-soft rounded-full w-1/2" />
          </div>
        )}

        {isError && (
          <p className="body-sm text-body">
            We couldn&apos;t load your profile right now. Please try again shortly.
          </p>
        )}

        {profile && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-surface-soft border border-hairline flex items-center justify-center heading-sm text-ink flex-shrink-0">
                {profile.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <p className="body-strong text-ink">{profile.name}</p>
                <p className="body-sm text-body">{profile.email}</p>
              </div>
            </div>

            <div className="border-t border-hairline pt-4 flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="body-sm text-body">Member since</span>
                <span className="body-sm-strong text-ink">
                  {new Date(profile.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
