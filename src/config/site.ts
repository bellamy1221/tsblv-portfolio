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
  title: 'TSBLV — превращаю идеи в сильные цифровые продукты',
  description:
    'Помогаю специалистам и небольшим командам превращать идеи в сайты, CRM и цифровые системы, которые вызывают доверие и поддерживают рост.',
  email: 'hello@tsblv.com',
  telegramUrl: 'https://t.me/tsblv',
  navigation: [
    { label: 'Работы', href: '#work' },
    { label: 'Услуги', href: '#services' },
    { label: 'Процесс', href: '#process' },
    { label: 'Обо мне', href: '#about' },
  ],
};
