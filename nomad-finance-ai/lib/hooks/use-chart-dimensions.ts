"use client";

import { useRef, useState, useEffect, useCallback } from "react";

function readSize(el: HTMLDivElement) {
  const rect = el.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    return { width: Math.floor(rect.width), height: Math.floor(rect.height) };
  }
  return null;
}

export function useChartDimensions() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const setRef = useCallback((node: HTMLDivElement | null) => {
    ref.current = node;
    setElement(node);
  }, []);

  useEffect(() => {
    const el = element;
    if (!el) {
      setSize({ width: 0, height: 0 });
      return;
    }

    const applySize = (next: { width: number; height: number } | null) => {
      if (next) setSize(next);
    };

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    });
    ro.observe(el);

    // Re-measure after layout (chart div often mounts after data loads).
    let rafId: number;
    rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(() => {
        applySize(readSize(el));
      });
    });

    const timeoutId = window.setTimeout(() => {
      applySize(readSize(el));
    }, 150);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [element]);

  return { ref: setRef, ...size };
}
