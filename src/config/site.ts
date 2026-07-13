export interface NavigationItem {
  label: string;
  href: `#${string}`;
}

export interface SiteConfig {
  name: string;
  title: string;
  description: string;
  email: string;
  telegramUrl: string;
  navigation: NavigationItem[];
}

// Replace these two contact values before publishing the site.
export const siteConfig: SiteConfig = {
  name: 'TSBLV',
  title: 'TSBLV — сайты, автоматизация и цифровые решения',
  description:
    'Создание сайтов, настройка CRM, автоматизация процессов и аналитика для специалистов, самозанятых и небольших команд.',
  email: 'hello@tsblv.com',
  telegramUrl: 'https://t.me/tsblv',
  navigation: [
    { label: 'Работы', href: '#work' },
    { label: 'Услуги', href: '#services' },
    { label: 'Процесс', href: '#process' },
    { label: 'Обо мне', href: '#about' },
  ],
};
