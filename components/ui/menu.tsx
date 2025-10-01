"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { cn } from "@/utils/cn";

interface MenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
}

const MenuContext = React.createContext<MenuContextValue | undefined>(
  undefined,
);

function useMenu() {
  const context = React.useContext(MenuContext);
  if (!context) {
    throw new Error("useMenu must be used within a Menu");
  }
  return context;
}

interface MenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Menu({
  open: controlledOpen,
  onOpenChange,
  children,
}: MenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement>(null);

  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = React.useCallback(
    (value: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [controlledOpen, onOpenChange],
  );

  return (
    <MenuContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </MenuContext.Provider>
  );
}

interface MenuTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const MenuTrigger = React.forwardRef<
  HTMLButtonElement,
  MenuTriggerProps
>(({ onClick, asChild, children, ...props }, forwardedRef) => {
  const { open, setOpen, triggerRef } = useMenu();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented) {
      setOpen(!open);
    }
  };

  const setRefs = React.useCallback(
    (node: HTMLElement | null) => {
      if (forwardedRef) {
        if (typeof forwardedRef === "function") {
          forwardedRef(node as HTMLButtonElement);
        } else {
          forwardedRef.current = node as HTMLButtonElement;
        }
      }
      (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
    },
    [forwardedRef, triggerRef],
  );

  if (asChild && React.isValidElement<React.HTMLProps<HTMLElement>>(children)) {
    const childOnClick = children.props.onClick;
    return React.cloneElement(children, {
      ...props,
      ref: setRefs,
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        childOnClick?.(e);
        if (e.defaultPrevented) return;
        handleClick(e as unknown as React.MouseEvent<HTMLButtonElement>);
      },
    });
  }

  return (
    <button ref={setRefs} onClick={handleClick} {...props}>
      {children}
    </button>
  );
});

MenuTrigger.displayName = "MenuTrigger";

interface MenuContentProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  alignOffset?: number;
  matchTriggerWidth?: boolean;
}

function MenuPortal({
  children,
  open,
}: {
  children: React.ReactNode;
  open: boolean;
}) {
  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setShouldRender(true);
    }
  }, [open]);

  if (typeof window === "undefined" || !shouldRender) return null;

  return createPortal(
    <AnimatePresence
      onExitComplete={() => {
        if (!open) {
          setShouldRender(false);
        }
      }}
    >
      {children}
    </AnimatePresence>,
    document.body,
  );
}

export const MenuContent = React.forwardRef<HTMLDivElement, MenuContentProps>(
  (
    {
      className,
      align = "start",
      side = "bottom",
      sideOffset = 8,
      alignOffset = 0,
      matchTriggerWidth = false,
      children,
      ...props
    },
    ref,
  ) => {
    const { open, setOpen, triggerRef } = useMenu();
    const [position, setPosition] = React.useState<{
      top: number;
      left: number;
    } | null>(null);
    const [menuWidth, setMenuWidth] = React.useState<number>(0);
    const menuRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
      if (open && triggerRef.current) {
        const updatePosition = () => {
          if (!triggerRef.current) return;

          const rect = triggerRef.current.getBoundingClientRect();
          const menuPosition = { top: 0, left: 0 };

          if (side === "top") menuPosition.top = rect.top - sideOffset;
          else if (side === "bottom") menuPosition.top = rect.bottom + sideOffset;
          else if (side === "left" || side === "right") menuPosition.top = rect.top;

          if (side === "left") menuPosition.left = rect.left - sideOffset;
          else if (side === "right") menuPosition.left = rect.right + sideOffset;
          else if (side === "top" || side === "bottom") {
            if (align === "start") menuPosition.left = rect.left + alignOffset;
            else if (align === "center") menuPosition.left = rect.left + rect.width / 2;
            else if (align === "end") menuPosition.left = rect.right + alignOffset;
          }

          setPosition(menuPosition);
          if (matchTriggerWidth) setMenuWidth(rect.width);
        };

        updatePosition();
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);

        return () => {
          window.removeEventListener("scroll", updatePosition, true);
          window.removeEventListener("resize", updatePosition);
        };
      }
    }, [open, side, align, sideOffset, alignOffset, matchTriggerWidth, triggerRef]);

    React.useEffect(() => {
      if (open && position && menuRef.current && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const menuRect = menuRef.current.getBoundingClientRect();

        if (align === "end" && (side === "top" || side === "bottom")) {
          setPosition((prev) => ({ ...prev!, left: rect.right - menuRect.width + alignOffset }));
        } else if (align === "center" && (side === "top" || side === "bottom")) {
          setPosition((prev) => ({ ...prev!, left: rect.left + rect.width / 2 - menuRect.width / 2 }));
        }
      }
    }, [open, position, align, side, alignOffset, triggerRef]);

    return (
      <MenuPortal open={open}>
        {open && position && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
            <motion.div
              ref={(node) => {
                if (typeof ref === "function") ref(node);
                if (menuRef) menuRef.current = node;
              }}
              initial={{ opacity: 0, y: -6, scale: 1, filter: "blur(1px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 8, scale: 0.98, filter: "blur(1px)" }}
              transition={{ ease: [0.1, 0.1, 0.25, 1], duration: 0.2 }}
              className={cn("fixed z-[100] min-w-[8rem] overflow-hidden rounded-16 border border-border-faint bg-white", className)}
              style={{
                top: position.top,
                left: position.left,
                boxShadow: "0px 12px 24px rgba(0, 0, 0, 0.08), 0px 4px 8px rgba(0, 0, 0, 0.04)",
                width: matchTriggerWidth && menuWidth ? menuWidth : undefined,
                transform: (() => {
                  const transforms: string[] = [];
                  if (side === "top") transforms.push("translateY(-100%)");
                  if (side === "left") transforms.push("translateX(-100%)");
                  if (side === "left" || side === "right") {
                    if (align === "center") transforms.push("translateY(-50%)");
                    else if (align === "end") transforms.push("translateY(-100%)");
                  }
                  return transforms.join(" ") || undefined;
                })(),
              }}
              {...props}
            >
              {children}
            </motion.div>
          </>
        )}
      </MenuPortal>
    );
  }
);
MenuContent.displayName = "MenuContent";

interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
  variant?: "default" | "danger" | "active" | "ghost";
}

export const MenuItem = React.forwardRef<HTMLButtonElement, MenuItemProps>(
  ({ className, inset, onClick, variant = "default", children, ...props }, ref) => {
    const { setOpen } = useMenu();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (!e.defaultPrevented) setOpen(false);
    };

    const baseStyles = "relative flex w-full cursor-pointer select-none items-center gap-8 rounded-12 px-8 py-6 min-h-[36px] text-sm outline-none transition-all data-[disabled]:pointer-events-none data-[disabled]:opacity-50 active:scale-[0.98]";
    const variantStyles = {
      default: "text-foreground-dimmer hover:text-foreground hover:bg-black-alpha-4",
      danger: "text-red-600/70 hover:text-red-600 hover:bg-red-50",
      active: "text-primary-100 bg-primary-8 hover:bg-primary-12",
      ghost: "hover:bg-black-alpha-4",
    };

    return (
      <button ref={ref} className={cn(baseStyles, variantStyles[variant], inset && "pl-14", className)} onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }
);
MenuItem.displayName = "MenuItem";

type MenuGroupProps = React.HTMLAttributes<HTMLDivElement>;

export const MenuGroup = React.forwardRef<HTMLDivElement, MenuGroupProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-2 px-8 py-2", className)} {...props}>
      {children}
    </div>
  )
);
MenuGroup.displayName = "MenuGroup";

export { MenuHeader } from "./menu-header";