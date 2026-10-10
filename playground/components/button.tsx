import { tv } from "tailwind-variants";

/** Trimmed from the Paperful website's Button; applied to links here. */
export const buttonVariant = tv({
  base: "group inline-flex h-fit w-fit cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl outline-none transition",
  variants: {
    design: {
      default: "hover:bg-shade-200 focus-visible:bg-shade-300",
      primary:
        "border border-[rgba(0,0,0,0.1)] bg-primary text-primary-foreground hover:bg-primary-dark focus-visible:ring-2 focus-visible:ring-primary-ring",
      ghost:
        "border border-shade-200 bg-shade-50/60 text-shade-700 backdrop-blur hover:bg-shade-200/60",
    },
    size: {
      sm: "px-3 py-1.5 text-sm",
      md: "px-5 py-2.5 text-base",
    },
  },
  defaultVariants: {
    design: "default",
    size: "md",
  },
});
