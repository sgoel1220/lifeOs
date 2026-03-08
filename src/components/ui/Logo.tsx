interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export default function Logo({ size = 32, showWordmark = false, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="LifeOS"
      >
        {/* Background circle */}
        <circle cx="16" cy="16" r="16" fill="#DFF0D8" />

        {/* Stem */}
        <path
          d="M16 26 L16 15"
          stroke="#4A7A58"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Left leaf — curves left from mid-stem */}
        <path
          d="M16 21 C13 19 9 17 8 12 C11.5 11 15 14 16 20 Z"
          fill="#8BAF7C"
        />

        {/* Right leaf — curves right near top */}
        <path
          d="M16 17 C19 15 23 12 24 7 C20.5 6.5 17 10 16 15 Z"
          fill="#5E9467"
        />

        {/* Bud at tip */}
        <ellipse cx="16" cy="13" rx="2.2" ry="2.8" fill="#8BAF7C" opacity="0.9" />
      </svg>

      {showWordmark && (
        <span className="font-serif font-bold text-[#2C2C2E] tracking-tight" style={{ fontSize: size * 0.56 }}>
          LifeOS
        </span>
      )}
    </div>
  );
}
