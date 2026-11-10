/** @type {import('tailwindcss').Config} */
module.exports = {
  blocklist: ["overline"],
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        ivory: "#FFF9F0",
        gold: { DEFAULT: "#D6B36A", deep: "#B8945A", soft: "#EAD9AE", faint: "#F5EBD3" },
        maroon: { DEFAULT: "#641E2B", deep: "#4A1520" },
        sage: "#A5AA8A",
        beige: "#EDE0CE",
        brown: { DEFAULT: "#392C26", soft: "#5A4A40" },
      },
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        cormorant: ['"Cormorant Garamond"', "serif"],
        lora: ['"Lora"', "serif"],
        script: ['"Great Vibes"', "cursive"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
