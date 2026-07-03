import { interpolate } from "remotion";
import { expo } from "./theme";

// Standard reveal: fade + rise, eased with ease-out-expo (impeccable: no bounce).
export function reveal(frame: number, delay = 0, dur = 16) {
  const opacity = interpolate(frame, [delay, delay + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: expo,
  });
  return { opacity, y: (1 - opacity) * 38 };
}

// 0→1 progress between two frames, eased.
export function ramp(frame: number, a: number, b: number) {
  return interpolate(frame, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: expo,
  });
}
