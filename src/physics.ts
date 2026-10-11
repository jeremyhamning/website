// Small 2D helpers for a circle bouncing off rectangles.

export type Vec = { x: number; y: number };
export type Rect = { left: number; top: number; right: number; bottom: number };

export type Hit = {
  normal: Vec; // unit vector pointing from the rect toward the ball
  depth: number; // how far the ball overlaps the rect
};

/** Returns where/how a circle overlaps a rect, or null if they don't touch. */
export function circleVsRect(center: Vec, radius: number, rect: Rect): Hit | null {
  // Closest point on the rect to the circle's center
  const closestX = Math.min(Math.max(center.x, rect.left), rect.right);
  const closestY = Math.min(Math.max(center.y, rect.top), rect.bottom);
  const dx = center.x - closestX;
  const dy = center.y - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq > radius * radius) return null;

  // Normal case: center is outside the rect, push straight away from the closest point
  if (distSq > 0) {
    const dist = Math.sqrt(distSq);
    return { normal: { x: dx / dist, y: dy / dist }, depth: radius - dist };
  }

  // Center is inside the rect (fast hit or tiny rect): exit through the nearest side
  const sides = [
    { normal: { x: -1, y: 0 }, dist: center.x - rect.left },
    { normal: { x: 1, y: 0 }, dist: rect.right - center.x },
    { normal: { x: 0, y: -1 }, dist: center.y - rect.top },
    { normal: { x: 0, y: 1 }, dist: rect.bottom - center.y },
  ];
  const nearest = sides.reduce((a, b) => (b.dist < a.dist ? b : a));
  return { normal: nearest.normal, depth: nearest.dist + radius };
}

export function dot(a: Vec, b: Vec): number {
  return a.x * b.x + a.y * b.y;
}

/** Mirror velocity across a surface: v' = v - 2(v·n)n */
export function reflect(v: Vec, n: Vec): Vec {
  const d = dot(v, n);
  return { x: v.x - 2 * d * n.x, y: v.y - 2 * d * n.y };
}

/**
 * Rescale to a constant speed (pong never speeds up or slows down) and keep
 * a minimum slope on both axes so the ball can't get stuck going purely
 * horizontal or vertical.
 */
export function pongVelocity(v: Vec, speed: number, minSlope = 0.3): Vec {
  const len = Math.hypot(v.x, v.y) || 1;
  let x = v.x / len;
  let y = v.y / len;
  if (Math.abs(x) < minSlope) x = (Math.sign(x) || randomSign()) * minSlope;
  if (Math.abs(y) < minSlope) y = (Math.sign(y) || -1) * minSlope;
  const len2 = Math.hypot(x, y);
  return { x: (x / len2) * speed, y: (y / len2) * speed };
}

export function randomSign(): number {
  return Math.random() < 0.5 ? -1 : 1;
}
