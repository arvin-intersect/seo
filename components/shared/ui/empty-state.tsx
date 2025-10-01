"use client";

import React from "react";
import { cn } from "@/utils/cn";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  showFlame?: boolean;
  className?: string;
}

export function EmptyState({
  title = "No data yet",
  description,
  icon,
  action,
  showFlame = true,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center py-12 px-4 text-center",
        "min-h-[300px]",
        className,
      )}
    >
      {showFlame && (
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-primary-4 rounded-full blur-3xl animate-pulse" />
        </div>
      )}

      <div className="relative z-10 space-y-4">
        {icon && (
          <div className="w-12 h-12 mx-auto text-black-alpha-40">{icon}</div>
        )}

        <div className="space-y-2">
          <h3 className="text-label-large text-black-alpha-72">{title}</h3>
          {description && (
            <p className="text-body-medium text-black-alpha-56 max-w-md mx-auto">
              {description}
            </p>
          )}
        </div>

        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}