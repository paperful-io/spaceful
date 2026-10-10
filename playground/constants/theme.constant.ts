import type { Theme } from "@/types/theme.type";

export const DefaultTheme: Theme = {
  light: "#fff",

  primary: {
    main: "hsl(175, 84%, 32%)",
    light: "hsl(173, 80%, 40%)",
    lightest: "#E6F5F3",
    dark: "hsl(175, 77%, 26%)",
    ring: "hsla(175, 84%, 32%, 0.35)",
    foreground: "hsl(0, 0%, 100%)"
  },

  secondary: {
    main: "hsl(217, 19%, 27%)",
    light: "hsl(220, 9%, 46%)",
    dark: "hsl(221, 39%, 11%)",
    ring: "hsla(217, 19%, 27%, 0.35)",
    foreground: "hsl(0, 0%, 100%)"
  },

  blue: {
    main: "hsl(221, 83%, 53%)",
    light: "hsl(217, 91%, 60%)",
    dark: "hsl(224, 76%, 48%)",
    ring: "hsla(221, 83%, 53%, 0.35)"
  },

  purple: {
    main: "hsl(262, 83%, 58%)",
    light: "hsl(258, 90%, 66%)",
    dark: "hsl(263, 70%, 50%)",
    ring: "hsla(271, 76%, 53%, 0.35)"
  },

  orange: {
    main: "hsl(32, 95%, 44%)",
    light: "hsl(38, 92%, 50%)",
    dark: "hsl(26, 91%, 37%)",
    ring: "hsla(34, 100%, 50%, 0.35)"
  },

  red: {
    main: "hsl(0, 72%, 51%)",
    light: "hsl(0, 84%, 60%)",
    dark: "hsl(0, 74%, 42%)",
    ring: "hsla(0, 100%, 50%, 0.35)"
  },

  green: {
    main: "hsl(142, 76%, 36%)",
    light: "hsl(142, 71%, 45%)",
    dark: "hsl(142, 72%, 29%)",
    ring: "hsla(145, 63%, 42%, 0.35)"
  },

  backdrop: "hsla(220, 13%, 91%, 60%)",

  shade: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712"
  }
};

export const DarkTheme: Theme = {
  light: "#0D151C",

  primary: {
    main: "hsl(173, 80%, 40%)",
    light: "hsl(172, 75%, 48%)",
    lightest: "hsla(173, 80%, 40%, 0.14)",
    dark: "hsl(175, 84%, 32%)",
    ring: "hsla(173, 80%, 40%, 0.38)",
    foreground: "hsl(180, 20%, 98%)"
  },

  secondary: {
    main: "hsl(215, 19%, 35%)",
    light: "hsl(215, 16%, 47%)",
    dark: "hsl(217, 24%, 22%)",
    ring: "hsla(215, 19%, 45%, 0.35)",
    foreground: "hsl(210, 20%, 98%)"
  },

  blue: {
    main: "hsl(217, 91%, 60%)",
    light: "hsl(213, 94%, 68%)",
    dark: "hsl(221, 83%, 53%)",
    ring: "hsla(217, 91%, 60%, 0.38)"
  },

  purple: {
    main: "hsl(258, 90%, 66%)",
    light: "hsl(255, 92%, 76%)",
    dark: "hsl(262, 83%, 58%)",
    ring: "hsla(258, 90%, 66%, 0.38)"
  },

  orange: {
    main: "hsl(38, 92%, 50%)",
    light: "hsl(43, 96%, 58%)",
    dark: "hsl(32, 95%, 44%)",
    ring: "hsla(38, 92%, 50%, 0.38)"
  },

  red: {
    main: "hsl(0, 84%, 60%)",
    light: "hsl(0, 91%, 71%)",
    dark: "hsl(0, 72%, 51%)",
    ring: "hsla(0, 84%, 60%, 0.38)"
  },

  green: {
    main: "hsl(142, 71%, 45%)",
    light: "hsl(142, 69%, 58%)",
    dark: "hsl(142, 76%, 36%)",
    ring: "hsla(142, 71%, 45%, 0.38)"
  },

  backdrop: "hsla(222, 47%, 5%, 0.72)",

  shade: {
    950: "#F4F8F8",
    900: "#E8EEEE",
    800: "#D6E0E1",
    700: "#BBCACC",
    600: "#91A4A7",
    500: "#687B7F",
    400: "#485A60",
    300: "#304149",
    200: "#1D2A31",
    100: "#121C22",
    50: "#091218"
  }
};
