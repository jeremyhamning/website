type NameProps = {
  first: string;
  last: string;
};

// Renders the name with every letter in its own <span>.
// Each letter is marked `data-collide` so the bouncing ball treats it as a wall.
export default function Name({ first, last }: NameProps) {
  return (
    <h1 className="name" aria-label={`${first} ${last}`}>
      <Word text={first} />
      <Word text={last} />
    </h1>
  );
}

function Word({ text }: { text: string }) {
  return (
    <span className="name-word" aria-hidden="true">
      {[...text].map((char, i) => (
        <span key={i} className="name-letter" data-collide>
          {char}
        </span>
      ))}
    </span>
  );
}
