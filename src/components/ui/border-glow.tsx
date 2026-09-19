"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useReducedMotion } from "motion/react";

/**
 * A card wrapper whose edge lights up as the pointer approaches it: the glow is masked to a
 * cone pointing away from the cursor, so the highlight always sits on the side you are
 * moving toward rather than ringing the whole card.
 *
 * Ported from React Bits' BorderGlow. Two deliberate changes beyond the styling, which now
 * lives in `globals.css` under `.border-glow-card`:
 *
 *  - the intro sweep runs on requestAnimationFrame alone and clamps its progress, so it can
 *    no longer be asked for a negative frame (the original offset its clock and its timeout
 *    by the same delay, which made the first frames of an eased animation run backwards);
 *  - the sweep is skipped under `prefers-reduced-motion`.
 *
 * Every colour comes from CSS custom properties so it follows the app's own `.dark` class.
 * Retint by putting a class on `className` that resets `--glow-color` and
 * `--mesh-one`/`--mesh-two`/`--mesh-three`; `globals.css` carries two such classes
 * (`--library`, `--cycle`). Do not run `className` through the class merger — see below.
 */
interface BorderGlowProps {
  children: ReactNode;
  className?: string;
  /** How close the pointer has to get to an edge before the glow shows, 0-100. */
  edgeSensitivity?: number;
  /** Corner radius in px. Must match the child's own radius or the ring will not line up. */
  borderRadius?: number;
  /**
   * How far the glow reaches past the card in px. Keep it under the smallest gutter the card
   * is given — the transcript clips horizontally, so a glow wider than the padding on mobile
   * gets cut off in a straight line.
   */
  glowRadius?: number;
  /** Angular width of the lit cone, 5-45. */
  coneSpread?: number;
  /** Strength of the mesh that bleeds inside the edge, 0-1. */
  fillOpacity?: number;
  /** Play the intro sweep once on mount. */
  animated?: boolean;
  /**
   * Keep the cone turning round the card forever, with the glow held lit rather than waiting
   * for the pointer. Ignores pointer movement — a hover that fought the rotation frame by
   * frame would read as a stutter. Skipped under `prefers-reduced-motion`.
   */
  loop?: boolean;
}

/** One full turn of the looping cone. Slower than it sounds: the lit wedge is ~50deg wide. */
const LOOP_PERIOD_MS = 4000;

function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

function easeInCubic(x: number) {
  return x * x * x;
}

interface AnimateValueOptions {
  start?: number;
  end?: number;
  duration?: number;
  delay?: number;
  ease?: (x: number) => number;
  onUpdate: (value: number) => void;
  onEnd?: () => void;
}

/** Drives one number over time and returns a cancel function. */
function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}: AnimateValueOptions) {
  let frame = 0;
  let cancelled = false;
  const began = performance.now() + delay;

  const tick = () => {
    if (cancelled) return;
    const progress = Math.min(Math.max((performance.now() - began) / duration, 0), 1);
    onUpdate(start + (end - start) * ease(progress));
    if (progress < 1) frame = requestAnimationFrame(tick);
    else onEnd?.();
  };

  frame = requestAnimationFrame(tick);
  return () => {
    cancelled = true;
    cancelAnimationFrame(frame);
  };
}

export function BorderGlow({
  children,
  className,
  edgeSensitivity = 30,
  borderRadius = 24,
  glowRadius = 14,
  coneSpread = 25,
  fillOpacity = 0.5,
  animated = false,
  loop = false,
}: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // Position is written straight onto the element as custom properties. This is the one
  // place in the card where going through React state would be wrong: pointermove fires
  // continuously and the layers that read these values are pure CSS, so a re-render per
  // mouse event would buy nothing.
  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const centreX = rect.width / 2;
    const centreY = rect.height / 2;
    const dx = event.clientX - rect.left - centreX;
    const dy = event.clientY - rect.top - centreY;

    // Distance to the nearest edge, as a fraction of half the card: 1 means the pointer is
    // on the boundary, 0 means it is at the centre.
    let kx = Infinity;
    let ky = Infinity;
    if (dx !== 0) kx = centreX / Math.abs(dx);
    if (dy !== 0) ky = centreY / Math.abs(dy);
    const proximity = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);

    // 0deg points up, and grows clockwise, which is the convention the cone mask expects.
    const degrees = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    const angle = degrees < 0 ? degrees + 360 : degrees;

    card.style.setProperty("--edge-proximity", (proximity * 100).toFixed(3));
    card.style.setProperty("--cursor-angle", `${angle.toFixed(3)}deg`);
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || !animated || reduceMotion) return;

    const angleStart = 110;
    const angleEnd = 465;
    const sweepAngle = (value: number) =>
      card.style.setProperty(
        "--cursor-angle",
        `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`
      );

    card.classList.add("sweep-active");

    const cancel = [
      animateValue({ duration: 500, onUpdate: (v) => card.style.setProperty("--edge-proximity", `${v}`) }),
      animateValue({ ease: easeInCubic, duration: 1500, onUpdate: sweepAngle }),
      animateValue({ ease: easeOutCubic, delay: 1500, duration: 2250, start: 50, onUpdate: sweepAngle }),
      animateValue({
        ease: easeInCubic,
        delay: 2500,
        duration: 1500,
        start: 100,
        end: 0,
        onUpdate: (v) => card.style.setProperty("--edge-proximity", `${v}`),
        onEnd: () => card.classList.remove("sweep-active"),
      }),
    ];

    return () => {
      for (const stop of cancel) stop();
      card.classList.remove("sweep-active");
    };
  }, [animated, reduceMotion]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || !loop || reduceMotion) return;

    // `sweep-active` is what keeps the layers from fading out on a card nobody is hovering,
    // and proximity is pinned high so the whole edge stays lit while the cone travels.
    card.classList.add("sweep-active");
    card.style.setProperty("--edge-proximity", "100");
    const began = performance.now();
    let frame = requestAnimationFrame(function tick() {
      const turn = ((performance.now() - began) % LOOP_PERIOD_MS) / LOOP_PERIOD_MS;
      card.style.setProperty("--cursor-angle", `${(turn * 360).toFixed(2)}deg`);
      frame = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(frame);
      card.classList.remove("sweep-active");
      card.style.removeProperty("--edge-proximity");
      // Left behind, the last angle would freeze the cone where the loop stopped until the
      // next pointer move overwrote it.
      card.style.removeProperty("--cursor-angle");
    };
  }, [loop, reduceMotion]);

  return (
    <div
      ref={cardRef}
      onPointerMove={loop ? undefined : handlePointerMove}
      // Concatenated, not run through `cn`: retinting happens by putting another
      // `border-glow-card--*` class on `className`, and the merger reads that as a conflict
      // with the base class and keeps only the last one — silently stripping this class and
      // with it every layer of the glow.
      className={`border-glow-card${className ? ` ${className}` : ""}`}
      style={
        {
          "--edge-sensitivity": edgeSensitivity,
          "--border-radius": `${borderRadius}px`,
          "--glow-padding": `${glowRadius}px`,
          "--cone-spread": coneSpread,
          "--fill-opacity": fillOpacity,
        } as React.CSSProperties
      }
    >
      <span className="edge-light" aria-hidden="true" />
      <div className="border-glow-inner">{children}</div>
    </div>
  );
}
