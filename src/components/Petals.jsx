import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";

const COLORS = ["#D6B36A", "#EAD9AE", "#A5AA8A", "#E9C98F", "#B8945A"];

export default function Petals({ count = 16, className = "" }) {
  const reduce = useReducedMotion();
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(i * 97 + 13) % 100}%`,
        delay: `${((i * 1.7) % 12).toFixed(1)}s`,
        duration: `${11 + ((i * 3) % 9)}s`,
        size: 10 + ((i * 7) % 12),
        color: COLORS[i % COLORS.length],
      })),
    [count]
  );
  if (reduce) return null;
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {petals.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={{ left: p.left, animationDelay: p.delay, animationDuration: p.duration }}
        >
          <svg width={p.size} height={p.size} viewBox="0 0 20 20">
            <path d="M10 1 C16 5 18 12 10 19 C2 12 4 5 10 1 Z" fill={p.color} opacity="0.8" />
          </svg>
        </span>
      ))}
    </div>
  );
}
