import type { Metadata } from "next";
import { ContentJsonEditor } from "./content-json-editor";

export const metadata: Metadata = {
  title: "Content JSON",
};

export default function ContentJsonPage() {
  return <ContentJsonEditor />;
}
