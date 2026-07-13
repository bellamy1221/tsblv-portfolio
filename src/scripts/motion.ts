const mobileBreakpoint = 768;
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

let pointerFrame = 0;
let pointerOwner: Element | null = null;
let pointerWork: (() => void) | null = null;

function schedulePointer(owner: Element, work: () => void): void {
  pointerOwner = owner;
  pointerWork = work;
  if (pointerFrame) return;
  pointerFrame = requestAnimationFrame(() => {
    pointerFrame = 0;
    const nextWork = pointerWork;
    pointerWork = null;
    nextWork?.();
  });
}

function cancelPointer(owner: Element): void {
  if (pointerOwner !== owner) return;
  if (pointerFrame) cancelAnimationFrame(pointerFrame);
  pointerFrame = 0;
  pointerOwner = null;
  pointerWork = null;
}

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

function initPointerLights(): void {
  if (!finePointerQuery.matches || reduceMotionQuery.matches) return;

  document.querySelectorAll<HTMLElement>('[data-pointer-light]').forEach((element) => {
    let visible = true;
    let x = element.clientWidth / 2;
    let y = element.clientHeight / 2;

    const render = (): void => {
      element.style.setProperty('--pointer-x', `${x.toFixed(1)}px`);
      element.style.setProperty('--pointer-y', `${y.toFixed(1)}px`);
    };

    element.addEventListener('pointermove', (event) => {
      if (!visible) return;
      const rect = element.getBoundingClientRect();
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
      schedulePointer(element, render);
    }, { passive: true });

    observeVisibility(element, (isVisible) => {
      visible = isVisible;
      if (!visible) cancelPointer(element);
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

function initWorkBrowser(): void {
  const root = document.querySelector<HTMLElement>('[data-work-browser]');
  const rows = Array.from(root?.querySelectorAll<HTMLElement>('[data-work-row]') ?? []);
  const triggers = Array.from(root?.querySelectorAll<HTMLButtonElement>('[data-work-trigger]') ?? []);
  const files = Array.from(root?.querySelectorAll<HTMLElement>('[data-work-file]') ?? []);
  if (!root || rows.length === 0 || triggers.length === 0 || files.length === 0) return;

  const setActive = (id: string): void => {
    if (!rows.some((row) => row.dataset.workRow === id)) return;
    rows.forEach((row) => row.classList.toggle('is-active', row.dataset.workRow === id));
    triggers.forEach((trigger) => trigger.setAttribute('aria-expanded', String(trigger.dataset.workTrigger === id)));
    files.forEach((file) => {
      const active = file.dataset.workFile === id;
      file.classList.toggle('is-active', active);
      file.setAttribute('aria-hidden', String(!active));
    });
  };

  triggers.forEach((trigger) => {
    const id = trigger.dataset.workTrigger;
    if (!id) return;
    trigger.addEventListener('pointerenter', () => {
      if (finePointerQuery.matches) setActive(id);
    });
    trigger.addEventListener('focus', () => setActive(id));
    trigger.addEventListener('click', () => setActive(id));
  });

  if ('IntersectionObserver' in window && !reduceMotionQuery.matches) {
    const observer = new IntersectionObserver((entries) => {
      const activeEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top - window.innerHeight * 0.45) - Math.abs(b.boundingClientRect.top - window.innerHeight * 0.45))[0];
      const id = (activeEntry?.target as HTMLElement | undefined)?.dataset.workRow;
      if (id) setActive(id);
    }, { rootMargin: '-28% 0px -45% 0px', threshold: 0.01 });
    rows.forEach((row) => observer.observe(row));
  }

  root.classList.add('is-enhanced');
  setActive(rows[0].dataset.workRow ?? '01');
}

function initPortfolioFolder(): void {
  const root = document.querySelector<HTMLElement>('[data-portfolio-folder]');
  const trigger = root?.querySelector<HTMLButtonElement>('[data-folder-toggle]');
  const workBrowser = document.querySelector<HTMLElement>('[data-work-browser]');
  if (!root || !trigger) return;

  const setOpen = (open: boolean): void => {
    root.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', String(open));
    trigger.setAttribute('aria-label', open ? 'Перейти к примерам работ' : 'Открыть папку портфолио');
  };

  trigger.addEventListener('click', () => {
    const wasOpen = root.classList.contains('is-open');
    setOpen(true);
    if (workBrowser) window.setTimeout(() => workBrowser.scrollIntoView({ behavior: reduceMotionQuery.matches ? 'auto' : 'smooth', block: 'start' }), wasOpen ? 0 : 520);
  });

  if ('IntersectionObserver' in window && !reduceMotionQuery.matches) {
    new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) return;
      setOpen(true);
      observer.disconnect();
    }, { threshold: 0.62 }).observe(root);
  }
}

function initProcessJourney(): void {
  const root = document.querySelector<HTMLElement>('[data-process-journey]');
  const steps = Array.from(root?.querySelectorAll<HTMLElement>('[data-process-step]') ?? []);
  if (!root || steps.length === 0) return;

  const setActive = (id: string): void => {
    steps.forEach((step) => step.classList.toggle('is-active', step.dataset.processStep === id));
  };

  steps.forEach((step) => {
    const id = step.dataset.processStep;
    if (!id) return;
    step.addEventListener('pointerenter', () => {
      if (finePointerQuery.matches) setActive(id);
    });
    step.addEventListener('focus', () => setActive(id));
  });

  if ('IntersectionObserver' in window && !reduceMotionQuery.matches) {
    const stepObserver = new IntersectionObserver((entries) => {
      const activeEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top - window.innerHeight * 0.42) - Math.abs(b.boundingClientRect.top - window.innerHeight * 0.42))[0];
      const id = (activeEntry?.target as HTMLElement | undefined)?.dataset.processStep;
      if (id) setActive(id);
    }, { rootMargin: '-28% 0px -42% 0px', threshold: 0.01 });
    steps.forEach((step) => stepObserver.observe(step));

    let visible = false;
    let frame = 0;
    const renderTitle = (): void => {
      frame = 0;
      if (!visible) return;
      const rect = root.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
      root.style.setProperty('--journey-title-x', `${((0.5 - progress) * 10).toFixed(2)}vw`);
    };
    const scheduleTitle = (): void => {
      if (!frame) frame = requestAnimationFrame(renderTitle);
    };
    observeVisibility(root, (isVisible) => {
      visible = isVisible;
      if (visible) scheduleTitle();
    });
    window.addEventListener('scroll', scheduleTitle, { passive: true });
    window.addEventListener('resize', scheduleTitle, { passive: true });
  }
}

function initFooterLight(): void {
  const stage = document.querySelector<HTMLElement>('[data-footer-light]');
  if (!stage || !finePointerQuery.matches || reduceMotionQuery.matches) return;

  let visible = false;
  let x = 50;
  let y = 50;

  const render = (): void => {
    const dx = (x - 50) / 50;
    const dy = (y - 50) / 50;
    stage.style.setProperty('--footer-light-x', `${x.toFixed(1)}%`);
    stage.style.setProperty('--footer-light-y', `${y.toFixed(1)}%`);
    stage.style.setProperty('--footer-shadow-x', `${(-dx * 2.6).toFixed(2)}px`);
    stage.style.setProperty('--footer-shadow-y', `${(2.6 - dy * 1.6).toFixed(2)}px`);
    stage.style.setProperty('--footer-grain-x', `${(dx * 2).toFixed(2)}px`);
    stage.style.setProperty('--footer-grain-y', `${(dy * 2).toFixed(2)}px`);
  };

  stage.addEventListener('pointermove', (event) => {
    if (!visible) return;
    const rect = stage.getBoundingClientRect();
    x = ((event.clientX - rect.left) / rect.width) * 100;
    y = ((event.clientY - rect.top) / rect.height) * 100;
    schedulePointer(stage, render);
  }, { passive: true });

  stage.addEventListener('pointerleave', () => {
    x = 50;
    y = 50;
    if (visible) schedulePointer(stage, render);
  });

  observeVisibility(stage, (isVisible) => {
    visible = isVisible;
    if (!visible) cancelPointer(stage);
  });
}

function initSequences(): void {
  const sequences = Array.from(document.querySelectorAll<HTMLElement>('[data-sequence]'));
  const revealAll = (): void => sequences.forEach((sequence) => sequence.classList.add('is-sequence-visible'));
  if (reduceMotionQuery.matches || !('IntersectionObserver' in window)) {
    revealAll();
    return;
  }

  const pending = new Set<HTMLElement>();
  let fallbackFrame = 0;
  let observer: IntersectionObserver;

  const stopFallback = (): void => {
    window.removeEventListener('scroll', scheduleFallback);
    window.removeEventListener('resize', scheduleFallback);
    if (fallbackFrame) cancelAnimationFrame(fallbackFrame);
    fallbackFrame = 0;
  };

  const reveal = (sequence: HTMLElement): void => {
    if (!pending.delete(sequence)) return;
    sequence.classList.add('is-sequence-visible');
    observer.unobserve(sequence);
    if (pending.size === 0) {
      observer.disconnect();
      stopFallback();
    }
  };

  const checkFallback = (): void => {
    fallbackFrame = 0;
    pending.forEach((sequence) => {
      const rect = sequence.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.96 && rect.bottom > 0) reveal(sequence);
    });
  };

  function scheduleFallback(): void {
    if (!fallbackFrame) fallbackFrame = requestAnimationFrame(checkFallback);
  }

  try {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) reveal(entry.target as HTMLElement);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  } catch {
    revealAll();
    return;
  }

  sequences.forEach((sequence) => {
    try {
      observer.observe(sequence);
      pending.add(sequence);
    } catch {
      sequence.classList.add('is-sequence-visible');
    }
  });

  if (pending.size === 0) {
    observer.disconnect();
    return;
  }

  document.documentElement.classList.add('sequence-ready');
  window.addEventListener('scroll', scheduleFallback, { passive: true });
  window.addEventListener('resize', scheduleFallback, { passive: true });
  scheduleFallback();
}

function initEntrances(): void {
  const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-motion]'));
  if (reduceMotionQuery.matches || !('IntersectionObserver' in window)) return;
  const pending = new Set<HTMLElement>();
  let fallbackFrame = 0;
  let observer: IntersectionObserver;

  const stopFallback = (): void => {
    window.removeEventListener('scroll', scheduleFallback);
    window.removeEventListener('resize', scheduleFallback);
    if (fallbackFrame) cancelAnimationFrame(fallbackFrame);
    fallbackFrame = 0;
  };

  const reveal = (element: HTMLElement): void => {
    if (!pending.delete(element)) return;
    element.classList.add('is-motion-visible');
    observer.unobserve(element);

    const delay = Number(element.dataset.motionDelay ?? 0);
    window.setTimeout(() => {
      element.classList.remove('is-motion-pending', 'is-motion-visible');
      element.style.removeProperty('transition-delay');
    }, 1100 + (Number.isFinite(delay) ? delay : 0));

    if (pending.size === 0) {
      observer.disconnect();
      stopFallback();
    }
  };

  const checkFallback = (): void => {
    fallbackFrame = 0;
    pending.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.96 && rect.bottom > 0) reveal(element);
    });
  };

  function scheduleFallback(): void {
    if (!fallbackFrame) fallbackFrame = requestAnimationFrame(checkFallback);
  }

  try {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) reveal(entry.target as HTMLElement);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
  } catch {
    return;
  }

  elements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
      return;
    }

    try {
      observer.observe(element);
      pending.add(element);
    } catch {
      return;
    }
  });

  if (pending.size === 0) {
    observer.disconnect();
    return;
  }

  document.documentElement.classList.add('motion-ready');
  pending.forEach((element) => {
    element.classList.add('is-motion-pending');
    const delay = Number(element.dataset.motionDelay ?? 0);
    if (Number.isFinite(delay) && delay > 0) element.style.transitionDelay = `${delay}ms`;
  });
  window.addEventListener('scroll', scheduleFallback, { passive: true });
  window.addEventListener('resize', scheduleFallback, { passive: true });
  scheduleFallback();
}

export function initMotion(): void {
  initTheme();
  initHeader();
  initPointerLights();
  initServices();
  initPortfolioFolder();
  initWorkBrowser();
  initProcessJourney();
  initFooterLight();
  initSequences();
  initEntrances();
}
