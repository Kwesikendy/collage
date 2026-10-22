import type { StoredDocumentLine } from "@workspace/db";

export type LineInput = {
  description: string;
  quantity: number;
  days: number;
  unitPrice: number;
};

export type DocumentPricing = {
  items: StoredDocumentLine[];
  subtotal: string;
  discountPercent: string;
  discountAmount: string;
  getfundRate: string;
  getfundAmount: string;
  nhilRate: string;
  nhilAmount: string;
  vatRate: string;
  vatAmount: string;
  total: string;
};

const toCents = (amount: string | number): number =>
  Math.round(Number(amount) * 100 + Number.EPSILON);
const fromCents = (amount: number): string => (amount / 100).toFixed(2);
const rateString = (rate: number): string => rate.toFixed(2);

function roundedRateAmount(baseCents: number, rate: number): number {
  return Math.round((baseCents * rate) / 100);
}

export function calculateDocumentPricing(input: {
  items: LineInput[];
  discountPercent: number;
  getfundRate: number;
  nhilRate: number;
  vatRate: number;
}): DocumentPricing {
  const items = input.items.map((item) => {
    const unitPriceCents = toCents(item.unitPrice);
    const totalCents = Math.round(item.quantity * item.days * unitPriceCents);
    return {
      description: item.description.trim(),
      quantity: item.quantity,
      days: item.days,
      unitPrice: Number(fromCents(unitPriceCents)),
      total: Number(fromCents(totalCents)),
    };
  });

  const subtotalCents = items.reduce(
    (total, item) => total + toCents(item.total),
    0,
  );
  const discountCents = roundedRateAmount(
    subtotalCents,
    input.discountPercent,
  );
  const taxableBaseCents = Math.max(0, subtotalCents - discountCents);
  const getfundCents = roundedRateAmount(taxableBaseCents, input.getfundRate);
  const nhilCents = roundedRateAmount(taxableBaseCents, input.nhilRate);
  const vatCents = roundedRateAmount(taxableBaseCents, input.vatRate);
  const totalCents =
    taxableBaseCents + getfundCents + nhilCents + vatCents;

  return {
    items,
    subtotal: fromCents(subtotalCents),
    discountPercent: rateString(input.discountPercent),
    discountAmount: fromCents(discountCents),
    getfundRate: rateString(input.getfundRate),
    getfundAmount: fromCents(getfundCents),
    nhilRate: rateString(input.nhilRate),
    nhilAmount: fromCents(nhilCents),
    vatRate: rateString(input.vatRate),
    vatAmount: fromCents(vatCents),
    total: fromCents(totalCents),
  };
}

export function amountToCents(amount: string | number): number {
  return toCents(amount);
}

export function centsToAmount(amount: number): string {
  return fromCents(amount);
}
