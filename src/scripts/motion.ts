const mobileBreakpoint = 768;
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

type Theme = 'light' | 'dark';
type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

function initTheme(): void {
  const root = document.documentElement;
  const toggle = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  const themeColor = document.querySelector<HTMLMetaElement>('[data-theme-color]');
  const veil = document.querySelector<HTMLElement>('[data-theme-veil]');
  if (!toggle) return;

  const updateTheme = (theme: Theme, persist = false): void => {
    root.dataset.theme = theme;
    const isDark = theme === 'dark';
    const label = isDark ? 'Включить светлую тему' : 'Включить тёмную тему';
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    if (themeColor) themeColor.content = isDark ? '#101216' : '#f3f4f5';
    if (persist) {
      try { localStorage.setItem('tsblv-theme', theme); } catch {}
    }
  };

  updateTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');

  toggle.addEventListener('click', () => {
    const nextTheme: Theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    if (reduceMotionQuery.matches) {
      updateTheme(nextTheme, true);
      return;
    }

    const transitionDocument = document as ViewTransitionDocument;
    if (transitionDocument.startViewTransition) {
      transitionDocument.startViewTransition(() => updateTheme(nextTheme, true));
      return;
    }

    if (!veil) {
      updateTheme(nextTheme, true);
      return;
    }

    veil.classList.add('is-active');
    window.setTimeout(() => updateTheme(nextTheme, true), 260);
    window.setTimeout(() => veil.classList.remove('is-active'), 330);
  });
}

function initHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  const button = document.querySelector<HTMLButtonElement>('[data-menu-button]');
  const menu = document.querySelector<HTMLElement>('[data-mobile-menu]');
  if (!header || !button || !menu) return;

  let closeTimer = 0;
  const setOpen = (open: boolean): void => {
    window.clearTimeout(closeTimer);
    button.setAttribute('aria-expanded', String(open));
    header.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);

    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
      return;
    }

    menu.classList.remove('is-open');
    closeTimer = window.setTimeout(() => {
      if (button.getAttribute('aria-expanded') === 'false') menu.hidden = true;
    }, 280);
  };

  const updateHeader = (): void => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };

  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || button.getAttribute('aria-expanded') !== 'true') return;
    setOpen(false);
    button.focus();
  });
  document.addEventListener('click', (event) => {
    if (button.getAttribute('aria-expanded') === 'true' && !header.contains(event.target as Node)) setOpen(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth >= mobileBreakpoint) setOpen(false);
  }, { passive: true });
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
}

function initHeroInteraction(): void {
  const viewport = document.querySelector<HTMLElement>('[data-hero-viewport]');
  const scene = document.querySelector<HTMLElement>('[data-hero-scene]');
  const lens = document.querySelector<HTMLElement>('[data-hero-lens]');
  const highlight = document.querySelector<HTMLElement>('[data-lens-highlight]');
  const orbitLayers = Array.from(document.querySelectorAll<HTMLElement>('[data-orbit-depth]'));
  const chips = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-service-chip]'));
  if (!viewport || !scene || !lens || !highlight) return;

  chips.forEach((chip) => chip.addEventListener('click', () => {
    chips.forEach((item) => item.classList.toggle('is-active', item === chip));
    const target = document.getElementById(chip.dataset.serviceChip ?? '');
    if (!target) return;
    window.setTimeout(() => {
      target.classList.add('is-highlighted');
      window.setTimeout(() => target.classList.remove('is-highlighted'), 1250);
    }, reduceMotionQuery.matches ? 0 : 420);
  }));

  if (reduceMotionQuery.matches || !finePointerQuery.matches) return;

  let frame = 0;
  let active = false;
  let visible = true;
  let pressed = false;
  let x = 0.5;
  let y = 0.5;

  const render = (): void => {
    frame = 0;
    const dx = active ? (x - 0.5) * 2 : 0;
    const dy = active ? (y - 0.5) * 2 : 0;
    scene.style.setProperty('--scene-x', `${(dx * 5).toFixed(2)}px`);
    scene.style.setProperty('--scene-y', `${(dy * 5).toFixed(2)}px`);
    scene.style.setProperty('--lens-shift-x', `${(dx * 10).toFixed(2)}px`);
    scene.style.setProperty('--lens-edge-x', `${(x * 100).toFixed(1)}%`);
    scene.style.setProperty('--lens-edge-y', `${(y * 100).toFixed(1)}%`);
    lens.style.setProperty('--lens-rotate-x', `${(-dy * 6.5).toFixed(2)}deg`);
    lens.style.setProperty('--lens-rotate-y', `${(dx * 7.5).toFixed(2)}deg`);
    lens.style.setProperty('--lens-scale', pressed ? '0.958' : active ? '1.022' : '1');
    lens.style.setProperty('--lens-edge-x', `${(x * 100).toFixed(1)}%`);
    lens.style.setProperty('--lens-edge-y', `${(y * 100).toFixed(1)}%`);
    highlight.style.setProperty('--highlight-x', `${(x * 100).toFixed(1)}%`);
    highlight.style.setProperty('--highlight-y', `${(y * 100).toFixed(1)}%`);
    orbitLayers.forEach((layer, index) => {
      const depth = (index + 1) * 2.5;
      layer.style.setProperty('--orbit-x', `${(dx * depth).toFixed(2)}px`);
      layer.style.setProperty('--orbit-y', `${(dy * depth).toFixed(2)}px`);
    });
    chips.forEach((chip, index) => {
      const depth = 1.5 + index * 0.7;
      chip.style.setProperty('--chip-x', `${(dx * depth).toFixed(2)}px`);
      chip.style.setProperty('--chip-y', `${(dy * depth).toFixed(2)}px`);
    });
  };

  const schedule = (): void => {
    if (visible && !frame) frame = requestAnimationFrame(render);
  };

  viewport.addEventListener('pointermove', (event) => {
    const rect = viewport.getBoundingClientRect();
    x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    active = true;
    schedule();
  }, { passive: true });
  viewport.addEventListener('pointerdown', () => {
    pressed = true;
    schedule();
  });
  viewport.addEventListener('pointerup', () => {
    pressed = false;
    schedule();
  });
  viewport.addEventListener('pointerleave', () => {
    active = false;
    pressed = false;
    x = 0.5;
    y = 0.5;
    schedule();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }, { threshold: 0.05 }).observe(viewport);
  }
}

function initCaseToggles(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-case-toggle]').forEach((button) => {
    const panel = button.parentElement?.querySelector<HTMLElement>('[data-case-panel]');
    if (!panel) return;
    button.classList.add('is-enhanced');
    panel.classList.add('is-collapsible');
    panel.classList.add('is-open');
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
    });
  });
}

function initPointerLights(): void {
  if (!finePointerQuery.matches || reduceMotionQuery.matches) return;
  document.querySelectorAll<HTMLElement>('[data-pointer-light]').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      element.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
      element.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
    }, { passive: true });
  });
}

function initProjectParallax(): void {
  if (!finePointerQuery.matches || reduceMotionQuery.matches) return;
  document.querySelectorAll<HTMLElement>('[data-project-scene]').forEach((scene) => {
    let frame = 0;
    let visible = true;
    let x = 0;
    let y = 0;
    let pointerX = 50;
    let pointerY = 50;
    const render = (): void => {
      frame = 0;
      scene.style.setProperty('--project-x', `${x.toFixed(2)}px`);
      scene.style.setProperty('--project-y', `${y.toFixed(2)}px`);
      scene.style.setProperty('--project-back-x', `${(-x * 0.35).toFixed(2)}px`);
      scene.style.setProperty('--project-back-y', `${(-y * 0.35).toFixed(2)}px`);
      scene.style.setProperty('--pointer-x', `${pointerX.toFixed(1)}%`);
      scene.style.setProperty('--pointer-y', `${pointerY.toFixed(1)}%`);
    };
    scene.addEventListener('pointermove', (event) => {
      if (!visible) return;
      const rect = scene.getBoundingClientRect();
      const localX = (event.clientX - rect.left) / rect.width;
      const localY = (event.clientY - rect.top) / rect.height;
      x = (localX - 0.5) * 10;
      y = (localY - 0.5) * 10;
      pointerX = localX * 100;
      pointerY = localY * 100;
      if (!frame) frame = requestAnimationFrame(render);
    }, { passive: true });
    scene.addEventListener('pointerleave', () => {
      x = 0;
      y = 0;
      pointerX = 50;
      pointerY = 50;
      if (!frame) frame = requestAnimationFrame(render);
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (!visible && frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      }, { threshold: 0.04 }).observe(scene);
    }
  });
}

function initFooterLight(): void {
  const stage = document.querySelector<HTMLElement>('[data-footer-light]');
  if (!stage || !finePointerQuery.matches || reduceMotionQuery.matches) return;

  let frame = 0;
  let visible = false;
  let x = 50;
  let y = 50;

  const render = (): void => {
    frame = 0;
    stage.style.setProperty('--footer-light-x', `${x.toFixed(1)}%`);
    stage.style.setProperty('--footer-light-y', `${y.toFixed(1)}%`);
  };

  stage.addEventListener('pointermove', (event) => {
    if (!visible) return;
    const rect = stage.getBoundingClientRect();
    x = ((event.clientX - rect.left) / rect.width) * 100;
    y = ((event.clientY - rect.top) / rect.height) * 100;
    if (!frame) frame = requestAnimationFrame(render);
  }, { passive: true });

  stage.addEventListener('pointerleave', () => {
    x = 50;
    y = 50;
    if (visible && !frame) frame = requestAnimationFrame(render);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }, { threshold: 0.04 }).observe(stage);
  }
}

function initSequences(): void {
  const sequences = Array.from(document.querySelectorAll<HTMLElement>('[data-sequence]'));
  if (reduceMotionQuery.matches || !('IntersectionObserver' in window)) {
    sequences.forEach((sequence) => sequence.classList.add('is-sequence-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-sequence-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  sequences.forEach((sequence) => observer.observe(sequence));
}

function initEntrances(): void {
  const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-motion]'));
  if (reduceMotionQuery.matches || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('motion-ready');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target as HTMLElement;
      element.classList.add('is-motion-visible');
      observer.unobserve(element);
    });
  }, { rootMargin: '0px 0px -7% 0px', threshold: 0.06 });

  elements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.94) {
      element.classList.add('is-motion-visible');
      return;
    }
    element.classList.add('is-motion-pending');
    const delay = Number(element.dataset.motionDelay ?? 0);
    if (delay > 0) element.style.transitionDelay = `${delay}ms`;
    observer.observe(element);
  });
}

export function initMotion(): void {
  initTheme();
  initHeader();
  initHeroInteraction();
  initCaseToggles();
  initPointerLights();
  initProjectParallax();
  initFooterLight();
  initSequences();
  initEntrances();
}
