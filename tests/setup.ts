import { register } from 'node:module';

// Register ESM resolution hook for extensionless .ts imports
try {
  register(new URL('./resolver-hook.mjs', import.meta.url));
} catch {}

export const STORAGE_KEY = 'collat_erp_store_v3';

class InMemoryLocalStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(String(key), String(value));
  }

  removeItem(key: string): void {
    this.store.delete(String(key));
  }

  clear(): void {
    this.store.clear();
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }
}

export const mockLocalStorage = new InMemoryLocalStorage();

if (typeof globalThis.window === 'undefined') {
  (globalThis as unknown as { window: unknown }).window = globalThis;
}

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis.window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

// Now import custom-fetch and document-finance after register and window.localStorage are initialized
const customFetchModule = await import('../src/lib/api-client/custom-fetch.ts');
const financeModule = await import('../src/lib/api-client/document-finance.ts');

export const customFetch = customFetchModule.customFetch;
export const getOperationsData = customFetchModule.getOperationsData;
export const getDocumentPayments = customFetchModule.getDocumentPayments;
export const updateRentalStatus = customFetchModule.updateRentalStatus;
export const createRentalBooking = customFetchModule.createRentalBooking;
export const updateProductionOrderStatus = customFetchModule.updateProductionOrderStatus;
export const createProductionOrder = customFetchModule.createProductionOrder;
export const deleteDocumentById = customFetchModule.deleteDocumentById;
export const resetErpDemoData = customFetchModule.resetErpDemoData;
export const ApiError = customFetchModule.ApiError;
export const setBaseUrl = customFetchModule.setBaseUrl;
export const setAuthTokenGetter = customFetchModule.setAuthTokenGetter;

export const calculateDocumentPricing = financeModule.calculateDocumentPricing;
export const amountToCents = financeModule.amountToCents;
export const centsToAmount = financeModule.centsToAmount;

export function resetStore(): void {
  mockLocalStorage.clear();
  resetErpDemoData();
}

export function getRawStore(): Record<string, unknown> | null {
  const raw = mockLocalStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setRawStore(value: unknown): void {
  if (typeof value === 'string') {
    mockLocalStorage.setItem(STORAGE_KEY, value);
  } else {
    mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }
}
