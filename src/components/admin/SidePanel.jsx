import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";

// Right-hand slide-in panel for admin forms. Rendered on <body> so it always covers the whole screen
// (a fixed popup inside a card can end up anchored to the card). Sticky header + footer, Esc closes,
// Ctrl/Cmd+Enter saves, and closing with unsaved changes asks first.
export default function SidePanel({ title, subtitle, dirty = false, onClose, onSubmit, canSubmit = true, footer, testId, children }) {
  const latest = useRef({});
  latest.current = { dirty, onClose, onSubmit, canSubmit };

  useEffect(() => {
    const close = () => { const c = latest.current; if (!c.dirty || window.confirm("Discard your changes?")) c.onClose(); };
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && latest.current.canSubmit) latest.current.onSubmit?.();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    latest.current.close = close;
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, []);

  const close = () => latest.current.close?.();

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <motion.div className="absolute inset-0 bg-maroon-deep/60 backdrop-blur-sm" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <motion.div
        data-testid={testId}
        role="dialog" aria-modal="true" aria-label={title}
        initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "tween", duration: 0.25 }}
        className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-ivory shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gold/30 px-6 py-4">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-semibold text-maroon">{title}</h3>
            {subtitle && <p className="truncate text-xs text-brown/60">{subtitle}</p>}
          </div>
          <button type="button" onClick={close} className="rounded-full p-2 text-brown/60 hover:bg-gold/10" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        <div className="flex items-center gap-3 border-t border-gold/30 bg-ivory px-6 py-4">{footer}</div>
        <p className="pb-3 text-center text-[11px] text-brown/45">Esc to close · Ctrl/⌘ + Enter to save</p>
      </motion.div>
    </div>,
    document.body
  );
}
