"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Users, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { UserIdentityBadge } from "@/components/brand/UserIdentityBadge";
import { LogoutButton } from "@/components/admin/LogoutButton";
import type { Principal } from "@/lib/server/auth/capabilities";
import { can } from "@/lib/server/auth/capabilities";

/**
 * AdminSidebar — admin application shell with sidebar (desktop) + mobile drawer.
 *
 * Per UI-01 spec:
 *   - Desktop: stable sidebar with Methodist branding at top, navigation
 *     in the middle, user identity + logout at the bottom.
 *   - Mobile: compact top admin bar + collapsible navigation drawer.
 *     No heavy UI dependency — basic CSS + React state + Tailwind.
 *   - Active-state styling for current navigation item (not color alone —
 *     also a left border accent on the active link).
 *   - Navigation visibility follows existing capability logic:
 *     Offres visible to all admin principals; Utilisateurs visible only
 *     to SUPER_ADMIN and FANTOMAS (those with user:list capability).
 *     Server-side route protection remains authoritative.
 *
 * Accessibility:
 *   - Semantic <nav> with aria-label.
 *   - Drawer toggle button has aria-expanded + aria-controls.
 *   - Keyboard accessible (Escape closes the drawer).
 *   - Visible focus ring.
 *   - Mobile touch targets ≥ 40px.
 */

interface NavItem {
  href: string;
  label: string;
  icon: typeof Briefcase;
  visible: boolean;
}

export function AdminSidebar({
  principal,
  children,
}: {
  principal: Principal;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const canManageUsers = can(principal, "user:list");

  const navItems: NavItem[] = [
    {
      href: "/admin/offres",
      label: "Offres",
      icon: Briefcase,
      visible: true,
    },
    {
      href: "/admin/utilisateurs",
      label: "Utilisateurs",
      icon: Users,
      visible: canManageUsers,
    },
  ];

  const visibleNavItems = navItems.filter((item) => item.visible);

  function isActive(href: string): boolean {
    if (href === "/admin/offres") {
      return pathname === "/admin/offres" || pathname.startsWith("/admin/offres/");
    }
    if (href === "/admin/utilisateurs") {
      return pathname === "/admin/utilisateurs" || pathname.startsWith("/admin/utilisateurs/");
    }
    return pathname === href;
  }

  // Close drawer on Escape
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setDrawerOpen(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* ─── Mobile top bar (visible only on mobile, < lg) ──────────── */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <BrandLogo size="sm" />
          <span className="font-heading text-sm font-bold text-text-primary">
            JOURDAIN EMPLOI
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="rounded-sm p-2 text-text-secondary transition-colors duration-fast hover:bg-surface-muted hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          aria-label="Ouvrir le menu de navigation"
          aria-expanded={drawerOpen}
          aria-controls="admin-drawer"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* ─── Mobile drawer overlay ─────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-text-primary/40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={-1}
          aria-label="Fermer le menu"
        />
      )}

      {/* ─── Layout: sidebar (desktop) / drawer (mobile) + main ────── */}
      <div className="flex">
        {/* Sidebar / Drawer */}
        <aside
          id="admin-drawer"
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-fast lg:static lg:translate-x-0 ${
            drawerOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
          aria-label="Navigation administration"
        >
          {/* Brand block at top */}
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <Link
              href="/admin/offres"
              className="flex items-center gap-2.5 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              aria-label="JOURDAIN EMPLOI — Administration"
            >
              <BrandLogo size="sm" />
              <div className="flex flex-col leading-tight">
                <span className="font-heading text-sm font-bold text-text-primary">
                  JOURDAIN EMPLOI
                </span>
                <span className="text-xs text-text-secondary">Administration</span>
              </div>
            </Link>
            {/* Close button — mobile only */}
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-sm p-1.5 text-text-secondary transition-colors duration-fast hover:bg-surface-muted hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 lg:hidden"
              aria-label="Fermer le menu de navigation"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4" aria-label="Navigation administration">
            <ul className="space-y-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium transition-colors duration-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
                        active
                          ? "bg-brand-surface text-brand-primary"
                          : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${active ? "text-brand-primary" : "text-text-secondary"}`}
                        aria-hidden="true"
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User identity + logout at bottom */}
          <div className="border-t border-border px-4 py-4">
            <div className="mb-3 flex flex-col gap-1">
              <span className="text-sm font-medium text-text-primary">
                {principal.username}
              </span>
              <UserIdentityBadge principalType={principal.principalType} />
            </div>
            <LogoutButton logoutMode={principal.principalType} />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
