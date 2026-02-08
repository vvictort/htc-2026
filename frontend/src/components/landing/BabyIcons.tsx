// Playful hand-drawn style baby icons for the landing page
// All icons use a sketchy, soft aesthetic

export const BabyFootprints = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 80 45" className={className} fill="currentColor">
    {/* Left foot */}
    <ellipse cx="20" cy="28" rx="10" ry="14" />
    <circle cx="10" cy="12" r="4.5" />
    <circle cx="17" cy="8" r="4" />
    <circle cx="24" cy="7" r="3.5" />
    <circle cx="30" cy="10" r="3" />
    {/* Right foot */}
    <ellipse cx="55" cy="28" rx="10" ry="14" />
    <circle cx="48" cy="10" r="3" />
    <circle cx="54" cy="7" r="3.5" />
    <circle cx="61" cy="8" r="4" />
    <circle cx="68" cy="12" r="4.5" />
  </svg>
);

export const BabyCloud = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 60" className={className} fill="currentColor">
    <ellipse cx="30" cy="38" rx="22" ry="18" />
    <ellipse cx="55" cy="35" rx="26" ry="22" />
    <ellipse cx="78" cy="40" rx="18" ry="15" />
    <ellipse cx="42" cy="25" rx="15" ry="12" />
    <ellipse cx="65" cy="22" rx="12" ry="10" />
  </svg>
);

export const BabyStar = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 50 50" className={className} fill="currentColor">
    <path d="M25 3 L29 18 Q30 20 32 20 L47 20 L35 30 Q33 32 34 34 L39 48 L26 38 Q24 37 22 38 L9 48 L14 34 Q15 32 13 30 L1 20 L16 20 Q18 20 19 18 Z" />
  </svg>
);

export const BabyHeart = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 50 48" className={className} fill="currentColor">
    <path d="M25 44 C8 28 2 18 10 10 C16 4 24 10 25 12 C26 10 34 4 40 10 C48 18 42 28 25 44 Z" />
  </svg>
);

export const BabyMoon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 50 50" className={className} fill="currentColor">
    <path d="M38 8 C24 8 12 20 12 36 C12 40 14 44 16 46 C10 40 6 30 10 20 C16 6 32 2 44 12 C42 10 40 8 38 8 Z" />
    {/* Little stars */}
    <circle cx="30" cy="14" r="1.5" />
    <circle cx="38" cy="20" r="1" />
  </svg>
);

export const BabyBottle = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 40 70"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round">
    <rect x="10" y="22" width="20" height="40" rx="6" />
    <path d="M13 22 L13 14 Q20 8 27 14 L27 22" />
    <line x1="10" y1="34" x2="30" y2="34" />
    <line x1="10" y1="46" x2="30" y2="46" />
    <ellipse cx="20" cy="6" rx="4" ry="2" fill="currentColor" />
  </svg>
);

export const BabyRattle = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 50 70"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round">
    <circle cx="25" cy="20" r="16" />
    <circle cx="20" cy="16" r="3.5" fill="currentColor" />
    <circle cx="30" cy="16" r="3.5" fill="currentColor" />
    <circle cx="25" cy="24" r="2.5" fill="currentColor" />
    <path d="M25 36 L25 58" strokeWidth="5" />
    <ellipse cx="25" cy="62" rx="8" ry="4" fill="currentColor" />
  </svg>
);

export const BabyPacifier = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 60 45"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round">
    <ellipse cx="25" cy="25" rx="16" ry="14" />
    <circle cx="25" cy="25" r="7" fill="currentColor" />
    <path d="M41 25 Q52 25 54 18 Q56 10 48 14" />
  </svg>
);

export const BabyDuck = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 60 50" className={className} fill="currentColor">
    {/* Body */}
    <ellipse cx="35" cy="34" rx="20" ry="14" />
    {/* Head */}
    <circle cx="18" cy="22" r="12" />
    {/* Beak */}
    <ellipse cx="7" cy="24" rx="6" ry="3.5" opacity="0.85" />
    {/* Eye */}
    <circle cx="16" cy="19" r="2.5" fill="white" />
    <circle cx="16" cy="19" r="1" fill="black" />
    {/* Wing */}
    <ellipse cx="38" cy="30" rx="8" ry="6" opacity="0.7" />
  </svg>
);

export const BabyTeddy = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 60 60" className={className} fill="currentColor">
    {/* Ears */}
    <circle cx="14" cy="14" r="10" />
    <circle cx="46" cy="14" r="10" />
    {/* Face/Body */}
    <ellipse cx="30" cy="35" rx="22" ry="20" />
    {/* Inner ears */}
    <circle cx="14" cy="14" r="5" opacity="0.6" />
    <circle cx="46" cy="14" r="5" opacity="0.6" />
    {/* Eyes */}
    <circle cx="22" cy="30" r="3" fill="white" />
    <circle cx="38" cy="30" r="3" fill="white" />
    <circle cx="22" cy="30" r="1.5" fill="black" />
    <circle cx="38" cy="30" r="1.5" fill="black" />
    {/* Nose */}
    <ellipse cx="30" cy="38" rx="5" ry="3.5" opacity="0.7" />
    {/* Snout */}
    <ellipse cx="30" cy="42" rx="8" ry="5" opacity="0.5" />
  </svg>
);

export const BabyOnesie = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 60 60" className={className} fill="currentColor">
    <path d="M15 5 L10 20 L18 22 L18 55 L42 55 L42 22 L50 20 L45 5 L35 10 Q30 14 25 10 Z" />
    {/* Snaps */}
    <circle cx="25" cy="50" r="2" opacity="0.5" />
    <circle cx="30" cy="50" r="2" opacity="0.5" />
    <circle cx="35" cy="50" r="2" opacity="0.5" />
  </svg>
);

export const BabyStroller = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 60 55" className={className} fill="currentColor">
    {/* Canopy */}
    <path d="M12 18 Q10 5 22 6 L30 6 Q42 6 44 20 L46 32 L16 32 Z" opacity="0.85" />
    {/* Body */}
    <rect x="16" y="32" width="30" height="8" rx="2" opacity="0.7" />
    {/* Wheels */}
    <circle cx="18" cy="48" r="7" />
    <circle cx="42" cy="48" r="7" />
    <circle cx="18" cy="48" r="3" opacity="0.5" />
    <circle cx="42" cy="48" r="3" opacity="0.5" />
    {/* Handle */}
    <path d="M46 32 L52 22" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);

export const BabyBlock = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 50 50" className={className} fill="currentColor">
    <rect x="6" y="6" width="38" height="38" rx="6" />
    <text x="25" y="34" textAnchor="middle" fontSize="22" fill="white" fontWeight="bold" fontFamily="Arial">
      A
    </text>
  </svg>
);

export const BabyBalloon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 40 60" className={className} fill="currentColor">
    <ellipse cx="20" cy="22" rx="16" ry="20" />
    <path d="M20 42 L18 48 L22 48 Z" />
    <path d="M20 48 Q22 52 18 56 Q20 54 22 58" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

export const BabyCrib = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 70 50"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round">
    {/* Frame */}
    <rect x="8" y="10" width="54" height="32" rx="4" />
    {/* Bars */}
    <line x1="18" y1="10" x2="18" y2="42" />
    <line x1="28" y1="10" x2="28" y2="42" />
    <line x1="38" y1="10" x2="38" y2="42" />
    <line x1="48" y1="10" x2="48" y2="42" />
    {/* Legs */}
    <line x1="8" y1="42" x2="8" y2="50" strokeWidth="3" />
    <line x1="62" y1="42" x2="62" y2="50" strokeWidth="3" />
  </svg>
);

export const BabyMobile = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 70 60" className={className} fill="currentColor">
    {/* Top bar */}
    <rect x="15" y="5" width="40" height="4" rx="2" opacity="0.7" />
    {/* Center hook */}
    <line x1="35" y1="0" x2="35" y2="5" stroke="currentColor" strokeWidth="2" />
    {/* Strings */}
    <line x1="20" y1="9" x2="20" y2="25" stroke="currentColor" strokeWidth="1.5" />
    <line x1="35" y1="9" x2="35" y2="30" stroke="currentColor" strokeWidth="1.5" />
    <line x1="50" y1="9" x2="50" y2="20" stroke="currentColor" strokeWidth="1.5" />
    {/* Hanging shapes */}
    <circle cx="20" cy="32" r="7" />
    <path d="M35 37 L39 47 L31 47 Z" /> {/* Triangle */}
    <rect x="44" y="24" width="12" height="12" rx="2" />
  </svg>
);

export const BabySocks = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 60 45" className={className} fill="currentColor">
    {/* Left sock */}
    <path d="M10 5 L10 25 Q10 35 20 35 L28 35 Q32 35 32 28 L32 18 L18 18 L18 5 Z" />
    <line x1="10" y1="12" x2="18" y2="12" stroke="white" strokeWidth="2" opacity="0.5" />
    {/* Right sock */}
    <path d="M38 5 L38 25 Q38 35 48 35 L56 35 Q60 35 60 28 L60 18 L46 18 L46 5 Z" />
    <line x1="38" y1="12" x2="46" y2="12" stroke="white" strokeWidth="2" opacity="0.5" />
  </svg>
);

export const BabyBib = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 50 55" className={className} fill="currentColor">
    <path d="M10 10 Q5 5 15 3 L25 2 L35 3 Q45 5 40 10 L42 45 Q42 52 25 52 Q8 52 8 45 Z" />
    {/* Neck hole */}
    <ellipse cx="25" cy="12" rx="8" ry="6" fill="white" opacity="0.3" />
    {/* Little design */}
    <circle cx="25" cy="32" r="5" opacity="0.5" />
  </svg>
);
