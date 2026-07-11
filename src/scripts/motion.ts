/**
 * TSBLV motion system — vanilla TypeScript, no dependencies.
 */

const MOBILE_MAX = 767;
const DESKTOP_INTERACTIVE_MIN = 901;
const PARALLAX_MAX = { desktop: 18, tablet: 10 };

type MotionContext = {
  reduced: boolean;
  mobile: boolean;
  finePointer: boolean;
  canHover: boolean;
  desktopInteractive: boolean;
};

let ctx: MotionContext;
let revealObserver: IntersectionObserver | null = null;
let parallaxElements: HTMLElement[] = [];
let parallaxTicking = false;
let parallaxActive = false;

function getContext(): MotionContext {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.innerWidth <= MOBILE_MAX;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const canHover = window.matchMedia('(hover: hover)').matches;

  return {
    reduced,
    mobile,
    finePointer,
    canHover,
    desktopInteractive: !reduced && !mobile && finePointer && canHover && window.innerWidth > DESKTOP_INTERACTIVE_MIN,
  };
}

function applyContextClasses(): void {
  document.documentElement.classList.toggle('motion-reduced', ctx.reduced);
  document.documentElement.classList.toggle('motion-mobile', ctx.mobile);
}

function parseDelay(el: Element, attr: string, fallback = 0): number {
  const value = el.getAttribute(attr);
  return value ? Number.parseInt(value, 10) || fallback : fallback;
}

function getStaggerChildren(group: Element): HTMLElement[] {
  return Array.from(group.children).flatMap((child) => {
    if (child instanceof HTMLElement && child.hasAttribute('data-reveal')) {
      return [child];
    }

    const nested = child.querySelector<HTMLElement>('[data-reveal]');
    return nested ? [nested] : [];
  });
}

function revealStaggerGroup(group: Element): void {
  const staggerDelay = parseDelay(group, 'data-stagger-delay', 70);
  const children = getStaggerChildren(group);

  children.forEach((child, index) => {
    if (ctx.reduced) {
      child.classList.add('is-visible');
      return;
    }

    window.setTimeout(() => {
      child.classList.add('is-visible');
      child.querySelector('[data-line-reveal]')?.classList.add('is-visible');
    }, index * staggerDelay);
  });

  group.classList.add('is-visible');
}

function initRevealAnimations(): void {
  const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');

  elements.forEach((el) => {
    const delay = parseDelay(el, 'data-delay');
    const duration = parseDelay(el, 'data-duration', 0);

    if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`);
    if (duration) el.style.setProperty('--reveal-duration', `${duration}ms`);
  });

  if (ctx.reduced) {
    elements.forEach((el) => el.classList.add('is-visible'));
    document.querySelectorAll('[data-line-reveal]').forEach((el) => el.classList.add('is-visible'));
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const target = entry.target;

        if (target.hasAttribute('data-stagger')) {
          revealStaggerGroup(target);
        } else {
          target.classList.add('is-visible');
        }

        revealObserver?.unobserve(target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );

  document.querySelectorAll('[data-stagger]').forEach((group) => {
    revealObserver?.observe(group);
  });

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    if (el.closest('.hero')) return;
    if (el.closest('[data-stagger]')) return;
    revealObserver?.observe(el);
  });

  document.querySelectorAll('[data-line-reveal]').forEach((el) => {
    revealObserver?.observe(el);
  });
}

function initStaggerGroups(): void {
  document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((group) => {
    const staggerDelay = parseDelay(group, 'data-stagger-delay', 70);
    getStaggerChildren(group).forEach((child, index) => {
      child.style.setProperty('--stagger-delay', `${index * staggerDelay}ms`);
    });
  });
}

function initHeroSequence(): void {
  const hero = document.querySelector('.hero');
  if (!hero || ctx.reduced) {
    hero?.querySelectorAll('[data-hero-item], [data-hero-line], .hero-visual-wrap').forEach((el) => {
      el.classList.add('is-visible');
    });
    return;
  }

  const baseDelay = ctx.mobile ? 40 : 60;
  const lineStagger = ctx.mobile ? 55 : 90;

  const sequence: Array<{ selector: string; delay: number; isLine?: boolean }> = [
    { selector: '[data-hero-item="eyebrow"]', delay: 0 },
    { selector: '[data-hero-line="1"]', delay: baseDelay, isLine: true },
    { selector: '[data-hero-line="2"]', delay: baseDelay + lineStagger, isLine: true },
    { selector: '[data-hero-line="3"]', delay: baseDelay + lineStagger * 2, isLine: true },
    { selector: '[data-hero-item="lead"]', delay: baseDelay + lineStagger * 3 + 40 },
    { selector: '[data-hero-item="actions"]', delay: baseDelay + lineStagger * 3 + 120 },
    { selector: '[data-hero-item="brand"]', delay: baseDelay + lineStagger * 3 + 200 },
    { selector: '.hero-visual-wrap', delay: baseDelay + lineStagger * 2 + 80 },
  ];

  document.documentElement.classList.add('hero-sequenced');

  sequence.forEach(({ selector, delay, isLine }) => {
    const el = hero.querySelector(selector);
    if (!el) return;

    window.setTimeout(() => {
      el.classList.add('is-visible');

      if (isLine) {
        (el as HTMLElement).style.setProperty('--hero-line-delay', '0ms');
      }
    }, delay);
  });

  const fullBrand = hero.querySelector('.brand-mark--motion-full');
  if (fullBrand) {
    window.setTimeout(() => {
      fullBrand.classList.add('is-visible');
      fullBrand.querySelectorAll('[data-brand-part]').forEach((part) => {
        part.classList.add('is-visible');
      });
    }, baseDelay + lineStagger * 3 + 200);
  }
}

function initBrandMarkParts(): void {
  document.querySelectorAll('.brand-mark--motion-full').forEach((mark) => {
    const delays: Record<string, number> = {
      wordmark: 0,
      divider: 120,
      symbol: 220,
      caption: 300,
    };

    mark.querySelectorAll<HTMLElement>('[data-brand-part]').forEach((part) => {
      const key = part.getAttribute('data-brand-part') ?? '';
      const index = part.dataset.captionIndex ? Number(part.dataset.captionIndex) : 0;
      const base = delays[key] ?? 0;
      part.style.setProperty('--brand-part-delay', `${base + index * 60}ms`);
    });
  });
}

function initPointerLight(): void {
  if (!ctx.desktopInteractive) return;

  const visual = document.querySelector<HTMLElement>('.hero-visual[data-pointer-light]');
  if (!visual) return;

  const overlay = visual.querySelector<HTMLElement>('.pointer-light');
  if (!overlay) return;

  visual.classList.add('has-pointer-light');

  let targetX = 88;
  let targetY = 8;
  let currentX = targetX;
  let currentY = targetY;
  let rafId = 0;
  let inside = false;

  const update = (): void => {
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;
    visual.style.setProperty('--pointer-x', `${currentX}%`);
    visual.style.setProperty('--pointer-y', `${currentY}%`);
    rafId = 0;

    if (inside || Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
      rafId = requestAnimationFrame(update);
    }
  };

  const schedule = (): void => {
    if (!rafId) rafId = requestAnimationFrame(update);
  };

  visual.addEventListener(
    'pointermove',
    (event) => {
      const rect = visual.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 100;
      const ny = ((event.clientY - rect.top) / rect.height) * 100;
      targetX = 88 + (nx - 88) * 0.07;
      targetY = 8 + (ny - 8) * 0.07;
      schedule();
    },
    { passive: true },
  );

  visual.addEventListener('pointerenter', () => {
    inside = true;
    schedule();
  });

  visual.addEventListener('pointerleave', () => {
    inside = false;
    targetX = 88;
    targetY = 8;
    schedule();
  });
}

function initTiltElements(): void {
  if (!ctx.desktopInteractive) return;

  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    const maxRotateX = 1;
    const maxRotateY = 1.5;
    const maxTranslate = 3;

    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;

      el.classList.add('is-tilting');
      el.style.setProperty('--tilt-x', `${-py * maxRotateX}deg`);
      el.style.setProperty('--tilt-y', `${px * maxRotateY}deg`);
      el.style.setProperty('--tilt-tx', `${px * maxTranslate}px`);
      el.style.setProperty('--tilt-ty', `${py * maxTranslate}px`);
    });

    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-tilting');
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
      el.style.setProperty('--tilt-tx', '0px');
      el.style.setProperty('--tilt-ty', '0px');
    });
  });
}

function initMagneticElements(): void {
  if (!ctx.desktopInteractive) return;

  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const inner = el.querySelector<HTMLElement>('.magnetic-inner') ?? el;
    const maxMove = 5;
    const maxInner = 2;

    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;

      el.style.transform = `translate(${px * maxMove}px, ${py * maxMove}px)`;
      inner.style.transform = `translate(${px * maxInner}px, ${py * maxInner}px)`;
      el.style.willChange = 'transform';
    });

    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
      inner.style.transform = '';
      el.style.willChange = '';
    });
  });
}

function updateParallax(): void {
  parallaxTicking = false;

  const viewportHeight = window.innerHeight;
  const maxOffset = ctx.mobile ? 0 : window.innerWidth >= 901 ? PARALLAX_MAX.desktop : PARALLAX_MAX.tablet;

  if (maxOffset === 0) return;

  parallaxElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > viewportHeight) return;

    const factor = Number.parseFloat(el.getAttribute('data-parallax') ?? '0.05');
    const centerOffset = (rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight;
    const shift = Math.max(-maxOffset, Math.min(maxOffset, centerOffset * factor * viewportHeight * 0.35));

    el.style.transform = `translate3d(0, ${shift}px, 0)`;
  });
}

function initParallaxElements(): void {
  if (ctx.reduced || ctx.mobile) return;

  parallaxElements = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
  if (parallaxElements.length === 0) return;

  const onScroll = (): void => {
    if (!parallaxTicking) {
      parallaxTicking = true;
      requestAnimationFrame(updateParallax);
    }
  };

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      parallaxActive = entries.some((e) => e.isIntersecting);
      if (parallaxActive) onScroll();
    },
    { threshold: 0, rootMargin: '20% 0px' },
  );

  parallaxElements.forEach((el) => {
    const section = el.closest('section') ?? el;
    sectionObserver.observe(section);
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initProseBlocks(): void {
  document.querySelectorAll<HTMLElement>('.prose[data-stagger]').forEach((prose) => {
    Array.from(prose.children).forEach((child) => {
      if (!child.hasAttribute('data-reveal')) {
        child.setAttribute('data-reveal', 'up');
      }
    });
  });
}

function initMagneticButtons(): void {
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((btn) => {
    if (!btn.querySelector('.magnetic-inner')) {
      const label = btn.innerHTML;
      btn.innerHTML = `<span class="magnetic-inner">${label}</span>`;
    }
  });
}

function failSafeReveal(): void {
  document.querySelectorAll('[data-reveal], [data-hero-item], [data-hero-line], [data-line-reveal], [data-brand-part], .hero-visual-wrap').forEach((el) => {
    el.classList.add('is-visible');
  });
}

export function initMotion(): void {
  try {
    ctx = getContext();
    applyContextClasses();
    document.documentElement.classList.add('motion-ready');

    initMagneticButtons();
    initBrandMarkParts();
    initProseBlocks();
    initStaggerGroups();
    initHeroSequence();
    initRevealAnimations();
    initPointerLight();
    initTiltElements();
    initMagneticElements();
    initParallaxElements();
  } catch {
    failSafeReveal();
    document.documentElement.classList.add('motion-ready');
  }
}

if (typeof document !== 'undefined') {
  const boot = (): void => initMotion();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}
