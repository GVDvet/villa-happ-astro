/**
 * Villa Happ — Cinematic motion engine
 *
 * - Lenis smooth scroll
 * - Loader fade
 * - Hero parallax + entrance
 * - Manifesto word-by-word fill on scroll
 * - Heritage horizontal pinned scroll (poezabride-style)
 * - Spotlight image parallax
 * - Scroll reveals
 * - Custom cursor follower (fctrylab-style)
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop = window.matchMedia('(min-width: 901px)').matches;
const hasHover = window.matchMedia('(hover: hover)').matches;

// Markeer reduced-motion zodat CSS de heritage-scroll vlak legt + loader verbergt
if (reduce) document.documentElement.classList.add('vh-reduced');

let lenis: Lenis | null = null;

/* ---------- Lenis ---------- */
function initLenis() {
  if (reduce) return;
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- Loader (jaarteller 1960 → 2026) ---------- */
function initLoader() {
  const loader = document.getElementById('vh-loader');
  const hero = document.getElementById('vh-hero');
  if (!loader) { hero?.classList.add('is-ready'); return; }
  const bar = loader.querySelector('.vh-loader-bar span') as HTMLElement | null;
  const yearEl = loader.querySelector('[data-loader-year]') as HTMLElement | null;

  function dismiss() {
    if (loader!.classList.contains('is-done')) return;
    if (bar) bar.style.width = '100%';
    if (yearEl) yearEl.textContent = '2026';
    loader!.classList.add('is-done');
    hero?.classList.add('is-ready');
    setTimeout(() => loader!.remove(), 600);
  }

  // Snel: vul progressbar + tik de jaren op; dismiss zodra pagina geladen is
  let p = 0;
  const iv = setInterval(() => {
    p = Math.min(95, p + 22);
    if (bar) bar.style.width = p + '%';
    if (yearEl) yearEl.textContent = String(1960 + Math.round((p / 95) * 66));
  }, 60);

  const finish = () => { clearInterval(iv); dismiss(); };
  if (document.readyState === 'complete') {
    setTimeout(finish, 250);
  } else {
    window.addEventListener('load', () => setTimeout(finish, 150));
    // Failsafe: nooit langer dan 0.9s blijven hangen
    setTimeout(finish, 900);
  }
}

/* ---------- Hero: cinematic pull-back naar archief-polaroid ---------- */
function initHeroCinema() {
  if (reduce) return;
  const hero = document.getElementById('vh-hero');
  if (!hero) return;
  const media = hero.querySelector('.vh-hero-media') as HTMLElement | null;
  const img = hero.querySelector('.vh-hero-media img') as HTMLElement | null;
  const stage = hero.querySelector('.vh-hero-stage') as HTMLElement | null;
  const chrome = hero.querySelector('.vh-hero-chrome') as HTMLElement | null;
  const scrim = hero.querySelector('.vh-hero-scrim') as HTMLElement | null;

  if (!isDesktop || !media || !stage) {
    // Mobiel: alleen subtiele parallax
    if (img) {
      gsap.fromTo(img, { yPercent: 0 }, {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      });
    }
    return;
  }

  gsap.set(media, { clipPath: 'inset(0% 0% 0% 0% round 0px)' });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      pin: true,
      scrub: 1,
      end: '+=130%',
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  tl.to(img, { yPercent: -8, ease: 'none', duration: 1 }, 0)
    .to('.vh-hero-inner', { opacity: 0, y: -60, duration: 0.22, ease: 'power1.in' }, 0)
    .to(['.vh-viewfinder', '.vh-seal', '.vh-hero-scroll-cue'], { opacity: 0, duration: 0.15 }, 0.04)
    .to(media, {
      clipPath: 'inset(15% 31% 23% 31% round 14px)',
      duration: 0.5,
      ease: 'power2.inOut',
    }, 0.22)
    .to(scrim, { opacity: 0, duration: 0.4 }, 0.22)
    .to(stage, { rotate: -3, duration: 0.5, ease: 'power2.inOut' }, 0.22)
    .to(hero, { backgroundColor: '#F4EEE3', duration: 0.35, ease: 'none' }, 0.3)
    .fromTo(chrome, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.52);
}

/* ---------- Manifesto word fill ---------- */
function initManifesto() {
  const text = document.querySelector('.vh-manifesto-text');
  if (!text) return;
  const words = text.querySelectorAll('.vh-word');
  if (reduce) {
    words.forEach((w) => w.classList.add('is-lit'));
    return;
  }
  ScrollTrigger.create({
    trigger: text,
    start: 'top 75%',
    end: 'bottom 55%',
    scrub: true,
    onUpdate: (self) => {
      const lit = Math.floor(self.progress * words.length);
      words.forEach((w, i) => w.classList.toggle('is-lit', i <= lit));
    },
  });
}

/* ---------- Heritage horizontal scroll ---------- */
function initHeritage() {
  if (reduce || !isDesktop) return;
  const section = document.querySelector('.vh-heritage');
  const track = document.querySelector('.vh-heritage-track') as HTMLElement | null;
  const progress = document.querySelector('.vh-heritage-progress span') as HTMLElement | null;
  if (!section || !track) return;

  const getScrollAmount = () => track.scrollWidth - window.innerWidth;

  const tween = gsap.to(track, {
    x: () => -getScrollAmount(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      pin: true,
      scrub: 1,
      end: () => '+=' + getScrollAmount(),
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (progress) progress.style.width = self.progress * 100 + '%';
      },
    },
  });

  // Subtle parallax on heritage images
  gsap.utils.toArray<HTMLElement>('.vh-heritage-media img').forEach((img) => {
    gsap.fromTo(img, { scale: 1.15 }, {
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: img.closest('.vh-heritage-panel'),
        containerAnimation: tween,
        start: 'left right',
        end: 'right left',
        scrub: true,
      },
    });
  });
}

/* ---------- Spotlight parallax ---------- */
function initSpotlight() {
  if (reduce) return;
  const img = document.querySelector('.vh-spotlight-media img');
  if (img) {
    gsap.fromTo(img, { yPercent: -6 }, {
      yPercent: 6,
      ease: 'none',
      scrollTrigger: { trigger: '.vh-spotlight', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
}

/* ---------- Kinetic wordmark horizontal scroll ---------- */
function initKinetic() {
  if (reduce) return;
  const row = document.querySelector('[data-kinetic-row]') as HTMLElement | null;
  if (!row) return;
  const overflow = row.scrollWidth - window.innerWidth;
  gsap.fromTo(row, { x: 0 }, {
    x: -overflow,
    ease: 'none',
    scrollTrigger: {
      trigger: '.vh-kinetic',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });
}

/* ---------- Yearmask: foto pant binnenin de letters ---------- */
function initYearMask() {
  const el = document.querySelector<HTMLElement>('[data-yearmask]');
  if (!el) return;
  if (reduce) { el.style.backgroundPosition = '50% 50%'; return; }
  gsap.fromTo(el, { backgroundPosition: '50% 18%' }, {
    backgroundPosition: '50% 82%',
    ease: 'none',
    scrollTrigger: { trigger: '.vh-yearmask', start: 'top bottom', end: 'bottom top', scrub: 1 },
  });
}

/* ---------- Filmstrip: sleepbaar + auto-drift + inertia ---------- */
function initFilmstrip() {
  const wrap = document.querySelector<HTMLElement>('.vh-film');
  const track = document.querySelector<HTMLElement>('[data-film-track]');
  if (!wrap || !track) return;
  if (reduce) return;

  const drift = -0.45;
  let x = 0;
  let vx = drift;
  let dragging = false;
  let lastX = 0;

  wrap.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    vx = 0;
    wrap.setPointerCapture(e.pointerId);
    wrap.classList.add('is-grabbing');
  });
  wrap.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    x += dx;
    vx = dx;
  });
  const release = () => { dragging = false; wrap.classList.remove('is-grabbing'); };
  wrap.addEventListener('pointerup', release);
  wrap.addEventListener('pointercancel', release);
  wrap.addEventListener('pointerleave', () => { if (dragging) release(); });

  function loop() {
    if (!dragging) {
      x += vx;
      vx += (drift - vx) * 0.035;
    }
    const half = track!.scrollWidth / 2;
    if (half > 0) {
      x = ((x % half) + half) % half;
      track!.style.transform = `translate3d(${x - half}px, 0, 0)`;
    }
    const skew = Math.max(-5, Math.min(5, vx * 0.32));
    track!.style.setProperty('--film-skew', skew.toFixed(2) + 'deg');
    requestAnimationFrame(loop);
  }
  loop();
}

/* ---------- Spin-stickers (scroll-driven rotatie) ---------- */
function initSpin() {
  if (reduce) return;
  document.querySelectorAll<HTMLElement>('[data-spin]').forEach((el) => {
    gsap.to(el, {
      rotation: 200,
      ease: 'none',
      scrollTrigger: {
        trigger: el.closest('section') || el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });
  });
}

/* ---------- Scroll reveals ---------- */
function initReveals() {
  const els = document.querySelectorAll('.vh-reveal, .vh-reveal-img');
  if (reduce) { els.forEach((el) => el.classList.add('is-visible')); return; }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); obs.unobserve(entry.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  els.forEach((el) => obs.observe(el));
}

/* ---------- Counters ---------- */
function initCounters() {
  const counters = document.querySelectorAll<HTMLElement>('[data-count]');
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target as HTMLElement;
      const target = parseInt(el.dataset.count || '0', 10);
      if (reduce) { el.textContent = String(target); obs.unobserve(el); return; }
      let start: number | null = null;
      const step = (ts: number) => {
        if (start === null) start = ts;
        const prog = Math.min((ts - start) / 1600, 1);
        el.textContent = String(Math.round(target * ease(prog)));
        if (prog < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach((c) => obs.observe(c));
}

/* ---------- Custom cursor ---------- */
function initCursor() {
  if (!hasHover) return;
  const cursor = document.createElement('div');
  cursor.className = 'vh-cursor';
  cursor.innerHTML = '<span class="vh-cursor-label">View</span>';
  document.body.appendChild(cursor);

  let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  let tx = cx, ty = cy;
  let active = false;

  window.addEventListener('mousemove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!active) { active = true; cursor.classList.add('is-active'); }
  });

  function render() {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(render);
  }
  render();

  const label = cursor.querySelector('.vh-cursor-label') as HTMLElement;
  const hoverTargets = document.querySelectorAll<HTMLElement>('a, button, .vh-shop-card-media, .vh-spotlight-media, .vh-film, [data-cursor]');
  hoverTargets.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      label.textContent = el.dataset.cursor || 'View';
      cursor.classList.add('is-hover');
    });
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
  });
}

/* ---------- Magnetic ---------- */
function initMagnetic() {
  if (reduce || !hasHover) return;
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    let b: DOMRect;
    el.addEventListener('mouseenter', () => { b = el.getBoundingClientRect(); });
    el.addEventListener('mousemove', (e) => {
      if (!b) b = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - (b.left + b.width / 2)) * 0.25}px, ${(e.clientY - (b.top + b.height / 2)) * 0.25}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

/* ---------- Countdown ---------- */
function initCountdown() {
  const el = document.querySelector<HTMLElement>('[data-countdown]');
  if (!el) return;
  const target = parseInt(el.dataset.countdown || '0', 10) * 1000;
  if (!target || target <= Date.now()) { el.style.display = 'none'; return; }
  const d = el.querySelector('[data-cd-days]') as HTMLElement;
  const h = el.querySelector('[data-cd-hours]') as HTMLElement;
  const m = el.querySelector('[data-cd-minutes]') as HTMLElement;
  const s = el.querySelector('[data-cd-seconds]') as HTMLElement;
  const pad = (n: number) => String(n).padStart(2, '0');
  const tick = () => {
    const diff = target - Date.now();
    if (diff <= 0) { el.style.display = 'none'; clearInterval(t); return; }
    if (d) d.textContent = pad(Math.floor(diff / 86400000));
    if (h) h.textContent = pad(Math.floor((diff % 86400000) / 3600000));
    if (m) m.textContent = pad(Math.floor((diff % 3600000) / 60000));
    if (s) s.textContent = pad(Math.floor((diff % 60000) / 1000));
  };
  tick();
  const t = setInterval(tick, 1000);
}

/* ---------- Scroll-velocity marquee (reactief skew) ---------- */
function initMarqueeVelocity() {
  if (reduce) return;
  const items = gsap.utils.toArray<HTMLElement>('.vh-marquee-item');
  if (!items.length) return;
  let skew = 0;
  let target = 0;
  if (lenis) {
    lenis.on('scroll', ({ velocity }: { velocity: number }) => {
      target = Math.max(-10, Math.min(10, velocity * 0.5));
    });
  } else {
    let last = window.scrollY;
    window.addEventListener('scroll', () => {
      const v = window.scrollY - last; last = window.scrollY;
      target = Math.max(-10, Math.min(10, v * 0.3));
    }, { passive: true });
  }
  function loop() {
    skew += (target - skew) * 0.1;
    target *= 0.9;
    items.forEach((i) => { i.style.transform = `skewX(${skew}deg)`; });
    requestAnimationFrame(loop);
  }
  loop();
}

/* ---------- 3D tilt op productcards ---------- */
function initTilt() {
  if (reduce || !hasHover) return;
  document.querySelectorAll<HTMLElement>('.vh-shop-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(1400px) rotateY(${px * 5}deg) rotateX(${-py * 5}deg) translateZ(8px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

/* ---------- Hero title skew op scroll-velocity ---------- */
function initHeroSkew() {
  if (reduce) return;
  const title = document.querySelector('.vh-hero-title') as HTMLElement | null;
  if (!title || !lenis) return;
  let cur = 0, tgt = 0;
  lenis.on('scroll', ({ velocity }: { velocity: number }) => {
    tgt = Math.max(-4, Math.min(4, velocity * 0.15));
  });
  function loop() {
    cur += (tgt - cur) * 0.1; tgt *= 0.9;
    title!.style.transform = `skewY(${cur * 0.3}deg)`;
    requestAnimationFrame(loop);
  }
  loop();
}

function init() {
  initLenis();
  initLoader();
  initReveals();
  initCounters();
  initCountdown();
  initHeroCinema();
  initManifesto();
  initHeritage();
  initSpotlight();
  initYearMask();
  initKinetic();
  initFilmstrip();
  initSpin();
  initCursor();
  initMagnetic();
  initMarqueeVelocity();
  initTilt();
  initHeroSkew();
  // Refresh after fonts/images settle
  window.addEventListener('load', () => setTimeout(() => ScrollTrigger.refresh(), 200));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
