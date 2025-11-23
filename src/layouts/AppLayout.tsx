import { Button } from '@tremor/react';
import { useEffect, useState } from 'react';
import { LAYOUT, SPACING } from '../lib/styles';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-mode', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.removeAttribute('data-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setIsDark(true);
    } else if (saved === 'light') {
      setIsDark(false);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
  }, []);

  return (
    <Button size="xs" variant="secondary" onClick={() => setIsDark(!isDark)}>
      {isDark ? 'Light' : 'Dark'}
    </Button>
  );
}

/**
 * Simplified app layout with header
 * Ready to scale with sidebar, navigation, or multiple pages
 */
export function AppLayout({
  children,
  title = 'Aurum',
  subtitle,
  actions
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-tremor-background-muted dark:bg-dark-tremor-background">
      {/* Header */}
      <header className="bg-tremor-background dark:bg-dark-tremor-background-subtle border-b border-tremor-border dark:border-dark-tremor-border">
        <div className={`${LAYOUT.container} ${LAYOUT.headerPadding}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-tremor-content-strong dark:text-dark-tremor-content-strong">{title}</h1>
              {subtitle && (
                <p className={`text-tremor-default text-tremor-content dark:text-dark-tremor-content ${SPACING.mt.xs}`}>{subtitle}</p>
              )}
            </div>
            <div className={`flex items-center ${SPACING.gap.md}`}>
              <ThemeToggle />
              {actions}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className={`${LAYOUT.container} ${LAYOUT.pagePadding}`}>
        {children}
      </main>
    </div>
  );
}
