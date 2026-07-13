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
  const object = document.querySelector<HTMLElement>('[data-hero-object]');
  const orb = document.querySelector<HTMLElement>('[data-hero-orb]');
  const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-service-chip]'));
  if (!object || !orb) return;

  chips.forEach((chip) => chip.addEventListener('click', () => {
    chips.forEach((item) => item.classList.toggle('is-active', item === chip));
  }));
  if (reduceMotionQuery.matches || !finePointerQuery.matches) return;

  let frame = 0;
  let active = false;
  let visible = true;
  let x = .5;
  let y = .5;
  const render = (): void => {
    frame = 0;
    const moveX = active ? (x - .5) * 18 : 0;
    const moveY = active ? (y - .5) * 18 : 0;
    orb.style.transform = `translate3d(calc(-50% + ${moveX.toFixed(1)}px), calc(-50% + ${moveY.toFixed(1)}px), 0) scale(${active ? '1.025' : '1'})`;
    chips.forEach((chip, index) => {
      const factor = index % 2 === 0 ? -1 : 1;
      chip.style.transform = active ? `translate3d(${(moveX * .32 * factor).toFixed(1)}px, ${(moveY * .32 * factor).toFixed(1)}px, 0)` : '';
    });
  };
  const schedule = (): void => { if (visible && !frame) frame = requestAnimationFrame(render); };
  object.addEventListener('pointermove', (event) => {
    const rect = object.getBoundingClientRect();
    x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    active = true; schedule();
  }, { passive: true });
  object.addEventListener('pointerleave', () => { active = false; schedule(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: .05 }).observe(object);
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
