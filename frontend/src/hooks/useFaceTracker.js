import { useRef, useCallback } from "react";

export function useFaceTracker() {
  const smoothedBoxRef = useRef(null);

  const getSmoothedBox = useCallback((rawBox, isDetected, smoothingFactor = 0.35) => {
    if (!isDetected || !rawBox || rawBox.w <= 0) {
      smoothedBoxRef.current = null;
      return null;
    }

    if (!smoothedBoxRef.current) {
      smoothedBoxRef.current = { ...rawBox };
    } else {
      smoothedBoxRef.current.x += (rawBox.x - smoothedBoxRef.current.x) * smoothingFactor;
      smoothedBoxRef.current.y += (rawBox.y - smoothedBoxRef.current.y) * smoothingFactor;
      smoothedBoxRef.current.w += (rawBox.w - smoothedBoxRef.current.w) * smoothingFactor;
      smoothedBoxRef.current.h += (rawBox.h - smoothedBoxRef.current.h) * smoothingFactor;
    }

    return smoothedBoxRef.current;
  }, []);

  return { getSmoothedBox };
}
