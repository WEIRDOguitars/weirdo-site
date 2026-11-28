type Price = {
  pricingVersion: string; currency: string; basePrice: number;
  adjustments: { field: string; option: string; label: string; quantity: number; unitAmount: number; amount: number }[];
  totalAdjustments: number; totalPrice: number; requiresIndividualQuote: boolean; warnings: string[];
};
declare const pricing: {
  calculate(input: unknown): Price;
  summaryRows(price: Price): { label: string; value: string }[];
  format(amount: number): string;
  disclaimer: string;
  individualQuote: string;
};
export = pricing;
