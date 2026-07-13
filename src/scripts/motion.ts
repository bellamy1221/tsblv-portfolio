const mobileBreakpoint = 768;
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

type Theme = 'light' | 'dark';
type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

function observeVisibility(element: Element, update: (visible: boolean) => void): void {
  if (!('IntersectionObserver' in window)) {
    update(true);
    return;
  }

  new IntersectionObserver(([entry]) => update(entry.isIntersecting), { threshold: 0.04 }).observe(element);
}

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
    if (themeColor) themeColor.content = isDark ? '#17191d' : '#f2f1ed';
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
    window.setTimeout(() => updateTheme(nextTheme, true), 250);
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

function initHeroLens(): void {
  const viewport = document.querySelector<HTMLElement>('[data-hero-viewport]');
  const stage = document.querySelector<HTMLElement>('[data-hero-scene]');
  const lens = document.querySelector<HTMLElement>('[data-hero-lens]');
  const highlight = document.querySelector<HTMLElement>('[data-lens-highlight]');
  if (!viewport || !stage || !lens || !highlight || reduceMotionQuery.matches || !finePointerQuery.matches) return;

  let frame = 0;
  let visible = true;
  let active = false;
  let pressed = false;
  let x = 0.5;
  let y = 0.5;

  const render = (): void => {
    frame = 0;
    const dx = active ? (x - 0.5) * 2 : 0;
    const dy = active ? (y - 0.5) * 2 : 0;
    stage.style.setProperty('--lens-x', `${(dx * 92).toFixed(2)}px`);
    stage.style.setProperty('--lens-y', `${(dy * 42).toFixed(2)}px`);
    stage.style.setProperty('--lens-rx', `${(-dy * 5.5).toFixed(2)}deg`);
    stage.style.setProperty('--lens-ry', `${(dx * 6.5).toFixed(2)}deg`);
    stage.style.setProperty('--lens-scale', pressed ? '0.965' : active ? '1.012' : '1');
    stage.style.setProperty('--light-x', `${(x * 100).toFixed(1)}%`);
    stage.style.setProperty('--light-y', `${(y * 100).toFixed(1)}%`);
    highlight.style.setProperty('--highlight-x', `${(x * 100).toFixed(1)}%`);
    highlight.style.setProperty('--highlight-y', `${(y * 100).toFixed(1)}%`);
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
  viewport.addEventListener('pointerdown', () => { pressed = true; schedule(); });
  viewport.addEventListener('pointerup', () => { pressed = false; schedule(); });
  viewport.addEventListener('pointerleave', () => {
    active = false;
    pressed = false;
    x = 0.5;
    y = 0.5;
    schedule();
  });

  observeVisibility(viewport, (isVisible) => {
    visible = isVisible;
    if (!visible && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
}

function initCaseToggles(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-case-toggle]').forEach((button) => {
    const panel = button.parentElement?.querySelector<HTMLElement>('[data-case-panel]');
    if (!panel) return;
    panel.classList.add('is-collapsible');
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
    let frame = 0;
    let visible = true;
    let x = element.clientWidth / 2;
    let y = element.clientHeight / 2;

    const render = (): void => {
      frame = 0;
      element.style.setProperty('--pointer-x', `${x.toFixed(1)}px`);
      element.style.setProperty('--pointer-y', `${y.toFixed(1)}px`);
    };

    element.addEventListener('pointermove', (event) => {
      if (!visible) return;
      const rect = element.getBoundingClientRect();
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
      if (!frame) frame = requestAnimationFrame(render);
    }, { passive: true });

    observeVisibility(element, (isVisible) => {
      visible = isVisible;
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
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
      scene.style.setProperty('--project-front-x', `${(x * 1.2).toFixed(2)}px`);
      scene.style.setProperty('--project-front-y', `${(y * 1.2).toFixed(2)}px`);
      scene.style.setProperty('--project-back-x', `${(-x * 0.32).toFixed(2)}px`);
      scene.style.setProperty('--project-back-y', `${(-y * 0.32).toFixed(2)}px`);
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

    observeVisibility(scene, (isVisible) => {
      visible = isVisible;
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
  });
}

function initServices(): void {
  const root = document.querySelector<HTMLElement>('[data-services]');
  const stage = root?.querySelector<HTMLElement>('[data-service-stage]');
  const rows = Array.from(root?.querySelectorAll<HTMLElement>('[data-service-row]') ?? []);
  const triggers = Array.from(root?.querySelectorAll<HTMLButtonElement>('[data-service-trigger]') ?? []);
  const visuals = Array.from(root?.querySelectorAll<HTMLElement>('[data-service-visual]') ?? []);
  if (!root || !stage || rows.length === 0) return;

  let activeId = rows[0].dataset.serviceRow ?? 'service-sites';

  const placeStage = (): void => {
    if (window.innerWidth < mobileBreakpoint) {
      rows.find((row) => row.dataset.serviceRow === activeId)?.after(stage);
    } else {
      root.append(stage);
    }
  };

  const setActive = (id: string): void => {
    if (!rows.some((row) => row.dataset.serviceRow === id)) return;
    activeId = id;
    rows.forEach((row) => row.classList.toggle('is-active', row.dataset.serviceRow === id));
    triggers.forEach((trigger) => trigger.setAttribute('aria-pressed', String(trigger.dataset.serviceTrigger === id)));
    visuals.forEach((visual) => visual.classList.toggle('is-active', visual.dataset.serviceVisual === id));
    placeStage();
  };

  triggers.forEach((trigger) => {
    const id = trigger.dataset.serviceTrigger;
    if (!id) return;
    trigger.addEventListener('pointerenter', () => {
      if (finePointerQuery.matches) setActive(id);
    });
    trigger.addEventListener('focus', () => setActive(id));
    trigger.addEventListener('click', () => setActive(id));
  });

  document.querySelectorAll<HTMLAnchorElement>('[data-service-link]').forEach((link) => {
    link.addEventListener('click', () => {
      const id = link.dataset.serviceLink;
      if (id) setActive(id);
    });
  });

  window.addEventListener('resize', placeStage, { passive: true });
  setActive(activeId);
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

  observeVisibility(stage, (isVisible) => {
    visible = isVisible;
    if (!visible && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
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
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

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
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });

  elements.forEach((element) => {
    if (element.getBoundingClientRect().top < window.innerHeight * 0.94) {
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
  initHeroLens();
  initCaseToggles();
  initPointerLights();
  initProjectParallax();
  initServices();
  initFooterLight();
  initSequences();
  initEntrances();
}
