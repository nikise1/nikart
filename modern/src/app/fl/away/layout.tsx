import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AwayFL preview",
};

interface AwayLayoutProps {
  children: React.ReactNode;
}

export default function AwayLayout({ children }: AwayLayoutProps) {
  return children;
}
