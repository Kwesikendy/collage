import { Link } from 'wouter';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Database,
  FileText,
  Lock,
  Mail,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { Brand } from '@/components/brand';
import { useState } from 'react';
import { STORAGE_CONSENT_KEY } from '@/components/cookie-consent-banner';

export function PrivacyPolicyPage() {
  const [consentResetNotice, setConsentResetNotice] = useState(false);

  function resetConsent() {
    try {
      window.localStorage.removeItem(STORAGE_CONSENT_KEY);
      setConsentResetNotice(true);
      setTimeout(() => setConsentResetNotice(false), 4000);
    } catch {
      // Ignore storage errors
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-neutral-900 font-sans selection:bg-[#E02B20]/15 selection:text-[#E02B20]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-[#F9F8F6]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="no-underline flex items-center gap-3">
            <Brand />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900"
            >
              <ArrowLeft size={14} />
              <span>Home</span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#111110] px-3.5 py-1.5 text-[12.5px] font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
            >
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {/* Hero Section */}
        <div className="mb-12 border-b border-neutral-200 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11.5px] font-medium text-neutral-600 shadow-sm">
            <ShieldCheck size={14} className="text-[#E02B20]" />
            <span>Collat Invoice System · Privacy & Data Governance</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#111110] sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Effective Date: October 2026 · Version 1.0 · Collage Workspace
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-neutral-700">
            At Collage, we are committed to upholding transparency, data integrity, and strict confidentiality across all our financial operations, quotation systems, and equipment rental workflows. This document explains how client data is handled within the Collat Invoice System.
          </p>
        </div>

        {/* Notice of Consent Reset */}
        {consentResetNotice && (
          <div className="mb-8 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>Storage consent preferences have been reset. Reload the page to view the consent banner.</span>
          </div>
        )}

        <div className="space-y-10 text-neutral-800 text-[13.5px] leading-relaxed">
          {/* Section 1: Data Controller */}
          <section className="rounded-xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#E02B20]/10 text-[#E02B20]">
                <Building2 size={17} />
              </div>
              <h2 className="text-lg font-bold text-[#111110]">1. Data Controller and Contact Information</h2>
            </div>
            <div className="mt-4 space-y-3 text-neutral-700">
              <p>
                The data controller responsible for the Collat Invoice System is:
              </p>
              <div className="rounded-lg bg-[#F9F8F6] p-4 text-xs font-mono text-neutral-800 space-y-1">
                <div><strong>Organization:</strong> Collage (Corporate Marketing, Events, Advertising & Equipment Rentals)</div>
                <div><strong>Headquarters:</strong> Accra, Greater Accra Region, Ghana</div>
                <div><strong>Primary Email:</strong> collagenmosaic@gmail.com</div>
                <div><strong>Alternative Dispatch:</strong> sendit@collagenmosaic.com</div>
              </div>
              <p>
                Inquiries regarding data protection, record rectification, or enterprise deployment agreements may be directed to our administration team via the email addresses above.
              </p>
            </div>
          </section>

          {/* Section 2: Information Collected */}
          <section className="rounded-xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#111110]/5 text-[#111110]">
                <FileText size={17} />
              </div>
              <h2 className="text-lg font-bold text-[#111110]">2. Information We Collect</h2>
            </div>
            <div className="mt-4 space-y-4 text-neutral-700">
              <p>
                Collat processes operational data strictly required to prepare quotations, issue proforma and commercial invoices, schedule rentals, and track payment receipts:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Client Profile Records:</strong> Company name, designated contact person (Attn), corporate email address, telephone contact, street address or landmark, city, country, and client account status (lead, active, archived).
                </li>
                <li>
                  <strong>Financial Line Items & Pricing:</strong> Service descriptions, quantities, rental day durations, unit rates, itemized subtotals, and approved discount rates.
                </li>
                <li>
                  <strong>Statutory Tax Calculations:</strong> Line items and aggregated totals for statutory Ghanaian levies, specifically Ghana Education Trust Fund (GETFund 2.5%), National Health Insurance Levy (NHIL 2.5%), and Ghana Revenue Authority Value Added Tax (GRA VAT 15.0%).
                </li>
                <li>
                  <strong>Payment & Settlement Records:</strong> Transaction amounts, settlement dates, payment channels (bank transfer, mobile money, cash, card, other), and settlement reference identifiers.
                </li>
                <li>
                  <strong>Operations & Equipment Bookings:</strong> Telescopic flagpole rental schedules, deployment dates, return dates, and print production specifications dispatched to sister facilities.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3: How Data Is Used */}
          <section className="rounded-xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#111110]/5 text-[#111110]">
                <Lock size={17} />
              </div>
              <h2 className="text-lg font-bold text-[#111110]">3. How Data Is Used and Shared</h2>
            </div>
            <div className="mt-4 space-y-3 text-neutral-700">
              <p>
                All data entered into Collat is utilized exclusively for business administration and contract fulfillment:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Quotation and Invoicing:</strong> Generating professional PDF and print documents, calculating exact integer-cent statutory tax assessments, and tracking accounts receivable.
                </li>
                <li>
                  <strong>Sister Facility Production Dispatch:</strong> Approved print production work orders (such as large-format press prints and teardrop flag banners) are dispatched directly to our sister print facility, PrintD Pigh.
                </li>
                <li>
                  <strong>Field Operations Management:</strong> Managing inventory and return schedules for deployed telescopic flagpoles and rental equipment across event locations in Ghana.
                </li>
                <li>
                  <strong>Zero Third-Party Advertising:</strong> We do not sell, rent, monetize, or disclose your client databases or financial records to external data brokers or advertisers.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4: Local Storage and Session State */}
          <section className="rounded-xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#E02B20]/10 text-[#E02B20]">
                <Database size={17} />
              </div>
              <h2 className="text-lg font-bold text-[#111110]">4. Local Storage and Session Architecture</h2>
            </div>
            <div className="mt-4 space-y-3 text-neutral-700">
              <p>
                The Collat Invoice System utilizes browser storage mechanisms (specifically <code>window.localStorage</code>) to enable high-speed, client-side resilience and zero-latency document authoring:
              </p>
              <div className="space-y-3 pt-1">
                <div className="rounded-lg border border-neutral-200 bg-[#F9F8F6] p-4 text-xs">
                  <div className="font-mono font-bold text-[#111110]">collat_erp_store_v3 (Essential Operational Store)</div>
                  <p className="mt-1 text-neutral-600">
                    Stores the core operational state including client lists, quotations, invoices, payment history, equipment rentals, and print jobs. This key enables continuous offline resilience, instant client search, and dynamic ledger calculations.
                  </p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-[#F9F8F6] p-4 text-xs">
                  <div className="font-mono font-bold text-[#111110]">collat_storage_consent_v1 (Consent Preferences)</div>
                  <p className="mt-1 text-neutral-600">
                    Persists your explicit cookie and storage consent choice (accepted or rejected) along with an ISO 8601 timestamp. Gating logic ensures non-essential tracking mechanisms remain disabled when consent is rejected.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Essential vs Optional Storage */}
          <section className="rounded-xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#111110]/5 text-[#111110]">
                <Sliders size={17} />
              </div>
              <h2 className="text-lg font-bold text-[#111110]">5. Cookie & Storage Preferences</h2>
            </div>
            <div className="mt-4 space-y-3 text-neutral-700">
              <p>
                We clearly separate operational storage from optional telemetry:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Essential Storage:</strong> Required for document creation, client registration, balance settlement, and basic session navigation. Disabling essential storage prevents the application from maintaining your ledger.
                </li>
                <li>
                  <strong>Non-Essential Storage & Analytics:</strong> Optional tracking or performance analytics are strictly gated behind user consent. If you choose "Essential Only", non-essential storage is suppressed via our <code>isNonEssentialStorageAllowed()</code> guard.
                </li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={resetConsent}
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900 cursor-pointer"
                >
                  <RotateCcw size={13} className="text-[#E02B20]" />
                  <span>Reset Consent Preferences</span>
                </button>
              </div>
            </div>
          </section>

          {/* Section 6: User Rights & Data Purge */}
          <section className="rounded-xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#111110]/5 text-[#111110]">
                <RefreshCw size={17} />
              </div>
              <h2 className="text-lg font-bold text-[#111110]">6. User Rights and Data Sovereign Control</h2>
            </div>
            <div className="mt-4 space-y-3 text-neutral-700">
              <p>
                Because Collat prioritizes local sovereign storage, you have full custody of your client and financial records:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Data Export:</strong> All invoices and quotations can be exported or printed at any time via the document detail view.
                </li>
                <li>
                  <strong>Immediate Deletion:</strong> Deleting a document or client record removes it from the local store immediately, cascading payment record deletions as appropriate.
                </li>
                <li>
                  <strong>Complete State Purge:</strong> You may wipe all local demo data and reset to initial state at any moment by using the "Reset Demo Data" button located in the application header, or by clearing your browser site storage in developer settings.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 7: Updates to this Policy */}
          <section className="rounded-xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#111110]/5 text-[#111110]">
                <Shield size={17} />
              </div>
              <h2 className="text-lg font-bold text-[#111110]">7. Policy Revisions</h2>
            </div>
            <div className="mt-4 space-y-3 text-neutral-700">
              <p>
                We may revise this Privacy Policy periodically to reflect enhancements in statutory tax compliance or updated system capabilities. Any adjustments will be indicated by the Effective Date displayed at the top of this page.
              </p>
            </div>
          </section>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Landing Page</span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-[#E02B20] px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#c9241a]"
          >
            <span>Proceed to Workspace Dashboard</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-500 font-mono">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Collage · Corporate Marketing, Events, Advertising & Equipment Rentals</span>
          <span>Accra, Ghana · GETFund 2.5% · NHIL 2.5% · GRA VAT 15.0%</span>
        </div>
      </footer>
    </div>
  );
}
export default PrivacyPolicyPage;
