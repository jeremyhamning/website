import { useCallback, useEffect, useRef, useState } from "react";
import BouncingBall from "./BouncingBall";
import Name from "./Name";
import Sun from "./Sun";
import Words from "./Words";

type Ball = { id: number; start: DOMRect };

export default function App() {
  // Every sun currently bouncing around the page
  const [balls, setBalls] = useState<Ball[]>([]);
  // The sun jiggles to invite a click, until the first time someone clicks it
  const [hasLaunched, setHasLaunched] = useState(false);
  const nextId = useRef(0);

  // Stable so BouncingBall's animation effect doesn't restart on re-render
  const removeBall = useCallback((id: number) => {
    setBalls((current) => current.filter((b) => b.id !== id));
  }, []);

  // Escape clears every bouncing sun
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setBalls([]);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="page">
      <button
        className={hasLaunched ? "sun-button" : "sun-button jiggle"}
        onClick={(e) => {
          // Use the untransformed size; the hover tilt would inflate the bounding box
          const el = e.currentTarget;
          const rect = el.getBoundingClientRect();
          const start = new DOMRect(rect.x, rect.y, el.offsetWidth, el.offsetHeight);
          const id = nextId.current++;
          setHasLaunched(true);
          setBalls((current) => [...current, { id, start }]);
          // A fresh sun "appears" in the slot the launched one just left
          el.animate(
            [
              { opacity: 0, transform: "scale(0.5)" },
              { opacity: 1, transform: "scale(1)" },
            ],
            { duration: 350, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
          );
        }}
        aria-label="Drop a sun"
      >
        <Sun />
      </button>
      <Name first="Jeremy" last="Hamning" />
      <p className="lede">
        <Words text="Staff software engineer at" />{" "}
        <a href="https://www.samsung.com/us/smartthings/" target="_blank" rel="noopener noreferrer">
          <Words text="SmartThings" />
        </a>
        <Words text=". Learning to repair and maintain a house from 1922." />
      </p>
      {balls.map((ball) => (
        <BouncingBall key={ball.id} id={ball.id} start={ball.start} onStop={removeBall} />
      ))}
    </main>
  );
}
