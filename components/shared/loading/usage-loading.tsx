"use client";

export function UsageLoadingText({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="text-xs text-zinc-500">
      <span>{text}</span>
    </div>
  );
}