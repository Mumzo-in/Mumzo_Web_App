import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

/** Smooth-scrolls to the element matching the current route's hash, once per hash change. */
export function useScrollToHash() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);
}
