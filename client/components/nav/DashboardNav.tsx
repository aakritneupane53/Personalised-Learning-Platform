"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Menu, X } from "lucide-react";
import { useProfileQuery, useLogoutMutation } from "@/lib/queries/auth";
import ProfilePanel from "./ProfilePanel";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`text-sm font-medium px-1 py-1 transition-colors ${
        active ? "text-ink" : "text-body hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export default function DashboardNav() {
  const { data: profile } = useProfileQuery();
  const logoutMutation = useLogoutMutation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="border-b border-hairline h-14 px-6 md:px-12 flex items-center justify-between sticky top-0 bg-canvas/90 backdrop-blur-sm z-40">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <svg
              viewBox="0 0 100 100"
              className="w-7 h-7 stroke-[1.5] stroke-ink fill-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M 30,80 L 70,80 L 70,60 L 60,60 L 60,30 C 60,25 55,20 50,20 L 45,20 C 42,20 40,22 40,25 L 40,60 L 30,60 Z" />
              <path d="M 42,20 L 40,10 M 48,20 L 48,8" />
              <circle cx="53" cy="26" r="2" fill="currentColor" />
            </svg>
            <span className="body-strong font-semibold tracking-tight">Ollama Learn</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <NavLink href="/dashboard/courses">Courses</NavLink>
            <NavLink href="/dashboard/courses/my">My Courses</NavLink>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/dashboard/courses/new"
            className="h-9 px-5 rounded-full bg-ink text-white hover:bg-ink-deep button-md flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} />
            New Course
          </Link>

          <button
            onClick={() => setProfileOpen(true)}
            aria-label="Open profile"
            className="w-9 h-9 rounded-full bg-surface-soft border border-hairline flex items-center justify-center text-sm font-medium text-ink hover:border-hairline-strong transition-colors cursor-pointer"
          >
            {profile?.name?.charAt(0).toUpperCase() || "?"}
          </button>

          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="text-body hover:text-ink transition-colors text-sm font-medium px-2 py-1 cursor-pointer disabled:opacity-50"
          >
            Sign out
          </button>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1 text-ink"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden border-b border-hairline bg-canvas px-6 py-6 flex flex-col gap-4 z-40">
          <Link
            href="/dashboard/courses"
            onClick={() => setMobileMenuOpen(false)}
            className="body-strong hover:text-ink transition-colors"
          >
            Courses
          </Link>
          <Link
            href="/dashboard/courses/my"
            onClick={() => setMobileMenuOpen(false)}
            className="body-strong hover:text-ink transition-colors"
          >
            My Courses
          </Link>
          <Link
            href="/dashboard/courses/new"
            onClick={() => setMobileMenuOpen(false)}
            className="h-10 w-full rounded-full bg-ink text-white hover:bg-ink-deep flex items-center justify-center gap-1.5 font-medium"
          >
            <Plus size={14} />
            New Course
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setProfileOpen(true);
            }}
            className="h-10 w-full rounded-full border border-hairline-strong text-ink hover:bg-surface-soft flex items-center justify-center font-medium cursor-pointer"
          >
            Profile
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              logoutMutation.mutate();
            }}
            className="h-10 w-full rounded-full border border-hairline-strong text-ink hover:bg-surface-soft flex items-center justify-center font-medium cursor-pointer"
          >
            Sign out
          </button>
        </div>
      )}

      {profileOpen && <ProfilePanel onClose={() => setProfileOpen(false)} />}
    </>
  );
}
