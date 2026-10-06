import type { Metadata } from "next";
import { isContentEditorEnabled } from "@/lib/content-json-file";
import { ContentJsonEditor } from "./content-json-editor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Content JSON",
};

export default function ContentJsonPage() {
  if (!isContentEditorEnabled()) {
    return (
      <p className="p-6">
        The content editor is only available while the Next dev server is running.
      </p>
    );
  }
  return <ContentJsonEditor />;
}
