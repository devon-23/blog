interface Props {
  aboutHref: string;
}

export default function AboutApp({ aboutHref }: Props) {
  return (
    <div className="app-about">
      <p>
        Hi, I'm Devon. This is my desktop — a running log of what I'm reading, cooking,
        listening to, thinking about, and planning next.
      </p>
      <p>Every article, think piece, and recommendation stays up here permanently — nothing ever gets deleted, only added to.</p>
      <a href={aboutHref}>Read the full about page &rarr;</a>
    </div>
  );
}
