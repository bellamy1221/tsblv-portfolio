const mobileBreakpoint = 768;
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

function initTheme(): void {
  const root = document.documentElement;
  const toggle = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  const themeColor = document.querySelector<HTMLMetaElement>('[data-theme-color]');
  if (!toggle) return;

  const applyTheme = (theme: 'light' | 'dark', persist = false): void => {
    root.dataset.theme = theme;
    const isDark = theme === 'dark';
    const label = isDark ? 'Включить светлую тему' : 'Включить тёмную тему';
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    if (themeColor) themeColor.content = isDark ? '#1c1d1a' : '#f1efe8';
    if (!persist) return;
    try { localStorage.setItem('tsblv-theme', theme); } catch {}
  };

  applyTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');
  toggle.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
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
    }, 180);
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
    if (button.getAttribute('aria-expanded') !== 'true' || header.contains(event.target as Node)) return;
    setOpen(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth >= mobileBreakpoint) setOpen(false);
  }, { passive: true });
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
}

function initHeroInteraction(): void {
  const stage = document.querySelector<HTMLElement>('[data-hero-mark]');
  const letters = Array.from(stage?.querySelectorAll<HTMLElement>('[data-hero-letter]') ?? []);
  if (!stage || letters.length === 0 || reduceMotionQuery.matches || !finePointerQuery.matches) return;

  let frame = 0;
  let pointerActive = false;
  let pointerX = .5;
  let pointerY = .5;

  const render = (): void => {
    frame = 0;
    letters.forEach((letter, index) => {
      const center = (index + .5) / letters.length;
      const distance = Math.max(0, 1 - Math.abs(pointerX - center) * 2.1);
      const x = pointerActive ? (pointerX - .5) * 10 * (1 - Math.abs(center - .5)) : 0;
      const y = pointerActive ? (pointerY - .5) * 11 * distance : 0;
      const rotate = pointerActive ? (pointerX - .5) * 1.4 * distance : 0;
      letter.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rotate.toFixed(2)}deg)`;
      letter.classList.toggle('is-moving', pointerActive);
    });
  };

  const schedule = (): void => {
    if (!frame) frame = requestAnimationFrame(render);
  };

  stage.classList.add('is-interactive');
  stage.addEventListener('pointerenter', () => { pointerActive = true; });
  stage.addEventListener('pointermove', (event) => {
    const rect = stage.getBoundingClientRect();
    pointerX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    pointerY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    pointerActive = true;
    schedule();
  }, { passive: true });
  stage.addEventListener('pointerleave', () => {
    pointerActive = false;
    pointerX = .5;
    pointerY = .5;
    schedule();
  });
}

function initReveals(): void {
  const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (reduceMotionQuery.matches || !('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });

  elements.forEach((element) => observer.observe(element));
}

export function initMotion(): void {
  document.documentElement.classList.add('motion-ready');
  initTheme();
  initHeader();
  initHeroInteraction();
  initReveals();
}
