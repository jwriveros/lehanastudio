"use client";

import { useEffect } from "react";

export function VhFixer() {
  useEffect(() => {
    const setVh = () => {
      // Calculate 1% of the viewport height (excluding browser UI)
      const vh = window.innerHeight * 0.01;
      // Set the CSS custom property --vh on the document root
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Set initially
    setVh();

    // Re-calculate on resize (e.g., when browser UI changes or device orientation changes)
    window.addEventListener("resize", setVh);

    // Cleanup event listener on component unmount
    return () => window.removeEventListener("resize", setVh);
  }, []);

  return null; // This component doesn't render anything visible
}
