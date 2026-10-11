// Splits plain text into one <span> per word so the ball can bounce off each word.
export default function Words({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span key={i}>
          <span data-collide>{word}</span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </>
  );
}
