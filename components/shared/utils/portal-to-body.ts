import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setPortalNode(document.body);
  }, []);

  if (!mounted || !portalNode) return null;
  return createPortal(children, portalNode);
}
