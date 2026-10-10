export type ThemePallete = {
  main: string;
  light: string;
  lightest?: string;
  dark: string;
  ring: string;
  foreground?: string;
};

export type Theme = {
  light: string;

  primary: ThemePallete;
  secondary: ThemePallete;

  blue: ThemePallete;
  purple: ThemePallete;
  orange: ThemePallete;
  red: ThemePallete;
  green: ThemePallete;

  backdrop: string;
  shade: Record<string | number, string>;
};
