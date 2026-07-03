import type { Position } from "../types/geo";

export function metersOffset(
  from: Position,
  to: Position
): { dx: number; dy: number } {
  const dx = (to.lng - from.lng) * 111320 * Math.cos((from.lat * Math.PI) / 180);
  const dy = (to.lat - from.lat) * 110540;
  return { dx, dy };
}

export function distanceMeters(from: Position, to: Position): number {
  const { dx, dy } = metersOffset(from, to);
  return Math.sqrt(dx * dx + dy * dy);
}

/** Simple moving average smoothing for GPS positions */
export function smoothPosition(prev: Position | null, next: Position, alpha = 0.3): Position {
  if (!prev) return next;
  return {
    lat: prev.lat * (1 - alpha) + next.lat * alpha,
    lng: prev.lng * (1 - alpha) + next.lng * alpha,
  };
}
