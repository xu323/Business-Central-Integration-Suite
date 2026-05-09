/** @type {import('tailwindcss').Config} */
// Design tokens aligned to Microsoft Fluent 2 / Dynamics 365 Business Central.
// References:
//   - https://fluent2.microsoft.design/
//   - https://learn.microsoft.com/dynamics365/business-central/dev-itpro/developer/devenv-extension-example
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Microsoft Blue (Communication / brand) ramp.
        brand: {
          50:  "#EFF6FC",
          100: "#DEECF9",
          200: "#C7E0F4",
          300: "#A0D0F5",
          400: "#2B88D8",
          500: "#0078D4",
          600: "#106EBE",
          700: "#005A9E",
          800: "#004578",
          900: "#002F5A",
        },
        // Fluent 2 neutral ramp.
        neutral: {
          10:  "#FAF9F8",
          20:  "#F3F2F1",
          30:  "#EDEBE9",
          40:  "#E1DFDD",
          60:  "#C8C6C4",
          90:  "#A19F9D",
          130: "#605E5C",
          160: "#323130",
          190: "#201F1E",
        },
        // Semantic intents (foreground + background pair).
        success: { DEFAULT: "#107C10", bg: "#DFF6DD", border: "#9FD89F" },
        warning: { DEFAULT: "#797673", bg: "#FFF4CE", border: "#F2CD81" },
        danger:  { DEFAULT: "#A4262C", bg: "#FDE7E9", border: "#F1BBBC" },
        info:    { DEFAULT: "#0078D4", bg: "#DEECF9", border: "#A0D0F5" },
      },
      fontFamily: {
        sans: [
          '"Segoe UI Variable Display"',
          '"Segoe UI Variable"',
          '"Segoe UI"',
          '"Microsoft JhengHei UI"',
          '"Microsoft JhengHei"',
          '"Yu Gothic UI"',
          "system-ui",
          "sans-serif",
        ],
        mono: [
          '"Cascadia Code"',
          '"Cascadia Mono"',
          "Consolas",
          '"Roboto Mono"',
          "monospace",
        ],
      },
      // Tailwind default rounded = 4px, matches Fluent 2.
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
        md: "4px",
        lg: "6px",
        xl: "8px",
      },
      boxShadow: {
        // Fluent 2 elevation tokens.
        card:    "0 1.6px 3.6px 0 rgba(0,0,0,0.132), 0 0.3px 0.9px 0 rgba(0,0,0,0.108)",
        flyout:  "0 6.4px 14.4px 0 rgba(0,0,0,0.132), 0 1.2px 3.6px 0 rgba(0,0,0,0.108)",
        modal:   "0 25.6px 57.6px 0 rgba(0,0,0,0.220), 0 4.8px 14.4px 0 rgba(0,0,0,0.180)",
        // Stealth focus halo: 2px white + 2px brand outline.
        focus:   "0 0 0 2px #FFFFFF, 0 0 0 4px #0078D4",
      },
      ringWidth: {
        DEFAULT: "2px",
      },
    },
  },
  plugins: [],
};
