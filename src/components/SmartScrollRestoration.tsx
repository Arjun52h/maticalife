import { useLayoutEffect, useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Keep scroll positions per pathname+search
const scrollPositions = new Map<string, number>();

export default function SmartScrollRestoration() {
  const location = useLocation();
  const navType = useNavigationType(); // POP = back/forward, PUSH = new page
  const key = location.pathname + location.search;

  // Save scroll on unmount
  useEffect(() => {
    return () => {
      scrollPositions.set(key, window.scrollY);
    };
  }, [key]);

  // Restore scroll after DOM updates
  useLayoutEffect(() => {
    const saved = scrollPositions.get(key);

    if (navType === "POP" && saved !== undefined) {
      // Try to restore scroll until it sticks or max tries reached
      let tries = 0;
      const maxTries = 20;

      const restore = () => {
        tries++;

        // Scroll to saved position
        window.scrollTo(0, saved);

        // Check if scroll stuck
        if (Math.abs(window.scrollY - saved) > 2 && tries < maxTries) {
          requestAnimationFrame(restore);
        }
      };

      requestAnimationFrame(restore);
      return;
    }

    // For new navigation, scroll top
    window.scrollTo(0, 0);
  }, [key, navType]);

  return null;
}
