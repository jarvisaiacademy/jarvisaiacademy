"use client";

import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useSidebar(initialState = true) {
  // The docked sidebar and the mobile drawer are different UIs with opposite
  // defaults, so they keep separate open state. A single shared flag meant every
  // close of the drawer — entering the breakpoint, browser zoom — also collapsed
  // the docked sidebar, and nothing brought it back.
  const [dockedOpen, setDockedOpen] = useState(initialState);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let wasMobile: boolean | null = null;

    // Only react to breakpoint crossings: a per-resize run would re-close a
    // drawer the user just opened when a stray pixel crosses the line.
    const checkScreen = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      if (mobile === wasMobile) return;
      wasMobile = mobile;
      setIsMobile(mobile);
      // A drawer left open while the viewport shrinks would sit over the page.
      if (mobile) setDrawerOpen(false);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        (isMobile ? setDrawerOpen : setDockedOpen)((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile]);

  const isOpen = isMobile ? drawerOpen : dockedOpen;
  const setIsOpen = isMobile ? setDrawerOpen : setDockedOpen;
  const toggle = () => setIsOpen((prev) => !prev);

  return { isOpen, setIsOpen, toggle, isMobile };
}
