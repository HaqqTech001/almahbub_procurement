// // /** @type {import('tailwindcss').Config} */
// // module.exports = {
// //   darkMode: ["class"],
// //   content: [
// //     './pages/**/*.{ts,tsx}',
// //     './components/**/*.{ts,tsx}',
// //     './app/**/*.{ts,tsx}',
// //     './src/**/*.{ts,tsx}',
// //   ],
// //   theme: {
// //     container: {
// //       center: true,
// //       padding: "2rem",
// //       screens: {
// //         "2xl": "1400px",
// //       },
// //     },
// //     extend: {
// //       colors: {
// //         // Almahbub Brand Colors
// //         primary: {
// //           DEFAULT: "#205562", // Deep Teal
// //           50: "#f0f9fa",
// //           100: "#dceff1",
// //           200: "#b9dee3",
// //           300: "#97cdd5",
// //           400: "#54a7b8",
// //           500: "#205562", // Main brand color
// //           600: "#1a4a53",
// //           700: "#133d44",
// //           800: "#0d3036",
// //           900: "#0a282d",
// //         },
// //         secondary: {
// //           DEFAULT: "#0D0D0D", // Rich Black
// //           50: "#f5f5f5",
// //           100: "#e5e5e5",
// //           200: "#d4d4d4",
// //           300: "#a3a3a3",
// //           400: "#737373",
// //           500: "#525252",
// //           600: "#404040",
// //           700: "#262626",
// //           800: "#171717",
// //           900: "#0D0D0D",
// //         },
// //         accent: {
// //           DEFAULT: "#FCD693", // Golden Highlight
// //           50: "#fefbf3",
// //           100: "#fef7e7",
// //           200: "#fdecc4",
// //           300: "#fbde9f",
// //           400: "#f9cf73",
// //           500: "#FCD693",
// //           600: "#e8b46f",
// //           700: "#d4974f",
// //           800: "#bf7a35",
// //           900: "#a96525",
// //         },
// //         neutral: {
// //           light: "#F5F7F8",
// //           dark: "#1B1B1B",
// //         },
// //         border: "hsl(var(--border))",
// //         input: "hsl(var(--input))",
// //         ring: "hsl(var(--ring))",
// //         background: "hsl(var(--background))",
// //         foreground: "hsl(var(--foreground))",
// //         destructive: {
// //           DEFAULT: "hsl(var(--destructive))",
// //           foreground: "hsl(var(--destructive-foreground))",
// //         },
// //         muted: {
// //           DEFAULT: "hsl(var(--muted))",
// //           foreground: "hsl(var(--muted-foreground))",
// //         },
// //         popover: {
// //           DEFAULT: "hsl(var(--popover))",
// //           foreground: "hsl(var(--popover-foreground))",
// //         },
// //         card: {
// //           DEFAULT: "hsl(var(--card))",
// //           foreground: "hsl(var(--card-foreground))",
// //         },
// //       },
// //       borderRadius: {
// //         lg: "var(--radius)",
// //         md: "calc(var(--radius) - 2px)",
// //         sm: "calc(var(--radius) - 4px)",
// //       },
// //       keyframes: {
// //         "accordion-down": {
// //           from: { height: 0 },
// //           to: { height: "var(--radix-accordion-content-height)" },
// //         },
// //         "accordion-up": {
// //           from: { height: "var(--radix-accordion-content-height)" },
// //           to: { height: 0 },
// //         },
// //         "fade-in": {
// //           "0%": { opacity: "0", transform: "translateY(10px)" },
// //           "100%": { opacity: "1", transform: "translateY(0)" },
// //         },
// //         "slide-in": {
// //           "0%": { transform: "translateX(-100%)" },
// //           "100%": { transform: "translateX(0)" },
// //         },
// //         "pulse-glow": {
// //           "0%, 100%": { boxShadow: "0 0 5px rgba(252, 214, 147, 0.5)" },
// //           "50%": { boxShadow: "0 0 20px rgba(252, 214, 147, 0.8)" },
// //         },
// //       },
// //       animation: {
// //         "accordion-down": "accordion-down 0.2s ease-out",
// //         "accordion-up": "accordion-up 0.2s ease-out",
// //         "fade-in": "fade-in 0.3s ease-out",
// //         "slide-in": "slide-in 0.3s ease-out",
// //         "pulse-glow": "pulse-glow 2s infinite",
// //       },
// //       backgroundImage: {
// //         'gradient-brand': 'linear-gradient(135deg, #205562 0%, #0E5A5C 100%)',
// //         'gradient-accent': 'linear-gradient(135deg, #FCD693 0%, #E7B96A 100%)',
// //         'gradient-mesh': 'linear-gradient(135deg, #205562 0%, #0D0D0D 50%, #FCD693 100%)',
// //       },
// //     },
// //   },
// //   plugins: [require("tailwindcss-animate")],
// // };



// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   darkMode: ["class"],
//   content: [
//     './pages/**/*.{ts,tsx}',
//     './components/**/*.{ts,tsx}',
//     './app/**/*.{ts,tsx}',
//     './src/**/*.{ts,tsx}',
//   ],
//   theme: {
//     container: {
//       center: true,
//       padding: "2rem",
//       screens: {
//         "2xl": "1400px",
//       },
//     },
//     extend: {
//       colors: {
//         // Almahbub Brand Colors - Updated Palette
//         primary: {
//           DEFAULT: "#0F4C5C", // Deep Cyan/Teal - Professional, trust
//           50: "#f0f9fa",
//           100: "#dceff1",
//           200: "#b9dee3",
//           300: "#97cdd5",
//           400: "#54a7b8",
//           500: "#0F4C5C", // Main brand color
//           600: "#0e4653",
//           700: "#0c3d47",
//           800: "#0a3440",
//           900: "#1A3A47", // Darker shade
//         },
//         secondary: {
//           DEFAULT: "#0D0D0D", // Rich Black
//           50: "#f5f5f5",
//           100: "#e5e5e5",
//           200: "#d4d4d4",
//           300: "#a3a3a3",
//           400: "#737373",
//           500: "#525252",
//           600: "#404040",
//           700: "#262626",
//           800: "#171717",
//           900: "#0D0D0D",
//         },
//         accent: {
//           DEFAULT: "#E3B505", // Muted Gold/Amber - Highlights, premium
//           50: "#fefbf3",
//           100: "#fef7e7",
//           200: "#fdecc4",
//           300: "#fbde9f",
//           400: "#f9cf73",
//           500: "#E3B505", // Main accent color
//           600: "#cca304",
//           700: "#a68a03",
//           800: "#8a7203",
//           900: "#705d02",
//         },
//         success: {
//           DEFAULT: "#2A9D8F", // Soft Green - Reassuring
//           50: "#f0fdf9",
//           100: "#ccfbef",
//           200: "#99f6d9",
//           300: "#5fe9c0",
//           400: "#26d9a3",
//           500: "#2A9D8F",
//           600: "#238c79",
//           700: "#1d7867",
//           800: "#176354",
//           900: "#145144",
//         },
//         neutral: {
//           light: "#F0F4F8", // Cool Grey/Blue white - Not stark white
//           dark: "#1B1B1B",
//         },
//         border: "hsl(var(--border))",
//         input: "hsl(var(--input))",
//         ring: "hsl(var(--ring))",
//         background: "hsl(var(--background))",
//         foreground: "hsl(var(--foreground))",
//         destructive: {
//           DEFAULT: "hsl(var(--destructive))",
//           foreground: "hsl(var(--destructive-foreground))",
//         },
//         muted: {
//           DEFAULT: "hsl(var(--muted))",
//           foreground: "hsl(var(--muted-foreground))",
//         },
//         popover: {
//           DEFAULT: "hsl(var(--popover))",
//           foreground: "hsl(var(--popover-foreground))",
//         },
//         card: {
//           DEFAULT: "hsl(var(--card))",
//           foreground: "hsl(var(--card-foreground))",
//         },
//       },
//       borderRadius: {
//         lg: "var(--radius)",
//         md: "calc(var(--radius) - 2px)",
//         sm: "calc(var(--radius) - 4px)",
//       },
//       keyframes: {
//         "accordion-down": {
//           from: { height: 0 },
//           to: { height: "var(--radix-accordion-content-height)" },
//         },
//         "accordion-up": {
//           from: { height: "var(--radix-accordion-content-height)" },
//           to: { height: 0 },
//         },
//         "fade-in": {
//           "0%": { opacity: "0", transform: "translateY(10px)" },
//           "100%": { opacity: "1", transform: "translateY(0)" },
//         },
//         "slide-in": {
//           "0%": { transform: "translateX(-100%)" },
//           "100%": { transform: "translateX(0)" },
//         },
//         "pulse-glow": {
//           "0%, 100%": { boxShadow: "0 0 5px rgba(227, 181, 5, 0.5)" },
//           "50%": { boxShadow: "0 0 20px rgba(227, 181, 5, 0.8)" },
//         },
//         "float": {
//           "0%, 100%": { transform: "translateY(0) translateX(0)" },
//           "50%": { transform: "translateY(-20px) translateX(10px)" },
//         },
//         "pulse-soft": {
//           "0%, 100%": { opacity: "0.1" },
//           "50%": { opacity: "0.2" },
//         },
//       },
//       animation: {
//         "accordion-down": "accordion-down 0.2s ease-out",
//         "accordion-up": "accordion-up 0.2s ease-out",
//         "fade-in": "fade-in 0.3s ease-out",
//         "slide-in": "slide-in 0.3s ease-out",
//         "pulse-glow": "pulse-glow 2s infinite",
//         "float": "float 8s ease-in-out infinite",
//         "pulse-soft": "pulse-soft 4s ease-in-out infinite",
//       },
//       backgroundImage: {
//         'gradient-brand': 'linear-gradient(135deg, #0F4C5C 0%, #1A3A47 100%)',
//         'gradient-accent': 'linear-gradient(135deg, #E3B505 0%, #d4a75a 100%)',
//         'gradient-mesh': 'linear-gradient(135deg, #0F4C5C 0%, #0D0D0D 50%, #E3B505 100%)',
//         'gradient-subtle': 'linear-gradient(135deg, #F0F4F8 0%, #e9ecef 100%)',
//         'gradient-warm': 'linear-gradient(135deg, #0F4C5C 0%, #1A3A47 50%, #E3B505 100%)',
//       },
//     },
//   },
//   plugins: [require("tailwindcss-animate")],
// }



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
        // Almahbub Brand Colors - Updated Palette
        primary: {
          DEFAULT: "#0F4C5C", // Deep Cyan/Teal - Professional, trust
          50: "#f0f9fa",
          100: "#dceff1",
          200: "#b9dee3",
          300: "#97cdd5",
          400: "#54a7b8",
          500: "#0F4C5C", // Main brand color
          600: "#0e4653",
          700: "#0c3d47",
          800: "#0a3440",
          900: "#1A3A47", // Darker shade
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
          DEFAULT: "#E3B505", // Muted Gold/Amber - Highlights, premium
          50: "#fefbf3",
          100: "#fef7e7",
          200: "#fdecc4",
          300: "#fbde9f",
          400: "#f9cf73",
          500: "#E3B505", // Main accent color
          600: "#cca304",
          700: "#a68a03",
          800: "#8a7203",
          900: "#705d02",
        },
        success: {
          DEFAULT: "#2A9D8F", // Soft Green - Reassuring
          50: "#f0fdf9",
          100: "#ccfbef",
          200: "#99f6d9",
          300: "#5fe9c0",
          400: "#26d9a3",
          500: "#2A9D8F",
          600: "#238c79",
          700: "#1d7867",
          800: "#176354",
          900: "#145144",
        },
        neutral: {
          light: "#F0F4F8", // Cool Grey/Blue white - Not stark white
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
          "0%, 100%": { boxShadow: "0 0 5px rgba(227, 181, 5, 0.5)" },
          "50%": { boxShadow: "0 0 20px rgba(227, 181, 5, 0.8)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(-20px) translateX(10px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.1" },
          "50%": { opacity: "0.2" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s infinite",
        "float": "float 8s ease-in-out infinite",
        "pulse-soft": "pulse-soft 4s ease-in-out infinite",
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #0F4C5C 0%, #1A3A47 100%)',
        'gradient-accent': 'linear-gradient(135deg, #E3B505 0%, #d4a75a 100%)',
        'gradient-mesh': 'linear-gradient(135deg, #0F4C5C 0%, #0D0D0D 50%, #E3B505 100%)',
        'gradient-subtle': 'linear-gradient(135deg, #F0F4F8 0%, #e9ecef 100%)',
        'gradient-warm': 'linear-gradient(135deg, #0F4C5C 0%, #1A3A47 50%, #E3B505 100%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}