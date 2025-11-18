import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";
import { breakpoints, colorTokens, layoutTokens, radiusTokens } from "./src/shared/lib/constants";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: layoutTokens.containerPadding,
      screens: {
        "2xl": breakpoints["2xl"],
      },
    },
    screens: breakpoints,
    extend: {
      colors: colorTokens,
      borderRadius: radiusTokens,
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [animatePlugin],
} satisfies Config;
