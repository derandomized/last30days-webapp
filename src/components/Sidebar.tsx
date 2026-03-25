"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "infos-sidebar-collapsed";

const navItems = [
  {
    icon: (
      <span className="text-xs font-bold bg-blue-500 text-white rounded px-1.5 py-0.5 leading-none">
        30
      </span>
    ),
    label: "Last30Days",
    href: "/last30days",
    matchPrefix: "/last30days",
  },
];

export default function Sidebar() {
  // Default to expanded — matches server render
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  return (
    <aside
      className={`${
        collapsed ? "w-[60px]" : "w-[240px]"
      } shrink-0 border-r border-zinc-800 bg-black flex flex-col transition-all duration-200 ease-in-out h-screen sticky top-0`}
    >
      {/* Header */}
      <div className="flex items-center h-14 px-3">
        <button
          onClick={toggleCollapsed}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-200"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        {!collapsed && (
          <span className="ml-2 text-lg font-semibold text-zinc-100 tracking-tight">
            infOS
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.matchPrefix);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              <span className="shrink-0 flex items-center justify-center w-6">
                {item.icon}
              </span>
              {!collapsed && (
                <span className="text-sm font-medium truncate">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
