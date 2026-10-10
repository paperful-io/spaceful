import type { Theme } from "@/types/theme.type";

export const getStyleFromTheme = (theme: Theme) => {
  const variables: string[] = [];

  for (const [key, value] of Object.entries(theme)) {
    if (value && typeof value === "string") {
      variables.push(`--color-${key}:${value};`);
    } else if (value && typeof value === "object") {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        variables.push(
          `--color-${key}${nestedKey === "main" ? "" : `-${nestedKey}`}:${nestedValue};`
        );
      }
    }
  }

  return variables.join(" ");
};
