import { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export default function FirecrawlIconStatic({
  className = "",
  ...attrs
}: HTMLAttributes<HTMLOrSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-accent-white", className)}
      {...attrs}
    >
      <path d="M12 3V21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.9282 8L4.07166 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.9282 16L4.07166 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}