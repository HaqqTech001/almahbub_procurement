/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Almahbub Brand Colors
        primary: {
          DEFAULT: "#205562", // Deep Teal
          50: "#f0f9fa",
          100: "#dceff1",
          200: "#b9dee3",
          300: "#97cdd5",
          400: "#54a7b8",
          500: "#205562", // Main brand color
          600: "#1a4a53",
          700: "#133d44",
          800: "#0d3036",
          900: "#0a282d",
        },
        secondary: {
          DEFAULT: "#0D0D0D", // Rich Black
          50: "#f5f5f5",
          100: "#e5e5e5",
          200: "#d4d4d4",
          300: "#a3a3a3",
          400: "#737373",
          500: "#525252",
          600: "#404040",
          700: "#262626",
          800: "#171717",
          900: "#0D0D0D",
        },
        accent: {
          DEFAULT: "#FCD693", // Golden Highlight
          50: "#fefbf3",
          100: "#fef7e7",
          200: "#fdecc4",
          300: "#fbde9f",
          400: "#f9cf73",
          500: "#FCD693",
          600: "#e8b46f",
          700: "#d4974f",
          800: "#bf7a35",
          900: "#a96525",
        },
        neutral: {
          light: "#F5F7F8",
          dark: "#1B1B1B",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(252, 214, 147, 0.5)" },
          "50%": { boxShadow: "0 0 20px rgba(252, 214, 147, 0.8)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s infinite",
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #205562 0%, #0E5A5C 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FCD693 0%, #E7B96A 100%)',
        'gradient-mesh': 'linear-gradient(135deg, #205562 0%, #0D0D0D 50%, #FCD693 100%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}