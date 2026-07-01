"use client";

import { useUIStore } from "@/store/ui-store";

export function NavButton() {
  const toggleNav = useUIStore((s) => s.toggleNav);

  return (
    <button
      onClick={toggleNav}
      className="absolute top-0 left-0 z-10 flex h-[60px] w-[90px] cursor-pointer items-center justify-center"
      aria-label="Toggle navigation"
    >
      <svg
        width="32"
        height="24"
        viewBox="0 0 32 24"
        className="text-[#D6D59D] transition-colors hover:text-[#A8682B]"
      >
        <path d="M0 2h32M0 12h32M0 22h32" stroke="currentColor" strokeWidth="3" fill="none" />
      </svg>
    </button>
  );
}
