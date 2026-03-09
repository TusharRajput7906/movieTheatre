import { useEffect, useRef } from 'react';

/**
 * Attaches an IntersectionObserver to a sentinel element.
 * Fires `onIntersect` when the sentinel enters the viewport.
 *
 * @param {() => void} onIntersect - called when sentinel is visible
 * @param {boolean}    enabled     - only observe while true (hasMore && !loading)
 * @returns {React.RefObject}       attach to the bottom sentinel <div>
 */
export function useInfiniteScroll(onIntersect, enabled) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onIntersect(); },
      { rootMargin: '400px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onIntersect, enabled]);

  return ref;
}
