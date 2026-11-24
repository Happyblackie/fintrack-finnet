export function formatCurrency(amount: number, currency: "KES" | "USD"): string {
  const formattedNumber = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? "-" : "";
  return `${sign}${currency} ${formattedNumber}`;
}

export function formatSignedCurrency(amount: number, currency: "KES" | "USD"): string {
  const formattedNumber = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${sign}${currency} ${formattedNumber}`;
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}