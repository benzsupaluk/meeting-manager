import { useEffect, useRef } from "react";

/** Calls `onLoadMore` when the returned sentinel ref scrolls into view. */
export function useInfiniteScroll<T extends HTMLElement>(onLoadMore: () => void, enabled: boolean) {
  const ref = useRef<T>(null);
  const callback = useRef(onLoadMore);

  useEffect(() => {
    callback.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) callback.current();
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return ref;
}
