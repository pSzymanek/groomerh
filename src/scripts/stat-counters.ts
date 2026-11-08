type Counter = {
  element: HTMLElement;
  output: HTMLElement;
  target: number;
  frame: number | null;
};

const DURATION = 1400;
const VISIBILITY = 0.35;

export function initStatCounters(root: Pick<Document, "querySelectorAll"> = document): () => void {
  const counters: Counter[] = [];
  root.querySelectorAll<HTMLElement>("[data-stat-counter]").forEach(element => {
    if (element.dataset.countState) return;
    const output = element.querySelector<HTMLElement>("[data-count-value]");
    const target = Number(element.dataset.countTarget);
    if (!output || !Number.isSafeInteger(target) || target <= 0 || target > 1000000) return;
    counters.push({ element, output, target, frame: null });
  });
  if (!counters.length) return () => {};

  const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  function finish(counter: Counter) {
    if (counter.frame !== null) cancelAnimationFrame(counter.frame);
    counter.frame = null;
    counter.output.textContent = String(counter.target);
    counter.element.dataset.countState = "done";
  }
  // Correct final values are already in the HTML, including without JavaScript.
  if (motion?.matches || typeof IntersectionObserver !== "function" || typeof requestAnimationFrame !== "function") {
    counters.forEach(finish);
    return () => {};
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.intersectionRatio < VISIBILITY) return;
      const counter = counters.find(item => item.element === entry.target);
      if (!counter || counter.element.dataset.countState !== "ready") return;
      counter.element.dataset.countState = "running";
      observer.unobserve(counter.element);
      let start: number | undefined;
      const tick = (time: number) => {
        start ??= time;
        const progress = Math.min(1, Math.max(0, (time - start) / DURATION));
        const eased = 1 - (1 - progress) ** 3;
        const value = Math.floor(counter.target * eased);
        if (counter.output.textContent !== String(value)) counter.output.textContent = String(value);
        if (progress === 1) finish(counter);
        else counter.frame = requestAnimationFrame(tick);
      };
      counter.frame = requestAnimationFrame(tick);
    });
  }, { threshold: VISIBILITY, rootMargin: "0px 0px -24px 0px" });

  counters.forEach(counter => {
    counter.output.textContent = "0";
    counter.element.dataset.countState = "ready";
    observer.observe(counter.element);
  });
  const finishAll = () => {
    observer.disconnect();
    counters.forEach(finish);
  };
  const motionChanged = () => { if (motion?.matches) finishAll(); };
  motion?.addEventListener("change", motionChanged);
  return () => {
    finishAll();
    motion?.removeEventListener("change", motionChanged);
  };
}
