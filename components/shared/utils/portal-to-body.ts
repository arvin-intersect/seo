"use client";

import { createPortal } from "react-dom";
import { useState, useEffect, ReactNode } from "react";

export default function PortalToBody({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Return null on the server or until the component is mounted on the client
  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}