/**
 * Villa Happ — Homepage camera-flight engine
 *
 * Dynamische 2D camera die over een wereld vliegt en bij elke scene
 * stopt. Scenes worden absoluut gepositioneerd in een grote canvas;
 * de canvas wordt rondgepanned + gescaled via GSAP + ScrollTrigger.
 *
 * Inspiratie: poezabride.com — meer dynamische camera dan klassieke
 * verticale scroll.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

interface ScenePosition {
  x: number; // multiplier × viewport width
  y: number; // multiplier × viewport height
  scale?: number;
  rotation?: number; // graden — voor dynamische camera feel
}

const SCENE_POSITIONS: ScenePosition[] = [
  { x: 0,    y: 0,    scale: 1,    rotation: 0 },     // 1. Hero (start)
  { x: 1.8,  y: -0.6, scale: 1.05, rotation: -2 },    // 2. Origin (rechts boven)
  { x: 3.4,  y: 0.4,  scale: 1,    rotation: 1.5 },   // 3. Family (verder rechts)
  { x: 2.8,  y: 1.8,  scale: 1.1,  rotation: -1 },    // 4. Marketleader (zwarte brand wall)
  { x: 0.6,  y: 2.4,  scale: 1,    rotation: 2 },     // 5. Brand (terug naar links)
  { x: -1.2, y: 1.6,  scale: 1.05, rotation: -1.5 },  // 6. Europe (verder links)
  { x: -1.0, y: 3.4,  scale: 1.15, rotation: 0 },     // 7. Silence (intieme zoom)
  { x: 1.4,  y: 3.6,  scale: 1,    rotation: 1 },     // 8. Comeback
  { x: 3.0,  y: 4.4,  scale: 1.05, rotation: -1 },    // 9. Relaunch
];

const SCENE_LABELS = [
  'Home', 'Oorsprong', 'Familie', 'Groei',
  'Merk', 'Europa', 'Stilte', 'Comeback', 'Nu',
];

const SCENE_YEARS = [
  '', "'60", "'60s", "'70s & '80s",
  '1999', '2000+', '2008', '2021', '2024',
];

const FLIGHT_DUR = 1.6;   // tijd om naar volgende scene te 'vliegen'
const STAY_DUR = 1.0;     // tijd dat camera blijft hangen bij elke scene
const SCROLL_VH = 32;     // total scroll length per scene in viewport heights

let lenis: Lenis | null = null;
let mainTrigger: ScrollTrigger | null = null;

function isMobile() {
  return window.matchMedia('(max-width: 900px)').matches;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function enableSafeMode() {
  document.documentElement.classList.add('vh-no-motion');
  document.body.classList.add('vh-no-motion');
  document.querySelectorAll('.vh-scene').forEach(el => el.classList.add('is-active'));
}

function dismissLoading() {
  const loader = document.getElementById('vh-loading');
  if (!loader) return;
  loader.classList.add('is-done');
  setTimeout(() => loader.remove(), 600);
}

function initLenis() {
  if (typeof Lenis === 'undefined') return;
  lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 2,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function buildSceneNav(panelCount: number, scrollTriggerInstance: ScrollTrigger) {
  const nav = document.getElementById('vh-scene-nav');
  if (!nav) return [] as HTMLButtonElement[];
  nav.innerHTML = '';

  const dots: HTMLButtonElement[] = [];
  for (let i = 0; i < panelCount; i++) {
    const dot = document.createElement('button');
    dot.className = 'vh-scene-dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', SCENE_LABELS[i] || `Scene ${i + 1}`);
    dot.dataset.index = String(i);

    const label = document.createElement('span');
    label.className = 'vh-scene-dot-label';
    label.textContent = SCENE_LABELS[i] || '';
    if (SCENE_YEARS[i]) {
      const year = document.createElement('span');
      year.className = 'vh-scene-dot-year';
      year.textContent = SCENE_YEARS[i];
      label.appendChild(year);
    }
    dot.appendChild(label);

    dot.addEventListener('click', () => {
      const start = scrollTriggerInstance.start;
      const end = scrollTriggerInstance.end;
      const target = start + ((end - start) * i) / (panelCount - 1);
      if (lenis) lenis.scrollTo(target, { duration: 1.2 });
      else window.scrollTo({ top: target, behavior: 'smooth' });
    });

    nav.appendChild(dot);
    dots.push(dot);
  }
  return dots;
}

function updateProgress(progress: number) {
  const fill = document.querySelector('.vh-progress-fill') as HTMLElement | null;
  if (fill) fill.style.width = `${progress * 100}%`;
}

function applyItalicAccents() {
  document.querySelectorAll<HTMLElement>('[data-vh-italic]').forEach(el => {
    if (el.dataset.vhItalicized) return;
    const words = el.dataset.vhItalic!.split(',').map(w => w.trim()).filter(Boolean);
    if (!words.length) return;
    let html = el.innerHTML;
    words.forEach(word => {
      const safe = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(\\b${safe}\\b)`, 'gi');
      html = html.replace(re, '<em class="vh-italic">$1</em>');
    });
    el.innerHTML = html;
    el.dataset.vhItalicized = 'true';
  });
}

function animateCounter(el: HTMLElement) {
  const target = parseFloat(el.dataset.vhCounter || '0');
  const duration = parseInt(el.dataset.vhDuration || '1800', 10);
  let start: number | null = null;
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  function step(ts: number) {
    if (start === null) start = ts;
    const elapsed = ts - start;
    const progress = Math.min(elapsed / duration, 1);
    el.textContent = Math.round(target * ease(progress)).toString();
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function initCounters() {
  const counters = document.querySelectorAll<HTMLElement>('[data-vh-counter]');
  if (!counters.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  counters.forEach(c => observer.observe(c));
}

function initMagneticCTAs() {
  if (prefersReducedMotion()) return;
  if (!window.matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll<HTMLElement>('[data-vh-magnetic]').forEach(el => {
    const strength = parseFloat(el.dataset.vhMagnetic || '0.2');
    let bounds: DOMRect | null = null;
    const update = () => { bounds = el.getBoundingClientRect(); };
    el.addEventListener('mouseenter', update);
    el.addEventListener('mousemove', (e: MouseEvent) => {
      if (!bounds) update();
      const cx = bounds!.left + bounds!.width / 2;
      const cy = bounds!.top + bounds!.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    window.addEventListener('resize', update);
  });
}

function initCameraFlight() {
  if (isMobile()) {
    // Stack scenes naturally — geen camera flight op mobile.
    document.querySelectorAll('.vh-scene').forEach(el => el.classList.add('is-active'));
    return;
  }

  const canvas = document.querySelector<HTMLElement>('.vh-canvas');
  const homepage = document.querySelector<HTMLElement>('.vh-homepage');
  const panels = Array.from(document.querySelectorAll<HTMLElement>('.vh-scene'));

  if (!canvas || !homepage || panels.length === 0) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Bereken absolute scene positions
  const positions = SCENE_POSITIONS.slice(0, panels.length);
  let maxX = vw;
  let maxY = vh;
  let minY = 0;
  positions.forEach(p => {
    const px = p.x * vw;
    const py = p.y * vh;
    if (px + vw > maxX) maxX = px + vw;
    if (py + vh > maxY) maxY = py + vh;
    if (py < minY) minY = py;
  });
  const yOffset = Math.abs(minY);
  const canvasW = maxX;
  const canvasH = maxY + yOffset + vh;

  // Size canvas
  canvas.style.width = `${canvasW}px`;
  canvas.style.height = `${canvasH}px`;
  canvas.style.position = 'relative';

  // Position scenes
  panels.forEach((panel, i) => {
    const pos = positions[i] || positions[0];
    panel.style.position = 'absolute';
    panel.style.left = `${pos.x * vw}px`;
    panel.style.top = `${pos.y * vh + yOffset}px`;
    panel.style.width = `${vw}px`;
    panel.style.height = `${vh}px`;
  });

  // Initial canvas position so scene 1 is centered in viewport
  gsap.set(canvas, { x: 0, y: -yOffset, scale: positions[0].scale || 1, rotation: 0, force3D: true });

  // Build timeline — camera vliegt van scene naar scene
  const scrollLength = SCROLL_VH * vh * panels.length / 2;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: homepage,
      pin: true,
      scrub: 0.7,
      end: `+=${scrollLength}`,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        updateProgress(self.progress);
        // Highlight active scene dot
        const sceneIdx = Math.round(self.progress * (panels.length - 1));
        dots.forEach((d, i) => {
          d.classList.toggle('is-active', i === sceneIdx);
        });
        // Mark active scene for reveal animations
        panels.forEach((p, i) => {
          p.classList.toggle('is-active', i === sceneIdx);
        });
      },
    },
  });

  // Animate canvas through each scene
  positions.forEach((pos, i) => {
    if (i === 0) return; // start position already set
    tl.to(canvas, {
      x: -pos.x * vw,
      y: -(pos.y * vh + yOffset) + (vh / 2) - (vh / 2), // center on scene
      scale: pos.scale || 1,
      rotation: pos.rotation || 0,
      duration: FLIGHT_DUR,
      ease: 'power2.inOut',
    }).to({}, { duration: STAY_DUR }); // hold/stay
  });

  // Recalculate y-offset properly: scene top should be at viewport top
  // (rebuild scenes with proper centering)
  positions.forEach((pos, i) => {
    if (i === 0) return;
    const targetX = -pos.x * vw;
    const targetY = -(pos.y * vh + yOffset);
    tl.set(canvas, { x: targetX, y: targetY }, FLIGHT_DUR * i + STAY_DUR * (i - 1));
  });

  mainTrigger = tl.scrollTrigger!;
  const dots = buildSceneNav(panels.length, mainTrigger);

  // Mark first scene as active
  panels[0].classList.add('is-active');
}

function initHomepage() {
  // Force scroll to top
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

  applyItalicAccents();
  initCounters();
  initMagneticCTAs();

  if (prefersReducedMotion()) {
    enableSafeMode();
    dismissLoading();
    return;
  }

  initLenis();
  initCameraFlight();
  dismissLoading();

  setTimeout(() => ScrollTrigger.refresh(true), 300);
}

// Re-init on resize (debounced)
let resizeTimer: ReturnType<typeof setTimeout>;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    ScrollTrigger.refresh(true);
  }, 250);
});

// pageshow: handle bfcache
window.addEventListener('pageshow', (e) => {
  if (e.persisted) window.scrollTo(0, 0);
});

if (document.readyState === 'complete') {
  initHomepage();
} else {
  window.addEventListener('load', initHomepage);
}
