"use client";

import { useNavStore } from "@/store/nav-store";

interface ContentWrapperProps {
  readonly children: React.ReactNode;
}

export function ContentWrapper({ children }: ContentWrapperProps) {
  const navPhase = useNavStore((s) => s.navPhase);
  const hideContent = navPhase === "opening" || navPhase === "open";

  return (
    <div className={`flex flex-1 flex-col${hideContent ? " hidden" : ""}`}>
      {children}
    </div>
  );
}
