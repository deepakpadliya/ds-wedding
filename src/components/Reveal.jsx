import { motion, useReducedMotion } from "framer-motion";
import { Divider } from "./Ornaments";

export default function Reveal({ children, delay = 0, y = 28, className = "", once = true }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.15 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({ eyebrow, title, script, className = "" }) {
  return (
    <Reveal className={`mb-10 text-center md:mb-14 ${className}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="h-serif mt-3">{title}</h2>
      {script && <p className="mt-2 font-script text-3xl text-gold-deep sm:text-4xl">{script}</p>}
      <Divider className="mx-auto mt-5 w-64" />
    </Reveal>
  );
}
