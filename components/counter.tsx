"use client";

import { useEffect, useState } from "react";

interface CounterProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
}

export function Counter({
  value,
  duration = 1000,
  formatter = (val) => val.toLocaleString("id-ID"),
}: CounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Ease-out quad formula untuk animasi halus
      const easeOut = 1 - (1 - progress) * (1 - progress);
      setCount(Math.floor(easeOut * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{formatter(count)}</span>;
}
