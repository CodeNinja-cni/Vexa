"use client";

import { useEffect, useRef, type ReactNode } from "react";

import styles from "./landing.module.css";

type LandingDepthProps = {
  children: ReactNode;
  className: string;
};

export function LandingDepth({ children, className }: LandingDepthProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let currentX = 0;
    let currentY = 0;

    const paint = () => {
      currentX += (pointerX - currentX) * 0.075;
      currentY += (pointerY - currentY) * 0.075;
      root.style.setProperty("--tilt-x", `${(-currentY * 2.4).toFixed(3)}deg`);
      root.style.setProperty("--tilt-y", `${(currentX * 3.2).toFixed(3)}deg`);
      root.style.setProperty("--tilt-x-soft", `${(-currentY * 1.05).toFixed(3)}deg`);
      root.style.setProperty("--tilt-y-soft", `${(currentX * 1.4).toFixed(3)}deg`);
      root.style.setProperty("--tilt-x-micro", `${(-currentY * 0.43).toFixed(3)}deg`);
      root.style.setProperty("--tilt-y-micro", `${(currentX * 0.58).toFixed(3)}deg`);
      root.style.setProperty("--move-x", `${(currentX * 18).toFixed(2)}px`);
      root.style.setProperty("--move-y", `${(currentY * 14).toFixed(2)}px`);
      root.style.setProperty("--move-x-back", `${(-currentX * 12).toFixed(2)}px`);
      root.style.setProperty("--move-y-back", `${(-currentY * 10).toFixed(2)}px`);
      root.style.setProperty("--move-x-soft", `${(currentX * 7).toFixed(2)}px`);
      root.style.setProperty("--move-y-soft", `${(currentY * 5).toFixed(2)}px`);
      frame = window.requestAnimationFrame(paint);
    };

    const handlePointer = (event: PointerEvent) => {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleLeave = () => {
      pointerX = 0;
      pointerY = 0;
    };

    const handleScroll = () => {
      root.style.setProperty("--scroll-shift", `${(-window.scrollY * 0.035).toFixed(2)}px`);
    };

    window.addEventListener("pointermove", handlePointer, { passive: true });
    document.documentElement.addEventListener("mouseleave", handleLeave);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    frame = window.requestAnimationFrame(paint);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handlePointer);
      document.documentElement.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div ref={rootRef} className={className}>
      <div className={styles.depthWorld} aria-hidden="true">
        <div className={styles.depthGrid} />
        <div className={`${styles.depthOrb} ${styles.depthOrbOne}`} />
        <div className={`${styles.depthOrb} ${styles.depthOrbTwo}`} />
        <div className={styles.depthRing}><i /><i /><i /></div>
        <div className={styles.depthCube}>
          <i /><i /><i /><i /><i /><i />
        </div>
        <div className={`${styles.glassShard} ${styles.glassShardOne}`} />
        <div className={`${styles.glassShard} ${styles.glassShardTwo}`} />
      </div>
      {children}
    </div>
  );
}
