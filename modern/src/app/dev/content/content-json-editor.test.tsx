import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContentJsonEditor } from "./content-json-editor";

const setJson = vi.fn();
const getJson = vi.fn(() => ({ id: "main" }));

describe("ContentJsonEditor", () => {
  it("loads the file into the tree and saves it back", async () => {
    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.method === "PUT") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: "main", menu: [] }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    function FakeEditor(container: HTMLElement) {
      container.dataset.editor = "ready";
      return { set: setJson, get: getJson, destroy() {} };
    }

    render(<ContentJsonEditor loadEditor={() => Promise.resolve(FakeEditor)} />);

    expect(await screen.findByRole("button", { name: "Save" })).toBeInTheDocument();
    await waitFor(() => {
      expect(setJson).toHaveBeenCalledWith({ id: "main", menu: [] });
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/dev/content-json",
        expect.objectContaining({ method: "PUT" }),
      );
    });
    expect(await screen.findByText(/Saved the pretty source/)).toBeInTheDocument();
  });
});
