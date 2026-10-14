import type { Metadata } from "next";
import "./fl.css";

export const metadata: Metadata = {
  title: "Flash site",
};

interface FlLayoutProps {
  children: React.ReactNode;
}

export default function FlLayout({ children }: FlLayoutProps) {
  return children;
}
