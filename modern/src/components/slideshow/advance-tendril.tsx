interface AdvanceTendrilProps {
  current: number;
  total: number;
  onAdvance: () => void;
}

export function AdvanceTendril({ current, total, onAdvance }: AdvanceTendrilProps) {
  return (
    <button
      type="button"
      onClick={onAdvance}
      aria-label="Advance slideshow"
      data-advance-variant="tendril"
      className="group absolute right-[-8px] top-full z-10 flex h-[96px] w-[188px] cursor-pointer items-end justify-end text-[#4F3E2D]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 188 96"
        className="pointer-events-none absolute inset-0 overflow-visible"
      >
        <path
          d="M150 2
             C 166 10, 180 22, 170 40
             C 158 58, 122 50, 108 64
             C 96 76, 118 90, 138 84"
          fill="none"
          stroke="#4F3E2D"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M150 2 C 148 8, 154 10, 152 4"
          fill="none"
          stroke="#4F3E2D"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M158 28 C 176 18, 182 40, 164 42 C 150 36, 152 24, 158 28 Z"
          className="fill-[#c5d089] transition-colors duration-300 group-hover:fill-[#94B864]"
          stroke="#4F3E2D"
          strokeWidth="1.4"
        />
        <ellipse
          cx="138"
          cy="78"
          rx="40"
          ry="16"
          className="fill-[#c5d089] transition-colors duration-300 group-hover:fill-[#94B864]"
          stroke="#4F3E2D"
          strokeWidth="1.7"
        />
        <path
          d="M138 64 C 140 74, 148 82, 154 86"
          fill="none"
          stroke="#4F3E2D"
          strokeWidth="1"
          strokeOpacity="0.4"
        />
      </svg>
      <span className="relative z-10 mb-[10px] mr-[18px] text-sm tabular-nums">{current} / {total}</span>
    </button>
  );
}
