interface AdvancePetioleProps {
  current: number;
  total: number;
  onAdvance: () => void;
}

export function AdvancePetiole({ current, total, onAdvance }: AdvancePetioleProps) {
  return (
    <button
      type="button"
      onClick={onAdvance}
      aria-label="Advance slideshow"
      data-advance-variant="petiole"
      className="group relative z-10 mt-[-6px] flex h-[76px] w-[168px] cursor-pointer items-end justify-center text-[#4F3E2D]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 168 76"
        className="pointer-events-none absolute inset-0 overflow-visible"
      >
        <path
          d="M84 2 C78 6 76 8 78 12 C70 22 92 28 84 40"
          fill="none"
          stroke="#4F3E2D"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <ellipse cx="84" cy="4" rx="9" ry="5" className="fill-[#c5d089] transition-colors duration-300 group-hover:fill-[#94B864]" stroke="#4F3E2D" strokeWidth="1.6" />
        <path
          d="M46 48 C48 32 120 32 122 50 C124 64 108 70 84 70 C60 70 44 64 46 48 Z"
          className="fill-[#c5d089] transition-colors duration-300 group-hover:fill-[#94B864]"
          stroke="#4F3E2D"
          strokeWidth="1.8"
        />
        <path
          d="M84 40 C84 40 86 56 92 66"
          fill="none"
          stroke="#4F3E2D"
          strokeWidth="1"
          strokeOpacity="0.45"
        />
      </svg>
      <span className="relative z-10 mb-[14px] text-sm tabular-nums">{current} / {total}</span>
    </button>
  );
}
