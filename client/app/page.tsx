"use client";
import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { useLogoutMutation } from "@/lib/queries/auth";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const logoutMutation = useLogoutMutation();

  return (
    <div className="min-h-screen bg-canvas flex flex-col font-sans">
      {/* Primary Navigation */}
      <nav className="border-b border-hairline h-14 px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="body-strong font-semibold tracking-tight text-ink">
          Learn
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="h-9 px-5 rounded-full border border-hairline-strong text-ink hover:bg-surface-soft button-md flex items-center justify-center transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="h-9 px-5 rounded-full bg-ink text-white hover:bg-ink-deep button-md flex items-center justify-center transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-body hover:text-ink transition-colors text-sm font-medium px-2 py-1"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="h-9 px-5 rounded-full bg-ink text-white bg-ink-deep hover:bg-white hover:text-ink-deep hover:border button-md flex items-center justify-center transition-colors"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <section className="max-w-xl w-full flex flex-col items-center text-center py-24">
          <h1 className="display-xl text-ink mb-5 leading-tight">
            Learn anything, your way.
          </h1>
          <p className="body-md text-body leading-relaxed mb-10 max-w-md">
            Create a course on any subject and follow a structured path built around how you learn best.
          </p>
          <Link
            href="/register"
            className="h-10 px-8 rounded-full bg-ink text-white hover:bg-ink-deep button-md flex items-center gap-2 transition-all hover:gap-3"
          >
            Start learning <ArrowRight size={14} />
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline py-6 px-6 flex items-center justify-center">
        <span className="caption-sm text-mute">© 2026 Learn</span>
      </footer>
    </div>
  );
}