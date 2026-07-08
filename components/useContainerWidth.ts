"use client";

import { useEffect, useRef, useState } from "react";

/** Live width of a container element, for title-fits-in-bar measurement. */
export function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

export const BAR_FONT = '"Instrument Sans", ui-sans-serif, system-ui, sans-serif';
