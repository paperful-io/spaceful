import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const classNames = (...classes: ClassValue[]) => {
  return twMerge(clsx(...classes));
};

export const cn = classNames;
