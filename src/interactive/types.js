export const InteractiveStatus = {
  IDLE: "idle",
  AWAITING_PREP: "awaiting-prep",
  RUNNING_TIMER: "running-timer",
  COMPLETED: "completed",
};

export const InteractiveEvent = {
  START: "start",
  ADVANCE: "advance",
  TIMER_START: "timer-start",
  TIMER_CANCEL: "timer-cancel",
  TIMER_FINISH: "timer-finish",
  COMPLETE: "complete",
  RESTART: "restart",
  STOP: "stop",
};
