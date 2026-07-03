export const APP_CURRENCY = 'USD';

export function formatCurrency(value, options = {}) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: APP_CURRENCY,
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
  }).format(amount);
}
