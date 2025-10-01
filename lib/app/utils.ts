// lib/app/utils.ts

/**
 * Merge class names conditionally.
 * Similar to `clsx`, used by shadcn components.
 */
export function cx(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(" ");
  }
  
  /**
   * Optional: 'cn' helper that supports Tailwind variants
   * Often used in shadcn projects.
   */
  export function cn(...classes: (string | undefined | null | false)[]): string {
    return cx(...classes);
  }
  