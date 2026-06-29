import confetti from "canvas-confetti";

const EMBER = ["#f97316", "#fb923c", "#fdba74", "#fff7ed"];

/** A small celebratory burst (e.g. a single habit completed). */
export function popConfetti() {
  confetti({
    particleCount: 40,
    spread: 55,
    startVelocity: 35,
    origin: { y: 0.7 },
    colors: EMBER,
    scalar: 0.9,
  });
}

/** A bigger, two-sided burst for perfect days / badge unlocks. */
export function bigConfetti() {
  const end = Date.now() + 600;
  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors: EMBER,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors: EMBER,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/** Light haptic feedback on supporting devices (mobile). */
export function haptic(ms = 12) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* ignore */
    }
  }
}
