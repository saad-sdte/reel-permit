/** Format a USD price: 26 -> "$26.00" */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/** Human-readable category labels for license grouping. */
export const CATEGORY_LABELS: Record<string, string> = {
  freshwater: "Freshwater",
  saltwater: "Saltwater",
  "all-water": "All-Water",
  combo: "Combination",
  other: "Other",
};
