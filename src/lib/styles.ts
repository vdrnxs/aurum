/**
 * Design System - Spacing & Layout Constants
 * Centralizes spacing values for consistency across the app
 */

export const SPACING = {
  // Vertical spacing
  section: 'space-y-6',
  cardContent: 'space-y-4',
  textGroup: 'space-y-2',

  // Margins
  mt: {
    xs: 'mt-1',
    sm: 'mt-2',
    md: 'mt-4',
    lg: 'mt-6',
  },
  mb: {
    xs: 'mb-1',
    sm: 'mb-2',
    md: 'mb-4',
    lg: 'mb-6',
  },

  // Padding
  p: {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  },

  // Gap
  gap: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  },
} as const;

export const LAYOUT = {
  // Max widths
  maxWidth: 'max-w-screen-2xl',
  contentMaxWidth: 'max-w-3xl',

  // Padding
  pagePadding: 'px-6 py-6',
  headerPadding: 'px-6 py-4',

  // Container
  container: 'mx-auto max-w-screen-2xl',
  contentContainer: 'mx-auto max-w-3xl',
} as const;

export const TYPOGRAPHY = {
  // Text sizes with Tremor tokens
  xs: 'text-xs text-tremor-content-subtle',
  sm: 'text-sm text-tremor-content',
  mono: 'font-mono text-sm',
  emphasis: 'text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis',
} as const;

export const COLORS = {
  // Semantic colors with dark mode support
  error: 'text-red-600 dark:text-red-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-orange-600 dark:text-orange-400',

  // Trading-specific colors
  profit: 'text-emerald-600 dark:text-emerald-500',
  loss: 'text-red-600 dark:text-red-500',
  neutral: 'text-tremor-content-subtle dark:text-dark-tremor-content-subtle',
} as const;

export const COMPONENTS = {
  // Reusable component styles
  codeBlock: 'p-4 bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle border border-tremor-border dark:border-dark-tremor-border font-mono text-sm rounded',
  infoBox: 'p-4 bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded-lg',
} as const;

/**
 * Helper to combine class names
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
