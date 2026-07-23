import { useEffect, useState } from "react";

/**
 * Simulates network latency for skeleton/loading states.
 * Backend integration: replace call sites with real query loading flags.
 */
export function useSimulatedLoading(ms = 700, deps: unknown[] = []) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return loading;
}
