import create from "zustand";

const initialInteractiveState = {
  status: "idle",
  startNodeId: null,
  currentNodeId: null,
  history: [],
  timer: {
    running: false,
    remainingMs: 0,
    targetMs: 0,
  },
  sessionGraph: null,
  graphSignature: null,
  warning: null,
};

export const useRecipeStore = create((set, get) => ({
  interactive: initialInteractiveState,
  startSession: ({ startNodeId, graph, signature }) => {
    set(() => ({
      interactive: {
        ...initialInteractiveState,
        status: "awaiting-prep",
        startNodeId,
        currentNodeId: startNodeId,
        sessionGraph: graph,
        graphSignature: signature,
      },
    }));
  },
  stopSession: () => set({ interactive: initialInteractiveState }),
  restart: () => {
    const { interactive } = get();
    if (!interactive.startNodeId) {
      set({ interactive: initialInteractiveState });
      return;
    }
    set(({ interactive }) => ({
      interactive: {
        ...initialInteractiveState,
        status: "awaiting-prep",
        startNodeId: interactive.startNodeId,
        currentNodeId: interactive.startNodeId,
        sessionGraph: interactive.sessionGraph,
        graphSignature: interactive.graphSignature,
      },
    }));
  },
  advance: (nextNodeId, nextStatus = "awaiting-prep") => {
    set(({ interactive }) => {
      const history = interactive.currentNodeId
        ? [...interactive.history, interactive.currentNodeId]
        : [...interactive.history];
      return {
        interactive: {
          ...interactive,
          status: nextStatus,
          currentNodeId: nextNodeId,
          history,
          timer: { running: false, remainingMs: 0, targetMs: 0 },
        },
      };
    });
  },
  complete: () => {
    set(({ interactive }) => ({
      interactive: {
        ...interactive,
        status: "completed",
        currentNodeId: null,
        timer: { running: false, remainingMs: 0, targetMs: 0 },
      },
    }));
  },
  cancelTimer: () => {
    set(({ interactive }) => ({
      interactive: {
        ...interactive,
        status: "awaiting-prep",
        timer: { running: false, remainingMs: 0, targetMs: 0 },
      },
    }));
  },
  startTimer: (durationMs) => {
    set(({ interactive }) => ({
      interactive: {
        ...interactive,
        status: "running-timer",
        timer: { running: true, remainingMs: durationMs, targetMs: durationMs },
      },
    }));
  },
  tick: (deltaMs) => {
    set(({ interactive }) => {
      if (!interactive.timer.running) return { interactive };
      const remaining = Math.max(0, interactive.timer.remainingMs - deltaMs);
      return {
        interactive: {
          ...interactive,
          timer: {
            ...interactive.timer,
            remainingMs: remaining,
            running: remaining > 0,
          },
        },
      };
    });
  },
  setWarning: (message) => {
    set(({ interactive }) => ({
      interactive: {
        ...interactive,
        warning: message,
      },
    }));
  },
}));
