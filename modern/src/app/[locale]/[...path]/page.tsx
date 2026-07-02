import { ViewTransition } from "react";
import { findByPath } from "@/lib/data/content";
import { notFound } from "next/navigation";
import { ContentPage } from "@/components/content-page";

interface PathPageProps {
  params: Promise<{ locale: string; path: string[] }>;
}

export default async function PathPage({ params }: PathPageProps) {
  const { locale, path } = await params;
  const { node } = findByPath(path);

  if (!node) {
    notFound();
  }

  return (
    <ViewTransition
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "crossfade",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "crossfade",
      }}
      default="crossfade"
    >
      <ContentPage node={node} path={path} locale={locale as "en" | "es"} />
    </ViewTransition>
  );
}
