interface ContentDescriptionProps {
  readonly text: string;
}

const hyphenatedWord = /[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+/gu;

export function ContentDescription({ text }: ContentDescriptionProps) {
  const pieces: React.ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(hyphenatedWord)) {
    const index = match.index;
    if (index > last) {
      pieces.push(text.slice(last, index));
    }
    pieces.push(
      <span key={index} className="whitespace-nowrap">
        {match[0]}
      </span>,
    );
    last = index + match[0].length;
  }
  if (last < text.length) {
    pieces.push(text.slice(last));
  }

  return (
    <p data-component="ContentDescription" className="mt-4 max-w-prose text-left text-[#4F3E2D]">
      {pieces}
    </p>
  );
}
