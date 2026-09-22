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
    });
  });

  it("opens directly from closing-canvas when a home open is pending", () => {
    useNavStore.setState({
      navPhase: "closing-canvas",
      pendingOpenAfterClose: true,
    });

    useNavStore.getState().onCanvasCloseComplete();

    const state = useNavStore.getState();
    expect(state.navPhase).toBe("opening");
    expect(state.navOpen).toBe(true);
    expect(state.pendingOpenAfterClose).toBe(false);
  });

  it("stays closed after canvas close when no home open is pending", () => {
    useNavStore.setState({ navPhase: "closing-canvas" });

    useNavStore.getState().onCanvasCloseComplete();

    expect(useNavStore.getState().navPhase).toBe("closed");
  });
});
