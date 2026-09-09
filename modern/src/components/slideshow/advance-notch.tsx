interface AdvanceNotchProps {
  current: number;
  total: number;
  onAdvance: () => void;
}

export function AdvanceNotch({ current, total, onAdvance }: AdvanceNotchProps) {
  return (
    <button
      type="button"
      onClick={onAdvance}
      aria-label="Advance slideshow"
      data-advance-variant="notch"
      className="group relative z-10 mt-[-18px] flex h-[64px] w-full max-w-[240px] cursor-pointer items-center justify-center pt-3 text-[#4F3E2D]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 240 64"
        className="pointer-events-none absolute inset-0 overflow-visible"
        preserveAspectRatio="xMidYMin meet"
      >
        <path
          d="M 48 2
             C 78 2, 92 6, 120 52
             C 148 6, 162 2, 192 2
             L 168 2
             C 150 2, 138 4, 120 4
             C 102 4, 90 2, 72 2
             Z"
          className="fill-[#c5d089] transition-colors duration-300 group-hover:fill-[#94B864]"
          stroke="#4F3E2D"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M120 4 C 122 20, 128 36, 120 52"
          fill="none"
          stroke="#4F3E2D"
          strokeWidth="1"
          strokeOpacity="0.35"
        />
      </svg>
      <span className="relative z-10 mt-3 text-sm tabular-nums">{current} / {total}</span>
    </button>
  );
}
