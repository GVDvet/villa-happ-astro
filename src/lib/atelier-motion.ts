/**
 * Villa Happ — Het Atelier: motion-engine
 *
 * Robuuste scroll-choreografie: Lenis voor soepel scrollen, GSAP
 * ScrollTrigger voor de gescrubde micro-interacties per station
 * (weefloep, verf-vulling, borduursteek, oplageteller). De visuals
 * kleven via CSS `position: sticky`, dus geen fragiele GSAP-pinning.
 *
 * prefers-reduced-motion of een fout => safe mode: alles staat statisch
 * en volledig zichtbaar (de CSS `.vh-no-motion` toont de eindstaat).
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function safeMode() {
  document.documentElement.classList.add('vh-no-motion');
  document.body.classList.add('vh-no-motion');
}

function initProgress() {
  const bar = document.querySelector<HTMLElement>('.atl-progress span');
  if (!bar) return;
  const update = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = `${h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0}%`;
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function initReveals() {
  const els = document.querySelectorAll<HTMLElement>('.atl-reveal');
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }),
    { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
  );
  els.forEach((el) => io.observe(el));
}

/** Koppelt de scroll-voortgang van één station aan een effect-callback. */
function scrubStation(selector: string, onProgress: (p: number) => void) {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return;
  ScrollTrigger.create({
    trigger: el,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => onProgress(self.progress),
  });
}

export function initAtelier() {
  // ?static = QA-modus: safe mode zonder Lenis (screenshots hangen niet op de RAF-lus)
  const staticQA = typeof location !== 'undefined' && /[?&](static|vh-static)\b/.test(location.search);
  if (prefersReducedMotion() || staticQA) { safeMode(); return; }

  try {
    initProgress();
    initReveals();

    // Soepel scrollen (RAF gekoppeld aan GSAP-ticker voor sync met ScrollTrigger)
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    // Station 1 — de stof: weefloep verschijnt, foto zoomt subtiel terug
    scrubStation('[data-station="stof"]', (p) => {
      const loupe = document.querySelector<HTMLElement>('.atl-loupe');
      const img = document.querySelector<HTMLElement>('.atl-weave img');
      if (loupe) loupe.style.opacity = String(Math.min(1, p * 1.6) * 0.55);
      if (img) img.style.transform = `scale(${1.15 - p * 0.12})`;
    });

    // Station 2 — de kleur: verf vult de stof van onder naar boven
    scrubStation('[data-station="kleur"]', (p) => {
      const fill = document.querySelector<HTMLElement>('.atl-dye-fill');
      if (fill) fill.style.height = `${Math.round(Math.min(1, p * 1.25) * 100)}%`;
    });

    // Station 3 — het borduursel: de steek trekt zich dicht, embleem fadet in
    const stitchMark = document.querySelector<HTMLElement>('.atl-stitch-mark');
    scrubStation('[data-station="borduursel"]', (p) => {
      document.querySelectorAll<SVGElement>('.atl-stitch-draw').forEach((path) => {
        (path as unknown as SVGPathElement).style.strokeDashoffset = String(Math.max(0, 1 - p * 1.15));
      });
      if (stitchMark) stitchMark.style.opacity = String(Math.max(0, Math.min(1, (p - 0.55) / 0.35)));
    });

    // Station 4 — de oplage: teller loopt op en de balk vult
    const editionNum = document.querySelector<HTMLElement>('.atl-edition-num');
    const editionBar = document.querySelector<HTMLElement>('.atl-edition-bar span');
    const edition = Number(editionNum?.dataset.edition || 500);
    scrubStation('[data-station="oplage"]', (p) => {
      const sold = Math.round(p * (edition - 48)); // eindigt op "nog 48 over"
      if (editionNum) editionNum.textContent = String(Math.max(0, edition - sold));
      if (editionBar) editionBar.style.width = `${Math.round(p * 90)}%`;
    });

    ScrollTrigger.refresh();
  } catch (err) {
    console.error('[atelier] motion faalde, safe mode:', err);
    safeMode();
  }
}
