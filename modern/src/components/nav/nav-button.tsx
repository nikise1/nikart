"use client";

interface NavButtonProps {
  readonly onNavigateHome: () => void;
}

/** Always mounted — visibility/position driven by useNavAnimator (legacy closeCanvas). */
export function NavButton({ onNavigateHome }: NavButtonProps) {
  return (
    <button
      onClick={onNavigateHome}
      data-component="NavButton"
      className="absolute top-[-60px] left-[-30px] z-10 hidden h-[60px] w-[90px] cursor-pointer border-none bg-[url('/content/img/curl-sprite.png')] bg-no-repeat indent-[-2000px] hover:bg-[position:0_0]"
      style={{ backgroundPosition: "0 -60px" }}
      aria-label="Back to main menu"
    >
      Menu
    </button>
  );
}
