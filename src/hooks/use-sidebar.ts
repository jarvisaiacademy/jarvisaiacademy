"use client";

import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useSidebar(initialState = true) {
  const [isOpen, setIsOpen] = useState(initialState);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let wasMobile: boolean | null = null;

    // React to breakpoint crossings only. Running on every resize would also
    // re-close an open drawer (or re-open a closed sidebar) on a stray pixel.
    const checkScreen = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      if (mobile === wasMobile) return;
      wasMobile = mobile;
      setIsMobile(mobile);
      // The drawer and the docked sidebar want opposite defaults. Without
      // resetting here, the drawer's forced close left the desktop sidebar
      // hidden for the rest of the session.
      setIsOpen(!mobile);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggle = () => setIsOpen((prev) => !prev);

  return { isOpen, setIsOpen, toggle, isMobile };
}
