import { useCallback, useState } from "react";
import BouncingBall from "./BouncingBall";
import Name from "./Name";
import Sun from "./Sun";
import Words from "./Words";

export default function App() {
  // Where the sun was when clicked; null means it's resting in the page
  const [launchedFrom, setLaunchedFrom] = useState<DOMRect | null>(null);
  const putBack = useCallback(() => setLaunchedFrom(null), []);

  return (
    <main className="page">
      <button
        className="sun-button"
        // Hidden (not removed) while bouncing so the layout doesn't shift
        style={{ visibility: launchedFrom ? "hidden" : "visible" }}
        onClick={(e) => {
          // Use the untransformed size; the hover tilt would inflate the bounding box
          const el = e.currentTarget;
          const rect = el.getBoundingClientRect();
          setLaunchedFrom(new DOMRect(rect.x, rect.y, el.offsetWidth, el.offsetHeight));
        }}
        aria-label="Drop the sun"
      >
        <Sun />
      </button>
      <Name first="Jeremy" last="Hamning" />
      <p className="lede">
        <Words text="Software engineer. Placeholder line — edit me in src/App.tsx." />
      </p>
      {launchedFrom && <BouncingBall start={launchedFrom} onStop={putBack} />}
    </main>
  );
}
