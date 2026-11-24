import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContentTitle } from "./content-title";

describe("ContentTitle", () => {
  it("renders the shared heading", () => {
    render(<ContentTitle text="Spark" />);

    const heading = screen.getByRole("heading", { name: "Spark" });
    expect(heading).toHaveAttribute("data-component", "ContentTitle");
    expect(heading).toHaveClass(
      "w-[calc(100%-5.5rem)]",
      "self-end",
      "text-center",
      "text-2xl",
      "font-semibold",
      "text-[#3F3224]",
      "md:w-auto",
      "md:self-center",
    );
  });
});
