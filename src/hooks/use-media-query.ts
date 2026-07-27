import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [value, setValue] = useState(false);

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = window.matchMedia(query);
    setValue(result.matches);

    try {
      result.addEventListener("change", onChange);
    } catch {
      result.addListener(onChange);
    }

    return () => {
      try {
        result.removeEventListener("change", onChange);
      } catch {
        result.removeListener(onChange);
      }
    };
  }, [query]);

  return value;
}
