import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Slideshow } from "./slideshow";

const delayedCall = vi.hoisted(() => vi.fn(() => ({ kill: vi.fn() })));
const gsapTo = vi.hoisted(() => vi.fn());

vi.mock("@/lib/gsap", () => ({
  gsap: {
    to: gsapTo,
    delayedCall,
  },
}));

function renderSlideshow(imgCount = 3) {
  return render(<Slideshow itemId="onedayinmay" imgCount={imgCount} alt="One Day in May" />);
}

describe("Slideshow", () => {
  beforeEach(() => {
    delayedCall.mockClear();
    gsapTo.mockClear();
  });

  it("renders stacked slide images", () => {
    renderSlideshow(3);
    const images = screen.getAllByRole("img", { hidden: true });
    expect(images).toHaveLength(3);
    expect(images[0]).toHaveAttribute("src", "/content/img/onedayinmay_1.jpg");
    expect(images[2]).toHaveAttribute("src", "/content/img/onedayinmay_3.jpg");
  });

  it("advances and wraps with the next and previous arrows", () => {
    renderSlideshow(3);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next image" }));
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(gsapTo).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Previous image" }));
    expect(screen.getByText("1 / 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Previous image" }));
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
  });

  it("switches slides with a horizontal swipe", () => {
    renderSlideshow(3);
    const root = screen.getByRole("region", { name: "Slideshow" });

    fireEvent.pointerDown(root, { clientX: 200, clientY: 80, pointerId: 1, button: 0, pointerType: "touch" });
    fireEvent.pointerUp(root, { clientX: 80, clientY: 80, pointerId: 1, button: 0, pointerType: "touch" });
    expect(screen.getByText("2 / 3")).toBeInTheDocument();

    fireEvent.pointerDown(root, { clientX: 80, clientY: 80, pointerId: 2, button: 0, pointerType: "touch" });
    fireEvent.pointerUp(root, { clientX: 200, clientY: 80, pointerId: 2, button: 0, pointerType: "touch" });
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("ignores a short drag that is not a swipe", () => {
    renderSlideshow(3);
    const root = screen.getByRole("region", { name: "Slideshow" });

    fireEvent.pointerDown(root, { clientX: 120, clientY: 80, pointerId: 1, button: 0, pointerType: "touch" });
    fireEvent.pointerUp(root, { clientX: 130, clientY: 80, pointerId: 1, button: 0, pointerType: "touch" });
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("pauses autoplay on mouseover and shows the pause graphic", () => {
    renderSlideshow(3);
    const root = screen.getByRole("region", { name: "Slideshow" });
    const pause = screen.getByTestId("slideshow-pause");

    expect(root).toHaveAttribute("data-paused", "false");
    expect(pause).toHaveClass("opacity-0");
    expect(delayedCall).toHaveBeenCalled();

    delayedCall.mockClear();
    fireEvent.mouseEnter(root);

    expect(root).toHaveAttribute("data-paused", "true");
    expect(root).toHaveAttribute("aria-label", "Slideshow paused");
    expect(pause).toHaveClass("opacity-100");
    expect(delayedCall).not.toHaveBeenCalled();

    fireEvent.mouseLeave(root);
    expect(root).toHaveAttribute("data-paused", "false");
    expect(pause).toHaveClass("opacity-0");
    expect(delayedCall).toHaveBeenCalled();
  });

  it("still lets arrow clicks work after a swipe", () => {
    renderSlideshow(3);
    const root = screen.getByRole("region", { name: "Slideshow" });

    fireEvent.pointerDown(root, { clientX: 200, clientY: 80, pointerId: 1, button: 0, pointerType: "touch" });
    fireEvent.pointerUp(root, { clientX: 80, clientY: 80, pointerId: 1, button: 0, pointerType: "touch" });
    expect(screen.getByText("2 / 3")).toBeInTheDocument();

    const prev = screen.getByRole("button", { name: "Previous image" });
    fireEvent.pointerDown(prev, { clientX: 10, clientY: 80, pointerId: 3, button: 0 });
    fireEvent.pointerUp(prev, { clientX: 10, clientY: 80, pointerId: 3, button: 0 });
    fireEvent.click(prev);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("does not show controls for a single image", () => {
    renderSlideshow(1);
    expect(screen.queryByRole("button", { name: "Next image" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("slideshow-pause")).not.toBeInTheDocument();
    expect(delayedCall).not.toHaveBeenCalled();
  });
});
