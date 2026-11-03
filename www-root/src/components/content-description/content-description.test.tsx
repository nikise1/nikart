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

  it("keeps a hyphenated word together", () => {
    render(<ContentDescription text="An E-learning application." />);

    const word = screen.getByText("E-learning");
    expect(word.tagName).toBe("SPAN");
    expect(word).toHaveClass("whitespace-nowrap");
    expect(word.parentElement).toHaveTextContent("An E-learning application.");
  });
});
