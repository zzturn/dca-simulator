import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Material Design 3 风格色彩系统 - 深色主题
        surface: {
          DEFAULT: "#0f172a",
          dim: "#020617",
          bright: "#1e293b",
          container: "#1e293b",
          "container-high": "#334155",
        },
        primary: {
          DEFAULT: "#60a5fa",
          container: "#1e3a5f",
          "on-container": "#bfdbfe",
        },
        secondary: {
          DEFAULT: "#a78bfa",
          container: "#2e1065",
          "on-container": "#ddd6fe",
        },
        tertiary: {
          DEFAULT: "#2dd4bf",
          container: "#134e4a",
          "on-container": "#5eead4",
        },
        // 金融色 - 中国股市惯例
        profit: {
          DEFAULT: "#ef4444",
          light: "#fca5a5",
          dark: "#b91c1c",
          container: "#450a0a",
        },
        loss: {
          DEFAULT: "#22c55e",
          light: "#86efac",
          dark: "#15803d",
          container: "#052e16",
        },
        // 热力图专用颜色（与 profit/loss 一致）
        "financial-up": "#f87171", // 盈利 - 红色
        "financial-down": "#4ade80", // 亏损 - 绿色
        // 文字层级
        "on-surface": "#f1f5f9",
        "on-surface-variant": "#94a3b8",
        "on-surface-muted": "#64748b",
        outline: "#475569",
        "outline-variant": "#334155",
        // 嬰皮玻璃材质 - 深色主题
        "glass-surface": {
          DEFAULT: "rgba(30, 41, 59, 0.6)",
          hover: "rgba(51, 65, 85, 0.8)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        "glass": "0 8px 32px rgba(0, 0, 0, 0.3)",
        "glass-lg": "0 12px 48px rgba(0, 0, 0, 0.4)",
        "glow-profit": "0 0 40px rgba(239, 68, 68, 0.3)",
        "glow-loss": "0 0 40px rgba(34, 197, 94, 0.3)",
        "glow-primary": "0 0 40px rgba(96, 165, 250, 0.3)",
        "card": "0 1px 3px rgba(0, 0, 0, 0.1)",
        "card-hover": "0 8px 24px rgba(0, 0, 0, 0.2)",
      },
      fontFamily: {
        sans: ["Inter", "PingFang SC", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "Monaco", "Consolas", "monospace"],
        number: ["DIN Condensed", "SF Mono", "PingFang SC", "monospace"],
      },
      fontSize: {
        "display": ["48px", { lineHeight: "1.1", fontWeight: "700" }],
        "title": ["20px", { lineHeight: "1.4", fontWeight: "600" }],
        "body": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "caption": ["12px", { lineHeight: "1.4", fontWeight: "400" }],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "mesh-gradient": "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
