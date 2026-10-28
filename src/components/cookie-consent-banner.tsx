import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Cookie, ShieldCheck } from 'lucide-react';
import {
  STORAGE_CONSENT_KEY,
  isNonEssentialStorageAllowed,
  type StorageConsentRecord,
} from '../lib/storage-consent.ts';

export {
  STORAGE_CONSENT_KEY,
  isNonEssentialStorageAllowed,
  type StorageConsentRecord,
};

const STORAGE_KEY = STORAGE_CONSENT_KEY;

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const existing = window.localStorage.getItem(STORAGE_KEY);
      if (!existing) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function handleAccept() {
    try {
      const record: StorageConsentRecord = {
        consent: 'accepted',
        timestamp: new Date().toISOString(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Ignore storage write issues
    }
    setVisible(false);
  }

  function handleReject() {
    try {
      const record: StorageConsentRecord = {
        consent: 'rejected',
        timestamp: new Date().toISOString(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Ignore storage write issues
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      role="region"
      aria-label="Storage and Cookie Preferences"
      className="fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-[#111110] text-[#F9F8F6] p-4 md:px-8 md:py-5 shadow-2xl backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-[#E02B20]">
            <Cookie size={18} strokeWidth={2} />
          </div>
          <div className="text-[13px] leading-relaxed text-neutral-300">
            <p>
              We use essential local storage to maintain your active client records, quotations, invoices and session state. No third-party tracking cookies are activated without your consent.
              {' '}
              <Link
                href="/privacy"
                className="inline-flex items-center gap-1 font-medium text-white underline decoration-neutral-500 underline-offset-4 hover:decoration-white transition-colors"
              >
                <ShieldCheck size={13} className="text-[#E02B20]" />
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 self-end md:self-auto">
          <button
            type="button"
            onClick={handleReject}
            className="rounded-lg border border-white/15 bg-white/[0.05] px-4 py-2 text-[12.5px] font-medium text-neutral-200 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          >
            Essential Only
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-lg bg-[#E02B20] px-4 py-2 text-[12.5px] font-medium text-white shadow transition-colors hover:bg-[#c9241a] cursor-pointer"
          >
            Accept All
          </button>
        </div>
      </div>
    </aside>
  );
}
