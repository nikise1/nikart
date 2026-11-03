import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContentDescription } from "./content-description";

describe("ContentDescription", () => {
  it("renders the shared description", () => {
    render(<ContentDescription text="A short film." />);

    const description = screen.getByText("A short film.");
    expect(description).toHaveAttribute("data-component", "ContentDescription");
    expect(description.tagName).toBe("P");
    expect(description).toHaveClass("mt-4", "max-w-prose", "text-left", "text-[#4F3E2D]");
  });

  it("renders a hyphenated word as text", () => {
    const text = "An E\u2011learning application.";
    render(<ContentDescription text={text} />);

    const description = screen.getByText(text);
    expect(description.tagName).toBe("P");
    expect(description.querySelector("span")).toBeNull();
    expect(description).toHaveTextContent(text);
  });
});
