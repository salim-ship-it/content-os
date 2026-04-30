"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV = [
  { href: "/", label: "Inbox", count: 12, icon: InboxIcon },
  { href: "/drafts", label: "Drafts", count: 4, icon: DraftIcon },
  { href: "/scheduled", label: "Scheduled", count: 2, icon: CalendarIcon },
  { href: "/posts", label: "Shipped", count: 87, icon: ShipIcon },
];

const SECONDARY = [
  { href: "/sources", label: "Sources", icon: SourceIcon },
  { href: "/voice", label: "Voice", icon: VoiceIcon },
  { href: "/image", label: "Image", icon: ImageIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="shrink-0 flex flex-col justify-between border-r w-[240px] h-screen relative z-10"
      style={{ background: "var(--co-paper-soft)", borderColor: "var(--co-rule)" }}>
      <div>
        {/* Brand */}
        <div className="px-6 pt-7 pb-6">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[22px] font-semibold tracking-tight" style={{ color: "var(--co-ink)" }}>
              Content OS
            </span>
          </div>
          <div className="text-[11px] mt-1 tracking-wide uppercase" style={{ color: "var(--co-ink-mute)" }}>
            Editorial brain
          </div>
        </div>

        {/* Primary nav */}
        <nav className="px-3 space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-[13.5px] font-medium transition-all"
                style={{
                  background: active ? "var(--co-accent-soft)" : "transparent",
                  color: active ? "var(--co-accent-ink)" : "var(--co-ink-soft)",
                }}
              >
                <span className="flex items-center gap-2.5">
                  <item.icon active={active} />
                  {item.label}
                </span>
                <span className="text-[11px] tabular-nums font-semibold" style={{
                  color: active ? "var(--co-accent-ink)" : "var(--co-ink-mute)",
                }}>
                  {item.count}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-6 my-4 border-t" style={{ borderColor: "var(--co-rule)" }} />

        {/* Secondary nav */}
        <nav className="px-3 space-y-0.5">
          {SECONDARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors"
              style={{ color: "var(--co-ink-soft)" }}
            >
              <item.icon active={false} />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Footer — today's stat */}
      <div className="px-6 py-5 border-t" style={{ borderColor: "var(--co-rule)" }}>
        <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--co-ink-mute)" }}>
          This week
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[28px] font-semibold leading-none" style={{ color: "var(--co-ink)" }}>3</span>
          <span className="text-[12px]" style={{ color: "var(--co-ink-mute)" }}>posts shipped</span>
        </div>
        <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "var(--co-rule)" }}>
          <div className="h-full rounded-full" style={{ width: "60%", background: "var(--co-accent)" }} />
        </div>
        <div className="text-[10px] mt-1.5" style={{ color: "var(--co-ink-mute)" }}>
          Goal: 5 / week
        </div>
      </div>
    </aside>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────

function iconStroke(active: boolean) {
  return active ? "var(--co-accent-ink)" : "var(--co-ink-mute)";
}

function InboxIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={iconStroke(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
    </svg>
  );
}
function DraftIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={iconStroke(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={iconStroke(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function ShipIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={iconStroke(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
    </svg>
  );
}
function SourceIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={iconStroke(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function VoiceIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={iconStroke(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
    </svg>
  );
}
function ImageIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={iconStroke(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}
