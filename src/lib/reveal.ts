/**
 * Villa Happ — Scroll reveals + interacties
 *
 * - IntersectionObserver voor .vh-reveal + .vh-reveal-img
 * - Magnetic buttons ([data-magnetic])
 * - Hero load animatie
 * - Stat counters
 * - Lenis smooth scroll
 */

import Lenis from 'lenis';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Smooth scroll ---------- */
function initLenis() {
  if (reduceMotion) return;
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  function raf(time: number) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

/* ---------- Scroll reveals ---------- */
function initReveals() {
  const els = document.querySelectorAll('.vh-reveal, .vh-reveal-img');
  if (reduceMotion) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  els.forEach((el) => obs.observe(el));
}

/* ---------- Hero load ---------- */
function initHero() {
  const hero = document.getElementById('vh-hero');
  if (hero) {
    requestAnimationFrame(() => {
      setTimeout(() => hero.classList.add('is-loaded'), 100);
    });
  }
}

/* ---------- Magnetic buttons ---------- */
function initMagnetic() {
  if (reduceMotion || !window.matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    let bounds: DOMRect;
    el.addEventListener('mouseenter', () => { bounds = el.getBoundingClientRect(); });
    el.addEventListener('mousemove', (e) => {
      if (!bounds) bounds = el.getBoundingClientRect();
      const dx = (e.clientX - (bounds.left + bounds.width / 2)) * 0.25;
      const dy = (e.clientY - (bounds.top + bounds.height / 2)) * 0.25;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

/* ---------- Init ---------- */
function init() {
  initLenis();
  initReveals();
  initHero();
  initMagnetic();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
