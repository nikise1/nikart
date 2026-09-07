import { act, fireEvent, render, screen } from "@testing-library/react";
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

function arrowVisual(name: "Previous image" | "Next image") {
  return screen.getByRole("button", { name }).querySelector("span");
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

  it("hides arrow gradients until that third is hovered", () => {
    renderSlideshow(3);
    const prevVisual = arrowVisual("Previous image");
    const nextVisual = arrowVisual("Next image");
    expect(prevVisual).toHaveClass("opacity-0");
    expect(nextVisual).toHaveClass("opacity-0");

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Previous image" }));
    expect(prevVisual).toHaveClass("opacity-100");
    expect(nextVisual).toHaveClass("opacity-0");

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Next image" }));
    expect(prevVisual).toHaveClass("opacity-0");
    expect(nextVisual).toHaveClass("opacity-100");
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

  it("pauses autoplay only when hovering the middle third", () => {
    renderSlideshow(3);
    const root = screen.getByRole("region", { name: "Slideshow" });
    const pause = screen.getByTestId("slideshow-pause");

    expect(root).toHaveAttribute("data-paused", "false");
    expect(pause).toHaveClass("opacity-0");
    expect(delayedCall).toHaveBeenCalled();

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Previous image" }));
    expect(root).toHaveAttribute("data-paused", "false");
    expect(pause).toHaveClass("opacity-0");

    delayedCall.mockClear();
    fireEvent.mouseEnter(screen.getByTestId("slideshow-pause-zone"));
    expect(root).toHaveAttribute("data-paused", "true");
    expect(root).toHaveAttribute("aria-label", "Slideshow paused");
    expect(pause).toHaveClass("opacity-100");
    expect(delayedCall).not.toHaveBeenCalled();

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Next image" }));
    expect(root).toHaveAttribute("data-paused", "false");
    expect(pause).toHaveClass("opacity-0");
  });

  it("toggles play and pause when the centre is clicked", () => {
    renderSlideshow(3);
    const root = screen.getByRole("region", { name: "Slideshow" });
    const pause = screen.getByTestId("slideshow-pause");
    const centre = screen.getByTestId("slideshow-pause-zone");

    fireEvent.click(centre);
    expect(root).toHaveAttribute("data-paused", "true");
    expect(pause).toHaveClass("opacity-100");

    fireEvent.mouseLeave(root);
    expect(root).toHaveAttribute("data-paused", "true");
    expect(screen.getByRole("button", { name: "Play slideshow" })).toBeInTheDocument();

    delayedCall.mockClear();
    fireEvent.click(centre);
    expect(root).toHaveAttribute("data-paused", "false");
    expect(pause).toHaveClass("opacity-0");
    expect(delayedCall).toHaveBeenCalled();
  });

  it("toggles off hover-pause when the centre is clicked", () => {
    renderSlideshow(3);
    const root = screen.getByRole("region", { name: "Slideshow" });
    const centre = screen.getByTestId("slideshow-pause-zone");

    fireEvent.mouseEnter(centre);
    expect(root).toHaveAttribute("data-paused", "true");

    fireEvent.click(centre);
    expect(root).toHaveAttribute("data-paused", "false");
  });

  it("fades the side arrow after click even while the pointer stays on that third", () => {
    vi.useFakeTimers();
    renderSlideshow(3);
    const prev = screen.getByRole("button", { name: "Previous image" });
    const prevVisual = arrowVisual("Previous image");

    fireEvent.mouseEnter(prev);
    expect(prevVisual).toHaveClass("opacity-100");

    fireEvent.click(prev);
    expect(prevVisual).toHaveClass("opacity-100");

    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(prevVisual).toHaveClass("opacity-0");
    vi.useRealTimers();
  });

  it("flashes the side arrow on tap then fades it out", () => {
    vi.useFakeTimers();
    renderSlideshow(3);
    const prev = screen.getByRole("button", { name: "Previous image" });
    const prevVisual = arrowVisual("Previous image");

    fireEvent.pointerDown(prev, { pointerType: "touch", pointerId: 1, button: 0, clientX: 10, clientY: 80 });
    fireEvent.pointerUp(prev, { pointerType: "touch", pointerId: 1, button: 0, clientX: 10, clientY: 80 });
    fireEvent.click(prev);

    expect(prevVisual).toHaveClass("opacity-100");
    expect(screen.getByRole("region")).toHaveAttribute("data-flash-side", "left");

    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(prevVisual).toHaveClass("opacity-0");
    expect(screen.getByRole("region")).toHaveAttribute("data-flash-side", "none");
    vi.useRealTimers();
  });

  it("advances when the progress label is clicked", () => {
    renderSlideshow(3);
    fireEvent.click(screen.getByRole("button", { name: "Advance slideshow" }));
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
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
    expect(screen.queryByRole("button", { name: "Advance slideshow" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("slideshow-pause")).not.toBeInTheDocument();
    expect(delayedCall).not.toHaveBeenCalled();
  });
});
