export const getTitle = (title?: string | string[]) => {
  const name = "Spaceful";

  if (title && Array.isArray(title)) {
    title = title.join(" · ");
  }

  return title ? `${title} · ${name}` : name;
};
