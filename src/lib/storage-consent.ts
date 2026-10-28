export const STORAGE_CONSENT_KEY = 'collat_storage_consent_v1';

export interface StorageConsentRecord {
  consent: 'accepted' | 'rejected';
  timestamp: string;
}

export function isNonEssentialStorageAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_CONSENT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as StorageConsentRecord;
    return parsed?.consent === 'accepted';
  } catch {
    return false;
  }
}
