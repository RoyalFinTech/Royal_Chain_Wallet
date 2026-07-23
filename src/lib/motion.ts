/**
 * Centralized motion guidelines for Royal Chain Wallet.
 *
 * Every animation, page transition, drawer, and micro-interaction
 * should pull from these tokens so timing/easing stays consistent.
 *
 * Backend/UX note: durations are kept short (<= 350ms) to preserve the
 * "instant" fintech feel while giving the eye a smooth handoff.
 */

export const motion = {
  duration: {
    instant: 120,
    fast: 180,
    base: 240,
    slow: 320,
    xslow: 480,
  },
  easing: {
    /** Standard ease — most UI transitions. */
    standard: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    /** Entrance — decelerate to rest. */
    enter: "cubic-bezier(0, 0, 0.2, 1)",
    /** Exit — accelerate off screen. */
    exit: "cubic-bezier(0.4, 0, 1, 1)",
    /** Sharp for tactile / press feedback. */
    sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
  },
} as const;

/** Reusable className presets — keep the vocabulary small. */
export const motionClass = {
  /** Full page mount animation. */
  pageEnter: "motion-page-enter",
  /** Drawer / bottom sheet mount. */
  sheetEnter: "motion-sheet-enter",
  /** Backdrop fade for modals & sheets. */
  backdrop: "motion-backdrop-enter",
  /** Tactile press (scale-down on active). */
  press: "press",
  /** List item stagger reveal. Add inline animationDelay per index. */
  listItem: "animate-fade-in",
} as const;

/** Helper for staggered list reveals. */
export function staggerDelay(index: number, stepMs = 60) {
  return {
    animationDelay: `${index * stepMs}ms`,
    animationFillMode: "backwards" as const,
  };
}
