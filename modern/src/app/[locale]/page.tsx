"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/ui-store";

export default function HomePage() {
  const openNav = useUIStore((s) => s.openNav);

  useEffect(() => {
    openNav();
  }, [openNav]);

  return <main className="flex-1" />;
}
