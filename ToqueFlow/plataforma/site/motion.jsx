// motion.jsx — scroll-triggered reveals + animated counter

// Reveals [data-reveal] elements as they enter the viewport.
// Uses a scroll/resize listener with getBoundingClientRect — works everywhere,
// including sandboxed preview iframes where IntersectionObserver may not fire.
function initRevealObserver() {
  const reveal = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    document.querySelectorAll('[data-reveal]:not(.in)').forEach((el) => {
      // reveal once the element's top crosses the bottom ~90% of the viewport
      if (el.getBoundingClientRect().top < vh * 0.9) el.classList.add('in');
    });
  };
  reveal();
  if (!window.__revealBound) {
    window.__revealBound = true;
    const onScroll = () => requestAnimationFrame(reveal);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }
  window.__revealObs = true;
}

// Re-scan after each render in case new nodes mounted.
function useRevealMount() {
  React.useEffect(() => {
    const id = requestAnimationFrame(initRevealObserver);
    return () => cancelAnimationFrame(id);
  });
}

// ── Auto-boot ────────────────────────────────────────────────────────────
// Runs without each page having to call it. Re-scans several times to catch
// React/Babel async mounts, watches the DOM for new sections, and FAILS OPEN:
// if the observer never comes up, content is revealed instead of staying hidden.
function bootReveal() {
  if (window.__revealBooted) { initRevealObserver(); return; }
  window.__revealBooted = true;

  const run = () => { try { initRevealObserver(); } catch (e) {} };
  run();
  [60, 160, 320, 640, 1200].forEach((ms) => setTimeout(run, ms));

  if (window.MutationObserver) {
    const mo = new MutationObserver(() => {
      clearTimeout(window.__revealT);
      window.__revealT = setTimeout(run, 60);
    });
    if (document.body) mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 4500);
  }

  // Safety net: after things should have settled, guarantee nothing is stuck hidden.
  setTimeout(() => {
    if (!window.__revealObs || !('IntersectionObserver' in window)) {
      // Observer never came up → reveal everything (no animation, but visible).
      document.querySelectorAll('[data-reveal]:not(.in)').forEach((el) => el.classList.add('in'));
      return;
    }
    // Observer is up → reveal anything currently on-screen that got missed.
    document.querySelectorAll('[data-reveal]:not(.in)').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
    });
  }, 1800);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootReveal);
} else {
  bootReveal();
}

// Number counter that animates 0 → target once in view.
// Supports prefix/suffix; useful for "160%", "+26", "98%", "3×".
function Counter({ to, prefix = '', suffix = '', duration = 1400, decimals = 0 }) {
  const ref = React.useRef(null);
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      const start = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(to * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      obs.unobserve(e.target);
    }, { threshold: 0.35 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);
  return (
    <span ref={ref}>
      {prefix}{val.toFixed(decimals)}{suffix}
    </span>
  );
}

Object.assign(window, { useRevealMount, Counter, initRevealObserver });
