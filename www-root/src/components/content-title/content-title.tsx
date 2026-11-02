interface ContentTitleProps {
  readonly text: string;
}

export function ContentTitle({ text }: ContentTitleProps) {
  return (
    <h1
      data-component="ContentTitle"
      className="w-[calc(100%-5.5rem)] self-end text-center text-2xl font-semibold text-[#4F3E2D] md:w-auto md:self-center"
    >
      {text}
    </h1>
  );
}
