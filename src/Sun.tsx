// Line-art sun: a thin circle whose lower half is crossed by
// horizontal lines that spread apart toward the horizon (a quiet 70s nod).
export default function Sun() {
  // y positions of the horizontal lines, spaced wider as they go down
  const lines = [58, 66, 75, 85, 96];

  return (
    <svg className="sun" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        {/* Keeps the lines inside the circle */}
        <clipPath id="sunClip">
          <circle cx="50" cy="50" r="46" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="46" />
      <g clipPath="url(#sunClip)">
        {lines.map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} />
        ))}
      </g>
    </svg>
  );
}
