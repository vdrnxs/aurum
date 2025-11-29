/**
 * Shared utility functions for formatting data
 */

/**
 * Formats a number as USD currency
 * @param price - The price to format (can be null)
 * @returns Formatted price string or fallback text
 */
export function formatPrice(price: number | null): string {
  if (price === null || price === 0) return '—';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Formats a date string to readable format
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "Jan 15, 2024, 10:30 AM")
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formats a percentage value
 * @param value - Decimal value (e.g., 0.75 for 75%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string (e.g., "75.00%")
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}