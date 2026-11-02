interface ContentDescriptionProps {
  readonly text: string;
}

export function ContentDescription({ text }: ContentDescriptionProps) {
  return (
    <p data-component="ContentDescription" className="mt-4 max-w-prose text-center text-[#4F3E2D]">
      {text}
    </p>
  );
}
