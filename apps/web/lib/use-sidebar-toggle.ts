"use client";

import { useEffect, useState } from "react";

const DESKTOP_QUERY = "(min-width: 768px)";

// one boolean drives two different presentations: an inline width-collapse on
// desktop, an off-canvas drawer on mobile. Desktop's preference is remembered;
// mobile always starts closed so the drawer never covers a freshly-loaded page
export function useSidebarToggle(storageKey: string) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (window.matchMedia(DESKTOP_QUERY).matches) {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(storageKey);
      } catch {
        // ignore
      }
      setOpen(stored !== "0");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  function close() {
    if (!window.matchMedia(DESKTOP_QUERY).matches) {
      setOpen(false);
    }
  }

  return { open, toggle, close };
}
