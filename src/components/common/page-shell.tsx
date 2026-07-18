import { cn } from "@/lib/utils";

/**
 * Canonical page container. Applies the shared max-width (1440px) and fluid
 * horizontal padding so every page — and the header/nav chrome — aligns to the
 * exact same left/right edges at every viewport. Vertical rhythm stays per-page
 * via className (e.g. `py-4 sm:py-6 space-y-6`).
 */
export function PageShell({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("page-shell", className)} {...props} />;
}
