import { useEffect, useRef } from "react";
import Sun from "./Sun";
import { circleVsRect, dot, pongVelocity, randomSign, reflect, type Vec } from "./physics";

const GRAVITY = 2400; // px/s², only used for the initial drop
const SPEED = 520; // px/s, constant pong speed after the first bounce
const MAX_DT = 1 / 30; // cap the timestep so a slow frame can't tunnel through letters
const HIT_FLASH_MS = 180;

type Props = {
  id: number;
  start: DOMRect; // where the icon was on screen when clicked
  onStop: (id: number) => void; // must be stable (useCallback) or the ball restarts
};

// The sun icon, detached from the page and moving under its own physics.
// Position is written straight to the DOM each frame (no React re-renders).
export default function BouncingBall({ id, start, onStop }: Props) {
  const ballRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const ball = ballRef.current!;
    const radius = start.width / 2;
    let pos: Vec = { x: start.left + radius, y: start.top + radius };
    let vel: Vec = { x: 0, y: 0 };
    let falling = true; // gravity until the first bounce, then pong rules
    let last = performance.now();
    let frame = 0;

    // Anything marked data-collide (name letters, words) acts as a wall
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-collide]"));

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, MAX_DT);
      last = now;

      if (falling) vel.y += GRAVITY * dt;
      pos = { x: pos.x + vel.x * dt, y: pos.y + vel.y * dt };

      let bounced = false;

      // Screen edges (clientWidth/Height exclude scrollbars)
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      if (pos.x - radius < 0) { pos.x = radius; vel.x = Math.abs(vel.x); bounced = true; }
      if (pos.x + radius > width) { pos.x = width - radius; vel.x = -Math.abs(vel.x); bounced = true; }
      if (pos.y - radius < 0) { pos.y = radius; vel.y = Math.abs(vel.y); bounced = true; }
      if (pos.y + radius > height) { pos.y = height - radius; vel.y = -Math.abs(vel.y); bounced = true; }

      // Words and letters. Rects are re-read every frame so resizing/scrolling just works.
      for (const el of targets) {
        const hit = circleVsRect(pos, radius, el.getBoundingClientRect());
        if (!hit) continue;
        // Push the ball out of the rect so it doesn't stick
        pos = { x: pos.x + hit.normal.x * hit.depth, y: pos.y + hit.normal.y * hit.depth };
        // Only reflect if moving into the surface (avoids double-bouncing on letter seams)
        if (dot(vel, hit.normal) < 0) {
          vel = reflect(vel, hit.normal);
          bounced = true;
          flash(el);
        }
      }

      if (bounced) {
        if (falling) {
          // First bounce: kick off sideways at ~45° so it doesn't just bounce in place
          falling = false;
          vel = { x: randomSign() * Math.abs(vel.y), y: vel.y };
        }
        vel = pongVelocity(vel, SPEED);
      }

      ball.style.transform = `translate(${pos.x - radius}px, ${pos.y - radius}px)`;
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [start]);

  return (
    <button
      ref={ballRef}
      className="ball"
      style={{
        width: start.width,
        height: start.height,
        // Start where the icon was, so there's no flash at the top-left before the first frame
        transform: `translate(${start.left}px, ${start.top}px)`,
      }}
      onClick={() => onStop(id)}
      aria-label="Remove this sun"
    >
      <Sun />
    </button>
  );
}

// Briefly tint whatever the ball hit
function flash(el: HTMLElement) {
  el.classList.add("hit");
  window.setTimeout(() => el.classList.remove("hit"), HIT_FLASH_MS);
}
