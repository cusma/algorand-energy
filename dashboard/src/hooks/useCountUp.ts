import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Easing function for smooth deceleration
 * Uses cubic ease-out curve: fast start, slow end
 */
const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

/**
 * Custom hook to animate a counter from 0 to a target value
 *
 * Features:
 * - Smooth 60fps animation using requestAnimationFrame
 * - Respects prefers-reduced-motion accessibility setting
 * - Automatic cleanup on unmount
 * - Ease-out cubic easing for natural feel
 *
 * @param end - Target value to count up to
 * @param duration - Animation duration in milliseconds (default: 2000)
 * @returns Current animated value
 *
 * @example
 * const animatedValue = useCountUp(1234, 2000);
 * // Value will animate from 0 to 1234 over 2 seconds
 */
export function useCountUp(end: number, duration: number = 2000): number {
  // Check if user prefers reduced motion (memoized to avoid re-checking)
  const prefersReducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // If reduced motion is preferred, return final value immediately
  const [value, setValue] = useState<number>(prefersReducedMotion ? end : 0);
  const frameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // If reduced motion is enabled, don't animate
    if (prefersReducedMotion) {
      return;
    }

    // Reset state for new animation
    startTimeRef.current = undefined;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      // Calculate progress (0 to 1)
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = easeOutCubic(progress);
      setValue(easedProgress * end);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration, prefersReducedMotion]);

  return value;
}
