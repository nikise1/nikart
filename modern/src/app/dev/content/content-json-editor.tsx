"use client";

import { useEffect, useRef, useState } from "react";

type JsonEditor = {
  set: (json: unknown) => void;
  get: () => unknown;
  destroy: () => void;
};

type JsonEditorConstructor = new (
  container: HTMLElement,
  options: {
    mode: "tree";
    modes: Array<"tree" | "code">;
    history: boolean;
    name: string;
  },
) => JsonEditor;

const editorScript = "/dev/vendor/jsoneditor/jsoneditor.min.js";
const editorStyle = "/dev/vendor/jsoneditor/jsoneditor.min.css";

function loadEditorConstructor(): Promise<JsonEditorConstructor> {
  const existing = document.querySelector(`link[href="${editorStyle}"]`);
  if (!existing) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = editorStyle;
    document.head.appendChild(link);
  }

  const ready = window.JSONEditor;
  if (ready) {
    return Promise.resolve(ready);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = editorScript;
    script.onload = () => {
      if (window.JSONEditor) {
        resolve(window.JSONEditor);
        return;
      }
      reject(new Error("jsoneditor did not load"));
    };
    script.onerror = () => {
      reject(new Error("Could not load the editor."));
    };
    document.body.appendChild(script);
  });
}

declare global {
  interface Window {
    JSONEditor?: JsonEditorConstructor;
  }
}

interface ContentJsonEditorProps {
  loadEditor?: () => Promise<JsonEditorConstructor>;
}

export function ContentJsonEditor({
  loadEditor = loadEditorConstructor,
}: ContentJsonEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<JsonEditor | null>(null);
  const [status, setStatus] = useState("Loading…");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    let cancelled = false;
    let editor: JsonEditor | null = null;

    void (async () => {
      try {
        const Editor = await loadEditor();
        if (cancelled) {
          return;
        }
        editor = new Editor(container, {
          mode: "tree",
          modes: ["tree", "code"],
          history: true,
          name: "data.json",
        });
        editorRef.current = editor;
        const response = await fetch("/api/dev/content-json");
        if (!response.ok) {
          throw new Error(`Could not load the file (${response.status})`);
        }
        const data = (await response.json()) as unknown;
        if (cancelled) {
          return;
        }
        editor.set(data);
        setStatus("Fold a field with its triangle. Drag the grip to move it.");
      } catch (error: unknown) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Could not load the file.";
          setStatus(message);
        }
      }
    })();

    return () => {
      cancelled = true;
      editor?.destroy();
      editorRef.current = null;
    };
  }, [loadEditor]);

  async function save() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    setSaving(true);
    setStatus("Saving…");
    try {
      const response = await fetch("/api/dev/content-json", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editor.get()),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(body.error ?? "Save failed.");
        return;
      }
      setStatus("Saved the pretty source and refreshed the minified copy.");
    } catch {
      setStatus("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-white text-neutral-900">
      <header className="flex flex-wrap items-center gap-3 border-b border-neutral-200 px-4 py-2">
        <h1 className="text-base font-semibold">Content JSON</h1>
        <p className="text-sm text-neutral-600">public/content/json/data.json</p>
        <button
          type="button"
          className="rounded bg-neutral-900 px-3 py-1 text-sm text-white disabled:opacity-50"
          onClick={() => {
            void save();
          }}
          disabled={saving}
        >
          Save
        </button>
        <p className="min-w-0 flex-1 text-sm whitespace-pre-wrap text-neutral-700">{status}</p>
      </header>
      <div ref={containerRef} className="min-h-0 flex-1" />
    </div>
  );
}
