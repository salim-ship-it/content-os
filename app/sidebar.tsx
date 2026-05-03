"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type NavItem = { href: string; label: string; pending?: boolean };
const NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/onboarding/voice", label: "Voice profile" },
  { href: "/ideas", label: "Ideas" },
  { href: "/sources", label: "Sources" },
  { href: "/swipe-file", label: "Swipe File" },
  { href: "/lead-magnets", label: "Lead Magnets" },
  { href: "/image", label: "Image" },
  { href: "/preview", label: "Preview" },
  { href: "/analytics", label: "Analytics" },
  { href: "/learn", label: "Learn" },
];

const STORAGE_KEY = "vl.sidebar.collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "true") setCollapsed(true);
    } catch {}
  }, []);

  if (pathname === "/login") return null;

  async function handleSignOut() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {}
  }

  if (mounted && collapsed) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label="Show sidebar"
        title="Show sidebar"
        className="fixed top-4 left-4 z-50 w-9 h-9 rounded-lg border bg-white flex items-center justify-center text-sm font-bold transition-all hover:shadow-md"
        style={{ borderColor: "var(--vl-border)", color: "var(--vl-text-muted)" }}
      >
        ☰
      </button>
    );
  }

  return (
    <aside
      className="w-60 border-r bg-white p-5 flex flex-col gap-1 relative"
      style={{ borderColor: "var(--vl-border)" }}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label="Hide sidebar"
        title="Hide sidebar"
        className="absolute top-4 right-3 w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-colors hover:bg-[var(--vl-bg-card-hover)]"
        style={{ color: "var(--vl-text-muted)" }}
      >
        ←
      </button>
      <Link href="/" className="px-3 py-3 mb-4 block">
        <div className="flex items-baseline">
          <span
            className="text-xl font-bold"
            style={{
              fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
              color: "var(--vl-text-heading)",
              letterSpacing: "-0.01em",
            }}
          >
            Content
          </span>
          <span
            className="text-xl font-bold ml-1"
            style={{
              fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
              color: "var(--vl-accent)",
              letterSpacing: "-0.01em",
            }}
          >
            OS
          </span>
        </div>
      </Link>
      {NAV.map((item) => {
        const pending = "pending" in item && item.pending;
        return (
          <Link
            key={item.href}
            href={pending ? "#" : item.href}
            className={`px-3 py-2 rounded-[10px] text-sm flex items-center justify-between transition-colors ${
              pending ? "cursor-not-allowed" : "hover:bg-[var(--vl-bg-card-hover)]"
            }`}
            style={{
              color: pending ? "var(--vl-text-muted)" : "var(--vl-text-heading)",
              opacity: pending ? 0.55 : 1,
            }}
          >
            <span className="font-medium">{item.label}</span>
            {pending && (
              <span
                className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ color: "var(--vl-accent)", background: "var(--vl-accent-glow)" }}
              >
                Pending
              </span>
            )}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={handleSignOut}
        className="mt-auto pt-6 text-[10px] uppercase tracking-[0.18em] text-left hover:opacity-70 transition-opacity"
        style={{ color: "var(--vl-text-muted)" }}
      >
        Sign out
      </button>
    </aside>
  );
}
