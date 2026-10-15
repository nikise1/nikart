import { ViewTransition } from "react";

export default function HomePage() {
  return (
    <ViewTransition enter="none" exit="none" update="none" share="none" default="none">
      <main className="flex-1" />
    </ViewTransition>
  );
}
