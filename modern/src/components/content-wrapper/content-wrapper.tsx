"use client";

import { useUIStore } from "@/store/ui-store";

interface ContentWrapperProps {
  readonly children: React.ReactNode;
}

export function ContentWrapper({ children }: ContentWrapperProps) {
  const navOpen = useUIStore((s) => s.navOpen);

  return (
    <div className={`flex flex-1 flex-col${navOpen ? " hidden" : ""}`}>
      {children}
    </div>
  );
}
