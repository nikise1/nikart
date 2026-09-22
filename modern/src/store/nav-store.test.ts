import { beforeEach, describe, expect, it } from "vitest";
import { useNavStore } from "./nav-store";

describe("useNavStore", () => {
  beforeEach(() => {
    useNavStore.setState({
      navOpen: false,
      navPhase: "closed",
      navReady: false,
      pendingRoute: null,
      startupPendingOpen: false,
      pendingOpenAfterClose: false,
      buttonParked: false,
      homeNavAfterButton: false,
    });
  });

  it("reverses the parked back button before opening from a content page", () => {
    useNavStore.setState({ navPhase: "closed", buttonParked: true });

    useNavStore.getState().openHomeMenu();

    expect(useNavStore.getState().navPhase).toBe("hiding-button");
    expect(useNavStore.getState().navOpen).toBe(false);
    expect(useNavStore.getState().homeNavAfterButton).toBe(true);
  });

  it("opens the canvas after the back button reverse-exit completes", () => {
    useNavStore.setState({ navPhase: "hiding-button", buttonParked: true });

    useNavStore.getState().onButtonHideComplete();

    const state = useNavStore.getState();
    expect(state.navPhase).toBe("opening");
    expect(state.navOpen).toBe(true);
  });

  it("does not interrupt a button reverse-exit or an in-flight open", () => {
    useNavStore.setState({ navPhase: "hiding-button", buttonParked: true });
    useNavStore.getState().openHomeMenu();
    expect(useNavStore.getState().navPhase).toBe("hiding-button");

    useNavStore.setState({ navPhase: "opening", navOpen: true, buttonParked: false });
    useNavStore.getState().openHomeMenu();
    expect(useNavStore.getState().navPhase).toBe("opening");
    expect(useNavStore.getState().navOpen).toBe(true);
  });

  it("opens directly from closing-canvas when a home open is pending and the button is hidden", () => {
    useNavStore.setState({
      navPhase: "closing-canvas",
      pendingOpenAfterClose: true,
      buttonParked: false,
    });

    useNavStore.getState().onCanvasCloseComplete();

    const state = useNavStore.getState();
    expect(state.navPhase).toBe("opening");
    expect(state.navOpen).toBe(true);
    expect(state.pendingOpenAfterClose).toBe(false);
  });

  it("hides a parked button before opening when close-then-open still has the curl on screen", () => {
    useNavStore.setState({
      navPhase: "closing-canvas",
      pendingOpenAfterClose: true,
      buttonParked: true,
    });

    useNavStore.getState().onCanvasCloseComplete();

    const state = useNavStore.getState();
    expect(state.navPhase).toBe("hiding-button");
    expect(state.navOpen).toBe(false);
  });

  it("stays closed after canvas close when no home open is pending", () => {
    useNavStore.setState({ navPhase: "closing-canvas" });

    useNavStore.getState().onCanvasCloseComplete();

    expect(useNavStore.getState().navPhase).toBe("closed");
  });
});
