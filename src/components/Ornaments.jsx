import { motion } from "framer-motion";

export function GoldArch({ className, delay = 0 }) {
  return (
    <svg viewBox="0 0 400 620" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="archGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B8945A" />
          <stop offset="0.5" stopColor="#EAD9AE" />
          <stop offset="1" stopColor="#B8945A" />
        </linearGradient>
      </defs>
      <motion.path
        d="M30 620 V240 C30 110 105 30 200 30 C295 30 370 110 370 240 V620"
        stroke="url(#archGold)" strokeWidth="2.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 2.2, delay, ease: "easeInOut" }}
      />
      <motion.path
        d="M52 620 V248 C52 130 122 54 200 54 C278 54 348 130 348 248 V620"
        stroke="url(#archGold)" strokeWidth="1" opacity="0.7"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 2.4, delay: delay + 0.25, ease: "easeInOut" }}
      />
      <motion.path
        d="M74 620 V256 C74 150 138 78 200 78 C262 78 326 150 326 256 V620"
        stroke="#D6B36A" strokeWidth="0.6" opacity="0.45"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 2.6, delay: delay + 0.5, ease: "easeInOut" }}
      />
    </svg>
  );
}

export function Mandala({ className }) {
  const petals = [...Array(12)];
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
      <g fill="none" stroke="#D6B36A" strokeWidth="1">
        <circle cx="200" cy="200" r="60" />
        <circle cx="200" cy="200" r="110" />
        <circle cx="200" cy="200" r="160" opacity="0.5" />
        {petals.map((_, i) => (
          <g key={i} transform={`rotate(${i * 30} 200 200)`}>
            <ellipse cx="200" cy="110" rx="26" ry="50" opacity="0.6" />
            <circle cx="200" cy="52" r="6" opacity="0.6" />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function Divider({ className }) {
  return (
    <svg viewBox="0 0 320 24" fill="none" className={className} aria-hidden="true">
      <line x1="0" y1="12" x2="128" y2="12" stroke="#D6B36A" strokeWidth="1" />
      <line x1="192" y1="12" x2="320" y2="12" stroke="#D6B36A" strokeWidth="1" />
      <path d="M160 2 L172 12 L160 22 L148 12 Z" stroke="#B8945A" fill="none" />
      <circle cx="138" cy="12" r="2.5" fill="#A5AA8A" />
      <circle cx="182" cy="12" r="2.5" fill="#A5AA8A" />
    </svg>
  );
}

const GARLAND_FLOWERS = [
  [90, 42], [230, 74], [370, 88], [510, 68], [650, 58], [790, 54], [930, 44], [1070, 30], [1180, 22],
];

export function HangingGarland({ className }) {
  return (
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d="M0 20 Q300 110 600 60 T1200 20" stroke="#B8945A" strokeWidth="1.5" fill="none" />
      {GARLAND_FLOWERS.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <line x1="0" y1="0" x2="0" y2="14" stroke="#A5AA8A" strokeWidth="1.2" />
          <circle cx="0" cy="20" r="5.5" fill={i % 2 ? "#D6B36A" : "#E9A23B"} opacity="0.9" />
          <circle cx="0" cy="20" r="2" fill="#641E2B" opacity="0.55" />
          <circle cx="-6" cy="26" r="3.5" fill="#A5AA8A" opacity="0.8" />
          <circle cx="6" cy="26" r="3.5" fill="#A5AA8A" opacity="0.8" />
        </g>
      ))}
    </svg>
  );
}

export function Monogram({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#641E2B" />
      <circle cx="32" cy="32" r="25" fill="none" stroke="#D6B36A" strokeWidth="1.2" opacity="0.7" />
      <text x="32" y="40" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="20" fill="#D6B36A">
        D<tspan fill="#FFF9F0">♥</tspan>S
      </text>
    </svg>
  );
}
