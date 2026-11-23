interface ContentDescriptionProps {
  readonly text: string;
}

export function ContentDescription({ text }: ContentDescriptionProps) {
  return (
    <p data-component="ContentDescription" className="mt-4 max-w-prose text-left text-[#3F3224]">
      {text}
    </p>
  );
}
