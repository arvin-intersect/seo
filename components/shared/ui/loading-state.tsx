"use client";

import React from "react";
import { cn } from "@/utils/cn";

interface LoadingStateProps {
  message?: string;
  showFlame?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  size = "md",
  className,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "min-h-[200px]",
    md: "min-h-[300px]",
    lg: "min-h-[400px]",
  };

  const spinnerSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center",
        sizeClasses[size],
        className,
      )}
    >
      <div className="relative z-10 space-y-4">
        <div
          className={cn(
            "mx-auto rounded-full border-2 border-black-alpha-20 border-t-primary-100 animate-spin",
            spinnerSizes[size],
          )}
        />

        {message && (
          <p className="text-body-medium text-black-alpha-64">{message}</p>
        )}
      </div>
    </div>
  );
}