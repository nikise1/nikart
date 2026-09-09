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
      className="group relative z-10 mt-[-14px] flex h-[58px] w-full max-w-[220px] cursor-pointer items-end justify-center text-[#4F3E2D]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 220 58"
        className="pointer-events-none absolute inset-0 overflow-visible"
        preserveAspectRatio="xMidYMin meet"
      >
        <path
          d="M 36 10
             C 48 10, 58 8, 70 10
             C 88 12, 96 28, 110 46
             C 118 56, 102 56, 110 46
             C 124 28, 132 12, 150 10
             C 162 8, 172 10, 184 10
             L 184 10"
          fill="none"
          stroke="#4F3E2D"
          strokeWidth="1.4"
          strokeOpacity="0.35"
        />
        <path
          d="M 58 8
             C 78 8, 92 22, 110 50
             C 128 22, 142 8, 162 8
             C 148 8, 138 6, 110 6
             C 82 6, 72 8, 58 8 Z"
          className="fill-[#c5d089] transition-colors duration-300 group-hover:fill-[#94B864]"
          stroke="#4F3E2D"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M110 8 C112 22 118 36 110 50"
          fill="none"
          stroke="#4F3E2D"
          strokeWidth="1"
          strokeOpacity="0.4"
        />
      </svg>
      <span className="relative z-10 mb-[10px] text-sm tabular-nums">{current} / {total}</span>
    </button>
  );
}
