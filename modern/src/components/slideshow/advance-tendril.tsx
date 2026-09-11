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
      className="group absolute -right-2 top-full z-10 mt-[-10px] flex h-[100px] w-[200px] cursor-pointer items-end justify-end text-[#4F3E2D]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 200 100"
        className="pointer-events-none absolute inset-0 overflow-visible"
      >
        <path
          d="M168 8
             C 186 18, 188 36, 172 48
             C 154 62, 128 54, 118 68
             C 108 80, 128 94, 150 88"
          fill="none"
          stroke="#4F3E2D"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <ellipse cx="168" cy="6" rx="7" ry="5" className="fill-[#c5d089] transition-colors duration-300 group-hover:fill-[#94B864]" stroke="#4F3E2D" strokeWidth="1.5" />
        <path
          d="M170 32 C 188 22, 192 44, 174 46 C 160 40, 162 28, 170 32 Z"
          className="fill-[#c5d089] transition-colors duration-300 group-hover:fill-[#94B864]"
          stroke="#4F3E2D"
          strokeWidth="1.4"
        />
        <ellipse
          cx="148"
          cy="82"
          rx="42"
          ry="16"
          className="fill-[#c5d089] transition-colors duration-300 group-hover:fill-[#94B864]"
          stroke="#4F3E2D"
          strokeWidth="1.7"
        />
        <path
          d="M148 68 C 150 78, 158 86, 164 90"
          fill="none"
          stroke="#4F3E2D"
          strokeWidth="1"
          strokeOpacity="0.4"
        />
      </svg>
      <span className="relative z-10 mb-[12px] mr-[22px] text-sm tabular-nums">{current} / {total}</span>
    </button>
  );
}
