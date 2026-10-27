import { type MouseEvent, type ReactNode, useRef, useState } from 'react';
import { Link } from 'wouter';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import { Brand } from '@/components/brand';
import { LandingMark } from '@/components/landing/mark';

const ease = [0.22, 1, 0.36, 1] as const;
const fluidEase = [0.16, 1, 0.3, 1] as const;

function LineReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <span className="landing-reveal-line">
      <motion.span
        className="landing-reveal-line__inner"
        initial={reduce ? { y: 0 } : { y: '108%' }}
        animate={{ y: 0 }}
        transition={{ duration: reduce ? 0 : 0.95, delay: reduce ? 0 : delay, ease }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function FadeIn({
  children,
  delay = 0,
  className = '',
  y = 0,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.72, delay: reduce ? 0 : delay, ease }}
    >
      {children}
    </motion.div>
  );
}

const services = [
  'Client records',
  'Quotations',
  'Invoices',
  'Payments',
  'Ghana tax',
  'One connected job',
];

function formatNumber(amount: number) {
  return amount.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatGhs(amount: number) {
  return `GHS ${formatNumber(amount)}`;
}

/* ============================================================================
   SECTION 02: THE LIVING THREAD — AUTHENTIC FINANCIAL DOCUMENT & LEDGER
   ============================================================================ */

interface QuoteLineItem {
  itemNo: string;
  id: string;
  title: string;
  detail: string;
  qty: string;
  days: string;
  rate: number;
  lineTotal: number;
}

const QUOTATION_LINE_ITEMS: QuoteLineItem[] = [
  {
    itemNo: '01',
    id: 'wayfinding',
    title: 'Wayfinding Pylons & Directional Totems',
    detail: 'Double-sided brushed aluminium & UV architectural print',
    qty: '06',
    days: '1d',
    rate: 850.0,
    lineTotal: 5100.0,
  },
  {
    itemNo: '02',
    id: 'poles',
    title: 'Telescopic Pole Rentals & Forecourt Rigging',
    detail: '4.5m weighted aluminium poles with ground bases',
    qty: '08',
    days: '3d',
    rate: 150.0,
    lineTotal: 3600.0,
  },
  {
    itemNo: '03',
    id: 'uv-prints',
    title: 'Large-Format UV Prints & Stage Fascia',
    detail: 'Main auditorium backdrop & podium branding package',
    qty: '02',
    days: '1d',
    rate: 1400.0,
    lineTotal: 2800.0,
  },
];

const STAGE_TABS = [
  { index: 0, code: '01', label: 'Client Profile' },
  { index: 1, code: '02', label: 'Quotation Ledger' },
  { index: 2, code: '03', label: 'Tax Invoice' },
] as const;

function LivingThreadStage({ workspaceHref }: { workspaceHref: string }) {
  // Default to Stage 1 (02 Quotation Ledger) so the document sheet is front-and-center
  const [activeStage, setActiveStage] = useState<0 | 1 | 2>(1);
  const reduce = useReducedMotion();

  // Statutory Ghana tax calculation:
  // Net Base Scope: 5,100 + 3,600 + 2,800 = 11,500.00
  // GETFund (2.5%): 287.50
  // NHIL (2.5%): 287.50
  // Taxable Base: 12,075.00
  // GRA VAT (15.0%): 1,811.25
  // Total Due: GHS 13,886.25
  const netBaseScope = 11500.0;
  const getfund = 287.5;
  const nhil = 287.5;
  const graVat = 1811.25;
  const grandTotal = 13886.25;

  const bankTranche = grandTotal * 0.65;
  const momoTranche = grandTotal - bankTranche;

  const headerMeta =
    activeStage === 0
      ? {
          ref: 'REF: CL-ECO-2026',
          statusText: '● VERIFIED CORPORATE RECORD',
          statusClass: 'text-neutral-300',
        }
      : activeStage === 1
        ? {
            ref: 'REF: QT00241026.01',
            statusText: '● PENDING RECONCILIATION',
            statusClass: 'text-amber-400/90',
          }
        : {
            ref: 'REF: INV00221026.01',
            statusText: '● CLEARED IN FULL',
            statusClass: 'text-emerald-400',
          };

  return (
    <section id="workspace" className="relative py-24 md:py-32">
      <div className="landing-wrap">
        {/* Editorial Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[11px] font-medium tracking-[0.2em] text-[#E02B20] uppercase">
            02 // The Living Thread
          </p>
          <h2
            className="mt-3.5 text-[clamp(32px,4.5vw,54px)] font-medium tracking-[-0.04em] text-[#F5F3ED] leading-[1.04]"
            style={{ fontFamily: 'var(--landing-display)' }}
          >
            One client. One living sheet. Settled without loose ends.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-neutral-400">
            Every job starts as a verified corporate profile, scopes cleanly with statutory Ghana levies, and converts directly into a reconciled tax invoice.
          </p>
        </div>

        {/* Clean Architectural Stage Switcher */}
        <div className="mt-10 flex justify-center">
          <div
            role="tablist"
            aria-label="Document lifecycle stages"
            className="inline-flex items-center rounded-lg border border-white/[0.08] bg-[#141413] p-1"
          >
            {STAGE_TABS.map((tab) => {
              const isActive = activeStage === tab.index;
              return (
                <button
                  key={tab.code}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveStage(tab.index)}
                  className={`relative flex items-center gap-2 rounded-md px-4 py-2 font-mono text-[11.5px] tracking-[0.04em] transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? 'text-white font-medium'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="living-thread-tab-pill"
                      className="absolute inset-0 rounded-md border border-white/10 bg-white/[0.06]"
                      transition={{ duration: 0.3, ease: fluidEase }}
                    />
                  )}
                  <span className="relative z-10 text-[10.5px] text-[#E02B20]">
                    {tab.code}
                  </span>
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Authentic Document Container (Paper Canvas) */}
        <div className="mx-auto mt-7 max-w-4xl rounded-xl border border-white/10 bg-[#111110] shadow-[0_28px_80px_rgba(0,0,0,0.65)] overflow-hidden">
          {/* Document Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.015] px-6 py-3.5 sm:px-8">
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-400">
              <span className="text-neutral-300 font-medium">COLLAGE // OPS DESK</span>
              <span className="text-white/15">·</span>
              <span>{headerMeta.ref}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.1em] text-neutral-400">
              <span>CLIENT: ECOBANK GHANA PLC</span>
              <span className="text-white/15">·</span>
              <span className={`${headerMeta.statusClass} font-medium`}>
                {headerMeta.statusText}
              </span>
            </div>
          </div>

          {/* Document Body */}
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {activeStage === 0 && (
                <motion.div
                  key="stage-client"
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? {} : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: fluidEase }}
                  className="space-y-7"
                >
                  {/* Client Header */}
                  <div className="flex flex-wrap items-start justify-between gap-6 border-b border-white/[0.06] pb-6">
                    <div>
                      <p className="font-mono text-[11px] tracking-widest text-neutral-500 uppercase">
                        Master Account Ledger
                      </p>
                      <h3 className="mt-1.5 text-2xl sm:text-3xl font-medium tracking-tight text-white">
                        Ecobank Ghana PLC
                      </h3>
                      <p className="mt-1 text-[13.5px] text-neutral-400">
                        Banking & Financial Services · Head Office Account
                      </p>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5 text-right">
                      <span className="block font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
                        GRA Taxpayer ID
                      </span>
                      <span className="mt-0.5 block font-mono text-[13px] font-medium tracking-tight text-white">
                        TIN · C0004829104
                      </span>
                    </div>
                  </div>

                  {/* 4-Cell Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 rounded-lg border border-white/[0.08] divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06] bg-white/[0.01]">
                    <div className="p-5 space-y-4">
                      <div>
                        <span className="block font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
                          Primary Contact
                        </span>
                        <strong className="mt-1 block text-[14.5px] font-medium text-white">
                          Nana Ama Mensah
                        </strong>
                        <span className="mt-0.5 block text-[12.5px] text-neutral-400">
                          Head of Corporate Brand & Spaces
                        </span>
                      </div>
                      <div className="border-t border-white/[0.06] pt-4">
                        <span className="block font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
                          Direct Correspondence
                        </span>
                        <span className="mt-1 block font-mono text-[13px] text-neutral-200">
                          +233 24 431 8902 · n.mensah@ecobank.com.gh
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div>
                        <span className="block font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
                          Billing Address
                        </span>
                        <strong className="mt-1 block text-[14.5px] font-medium text-white">
                          2 Morocco Lane, Off Independence Ave
                        </strong>
                        <span className="mt-0.5 block text-[12.5px] text-neutral-400">
                          Ridge, Accra · Greater Accra Region
                        </span>
                      </div>
                      <div className="border-t border-white/[0.06] pt-4">
                        <span className="block font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
                          Active Scope Attached
                        </span>
                        <span className="mt-1 block font-mono text-[13px] text-white">
                          QT00241026.01 · 3 Line Items ({formatGhs(grandTotal)})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                    <span className="font-mono text-[11px] text-neutral-500">
                      TIN & billing profile automatically inherited by all linked quotations
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveStage(1)}
                      className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-transparent px-4 py-2 font-mono text-[11.5px] font-medium text-white transition-all duration-200 hover:border-[#E02B20] hover:bg-[#E02B20] cursor-pointer"
                    >
                      <span>Inspect Quotation Sheet</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {activeStage === 1 && (
                <motion.div
                  key="stage-quotation"
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? {} : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: fluidEase }}
                >
                  {/* Quotation Table Architecture */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="py-3 pr-4 font-mono text-[11px] font-medium uppercase tracking-widest text-neutral-500 w-14">
                            ITEM
                          </th>
                          <th className="py-3 px-4 font-mono text-[11px] font-medium uppercase tracking-widest text-neutral-500">
                            SCOPE SPECIFICATION
                          </th>
                          <th className="py-3 px-3 text-center font-mono text-[11px] font-medium uppercase tracking-widest text-neutral-500 w-20">
                            QTY
                          </th>
                          <th className="py-3 px-3 text-center font-mono text-[11px] font-medium uppercase tracking-widest text-neutral-500 w-20">
                            DAYS
                          </th>
                          <th className="py-3 px-4 text-right font-mono text-[11px] font-medium uppercase tracking-widest text-neutral-500 w-32">
                            RATE (GHS)
                          </th>
                          <th className="py-3 pl-4 text-right font-mono text-[11px] font-medium uppercase tracking-widest text-neutral-500 w-36">
                            LINE TOTAL (GHS)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {QUOTATION_LINE_ITEMS.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-white/[0.06] transition-colors duration-150 hover:bg-white/[0.015]"
                          >
                            <td className="py-4 pr-4 align-top font-mono text-[12px] text-neutral-400 tabular-nums">
                              {item.itemNo}
                            </td>
                            <td className="py-4 px-4 align-top">
                              <div className="text-[14px] font-medium text-white leading-snug">
                                {item.title}
                              </div>
                              <div className="mt-0.5 text-[12px] text-neutral-500 leading-relaxed">
                                {item.detail}
                              </div>
                            </td>
                            <td className="py-4 px-3 align-top text-center">
                              <span className="inline-block rounded bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-neutral-300 tabular-nums">
                                {item.qty}
                              </span>
                            </td>
                            <td className="py-4 px-3 align-top text-center">
                              <span className="inline-block rounded bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-neutral-300 tabular-nums">
                                {item.days}
                              </span>
                            </td>
                            <td className="py-4 px-4 align-top text-right font-mono text-[13px] tracking-tight text-white tabular-nums">
                              {formatNumber(item.rate)}
                            </td>
                            <td className="py-4 pl-4 align-top text-right font-mono text-[13px] font-medium tracking-tight text-white tabular-nums">
                              {formatNumber(item.lineTotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Reconciled Financial Ledger (Bottom Right Breakdown) */}
                  <div className="mt-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                    <div className="hidden sm:block space-y-1 font-mono text-[11px] text-neutral-500">
                      <div>ISSUED: 24 OCT 2026 · VALID FOR 14 DAYS</div>
                      <div>DISPATCH PARTNER: PRINTD PIGH PRODUCTION</div>
                    </div>

                    <div className="w-full sm:w-80 space-y-2">
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="font-mono text-neutral-400">Net Base Scope:</span>
                        <span className="font-mono tracking-tight text-neutral-200 tabular-nums">
                          {formatNumber(netBaseScope)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="font-mono text-neutral-400">GETFund (2.5%):</span>
                        <span className="font-mono tracking-tight text-neutral-200 tabular-nums">
                          {formatNumber(getfund)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="font-mono text-neutral-400">NHIL (2.5%):</span>
                        <span className="font-mono tracking-tight text-neutral-200 tabular-nums">
                          {formatNumber(nhil)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="font-mono text-neutral-400">GRA VAT (15.0%):</span>
                        <span className="font-mono tracking-tight text-neutral-200 tabular-nums">
                          {formatNumber(graVat)}
                        </span>
                      </div>

                      {/* Crisp 1px rule */}
                      <div className="my-2.5 border-t border-white/10" />

                      {/* Total Due with Vermilion Left-Border Accent Bar */}
                      <div className="flex items-baseline justify-between border-l-2 border-[#E02B20] pl-3.5 py-0.5">
                        <span className="font-mono text-[12px] uppercase tracking-wider text-neutral-300">
                          Total Due:
                        </span>
                        <span className="font-mono text-[18px] font-bold tracking-tight text-white tabular-nums">
                          {formatGhs(grandTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                    <span className="font-mono text-[11px] text-neutral-500">
                      Generated under GRA Act 896/936 · Non-negotiable once converted
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveStage(2)}
                      className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-transparent px-4 py-2 font-mono text-[11.5px] font-medium text-white transition-all duration-200 hover:border-[#E02B20] hover:bg-[#E02B20] cursor-pointer"
                    >
                      <span>Convert to Tax Invoice →</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {activeStage === 2 && (
                <motion.div
                  key="stage-invoice"
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? {} : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: fluidEase }}
                  className="space-y-6"
                >
                  {/* Tax Invoice Header */}
                  <div className="flex flex-wrap items-start justify-between gap-6 border-b border-white/[0.06] pb-6">
                    <div>
                      <p className="font-mono text-[11px] tracking-widest text-neutral-500 uppercase">
                        Converted from QT00241026.01
                      </p>
                      <h3 className="mt-1.5 text-2xl sm:text-3xl font-medium tracking-tight text-white">
                        Reconciled Tax Invoice
                      </h3>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.07] px-3.5 py-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                        <Check size={12} />
                      </span>
                      <div>
                        <span className="block font-mono text-[10.5px] font-semibold tracking-widest text-emerald-300 uppercase">
                          100% Settled
                        </span>
                        <span className="block font-mono text-[10px] text-emerald-400/80">
                          Balance Due: GHS 0.00
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tranche Settlement Rows */}
                  <div className="rounded-lg border border-white/[0.08] divide-y divide-white/[0.06]">
                    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                      <div className="flex items-start gap-3.5">
                        <span className="mt-0.5 font-mono text-[12px] text-neutral-500">
                          01
                        </span>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-[14px] font-medium text-white">
                              Bank Transfer · GCB Corporate Treasury
                            </span>
                            <span className="rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-neutral-300 uppercase">
                              65% Mobilization
                            </span>
                          </div>
                          <span className="mt-0.5 block font-mono text-[11.5px] text-neutral-500">
                            25 Oct 2026 · Ref: TRX-884920-ECO
                          </span>
                        </div>
                      </div>
                      <div className="font-mono text-[13.5px] font-medium tracking-tight text-white tabular-nums">
                        {formatGhs(bankTranche)}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                      <div className="flex items-start gap-3.5">
                        <span className="mt-0.5 font-mono text-[12px] text-neutral-500">
                          02
                        </span>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-[14px] font-medium text-white">
                              MTN Mobile Money · Corporate Settlement
                            </span>
                            <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300 uppercase">
                              35% Final Tranche
                            </span>
                          </div>
                          <span className="mt-0.5 block font-mono text-[11.5px] text-neutral-500">
                            27 Oct 2026 · Ref: MOMO-29481042
                          </span>
                        </div>
                      </div>
                      <div className="font-mono text-[13.5px] font-medium tracking-tight text-emerald-400 tabular-nums">
                        {formatGhs(momoTranche)}
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                    <span className="font-mono text-[11px] text-neutral-500">
                      Auditable receipt trail archived under Ecobank Ghana PLC
                    </span>
                    <Link
                      href={workspaceHref}
                      className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-transparent px-4 py-2 font-mono text-[11.5px] font-medium text-white no-underline transition-all duration-200 hover:border-[#E02B20] hover:bg-[#E02B20]"
                    >
                      <span>Open in Workspace →</span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   SECTION 03: THE FOUR WORKSPACE ROOMS (INTERACTIVE DIRECTORY)
   ============================================================================ */

interface DirectoryRoom {
  id: string;
  number: string;
  label: string;
  route: string;
  subtitle: string;
  previewTitle: string;
  previewMetric: string;
  previewMeta: string;
  previewLines: { left: string; right: string }[];
}

const DIRECTORY_ROOMS: DirectoryRoom[] = [
  {
    id: 'clients',
    number: '01',
    label: '01 / Clients Directory',
    route: '/clients',
    subtitle:
      'Corporate profiles, GRA TIN numbers, primary decision-makers, and full billing histories.',
    previewTitle: 'Ecobank Ghana PLC',
    previewMetric: '24 Active Accounts',
    previewMeta: 'TIN C0004829104 · Nana Ama Mensah · Ridge, Accra',
    previewLines: [
      { left: 'Ecobank Ghana PLC', right: 'GHS 13,886.25' },
      { left: 'Scancom PLC (MTN Ghana)', right: 'GHS 10,369.58' },
      { left: 'Eugenia Activations', right: 'GHS 1,907.85' },
    ],
  },
  {
    id: 'quotations',
    number: '02',
    label: '02 / Quotation Engine',
    route: '/quotations',
    subtitle:
      'Multi-day equipment & print scoping with automated 2.5% GETFund, 2.5% NHIL, and 15% VAT.',
    previewTitle: 'QT00241026.01 · Summit Package',
    previewMetric: 'GHS 13,886.25 Incl. Tax',
    previewMeta: 'Net Base 11,500.00 · GETFund 287.50 · NHIL 287.50 · VAT 1,811.25',
    previewLines: [
      { left: 'Wayfinding Pylons (06 · 1d)', right: 'GHS 5,100.00' },
      { left: 'Telescopic Pole Rentals (08 · 3d)', right: 'GHS 3,600.00' },
      { left: 'Large-Format UV Prints (02 · 1d)', right: 'GHS 2,800.00' },
    ],
  },
  {
    id: 'invoices',
    number: '03',
    label: '03 / Invoice & Tax Ledger',
    route: '/invoices',
    subtitle:
      'One-click quote conversion, partial Mobile Money & bank transfer tranches, and print-ready sheets.',
    previewTitle: 'INV 00221026.01 · Tax Ledger',
    previewMetric: 'Cleared & Reconciled',
    previewMeta: 'GCB Bank Transfer + MTN MoMo Corporate Settlement',
    previewLines: [
      { left: '00221026.01 · Ecobank Ghana PLC', right: 'CLEARED' },
      { left: '00181026.01 · Scancom PLC (MTN)', right: 'CLEARED' },
      { left: '00211026.01 · Eugenia Flag Rentals', right: 'ISSUED' },
    ],
  },
  {
    id: 'operations',
    number: '04',
    label: '04 / Operations & Equipment',
    route: '/operations',
    subtitle:
      'Telescopic flag pole dispatch, return schedules, and PrintD Pigh sublimation work orders.',
    previewTitle: 'Accra Dispatch & Rental Ledger',
    previewMetric: '10 Pole Sets Active',
    previewMeta: 'Forecourt installations & large-format sublimation queue',
    previewLines: [
      { left: 'Telescopic Poles & Ground Spikes', right: '8 SETS OUT' },
      { left: 'Double-Sided Sublimation Flags', right: 'IN PRODUCTION' },
      { left: 'Auditorium Stage Fascia Rigging', right: 'SCHEDULED' },
    ],
  },
];

function WorkspaceRoomsDirectory({ hasClerk }: { hasClerk: boolean }) {
  const [hoveredRoom, setHoveredRoom] = useState<DirectoryRoom | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string>('clients');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 260, damping: 28, mass: 0.4 });
  const smoothY = useSpring(pointerY, { stiffness: 260, damping: 28, mass: 0.4 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduce || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    pointerX.set(e.clientX - rect.left + 24);
    pointerY.set(e.clientY - rect.top - 72);
  };

  return (
    <section className="relative py-24 md:py-32 border-t border-white/[0.08]">
      <div className="landing-wrap">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column (Sticky) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <p className="font-mono text-[11px] font-medium tracking-[0.2em] text-[#E02B20] uppercase">
              03 // The Architecture
            </p>
            <h2
              className="mt-3.5 text-[clamp(30px,3.8vw,48px)] font-medium tracking-[-0.04em] text-[#F5F3ED] leading-[1.05]"
              style={{ fontFamily: 'var(--landing-display)' }}
            >
              Four purpose-built desks. One continuous record.
            </h2>
            <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-neutral-400">
              From the moment a brief arrives to the final bank transfer or Mobile Money receipt, every room reads and writes to the same underlying job thread.
            </p>
          </div>

          {/* Right Column: 4 Full-Width Stacked Rows + Floating Cursor Preview */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredRoom(null)}
            className="relative lg:col-span-7 border-b border-white/[0.08]"
          >
            {DIRECTORY_ROOMS.map((room) => {
              const targetHref = hasClerk ? '/sign-in' : room.route;
              const isSelected = activeRoomId === room.id;

              return (
                <div
                  key={room.id}
                  onMouseEnter={() => {
                    setHoveredRoom(room);
                    setActiveRoomId(room.id);
                  }}
                  className="group border-t border-white/[0.08]"
                >
                  <Link
                    href={targetHref}
                    onFocus={() => setActiveRoomId(room.id)}
                    className="block py-7 sm:py-9 no-underline focus:outline-none"
                  >
                    <div className="flex items-center justify-between gap-6">
                      <div className="transition-transform duration-300 ease-out group-hover:translate-x-2">
                        <h3
                          className="text-[clamp(22px,2.8vw,34px)] font-medium tracking-[-0.03em] text-[#F5F3ED] transition-colors duration-200 group-hover:text-white"
                          style={{ fontFamily: 'var(--landing-display)' }}
                        >
                          {room.label}
                        </h3>
                        <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-neutral-400 transition-colors duration-200 group-hover:text-neutral-300">
                          {room.subtitle}
                        </p>
                      </div>

                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 text-neutral-400 transition-all duration-200 group-hover:border-[#E02B20] group-hover:bg-[#E02B20] group-hover:text-white"
                      >
                        <ArrowUpRight size={18} />
                      </span>
                    </div>

                    {/* Responsive Inline Preview Card (Mobile/Tablet) */}
                    <AnimatePresence initial={false}>
                      {isSelected && (
                        <motion.div
                          initial={reduce ? false : { height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={reduce ? {} : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: fluidEase }}
                          className="overflow-hidden lg:hidden"
                        >
                          <div className="mt-4 rounded-lg border border-white/10 bg-[#111110] p-4">
                            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 font-mono text-[11px]">
                              <span className="text-white font-medium">
                                {room.previewTitle}
                              </span>
                              <span className="text-[#E02B20]">{room.previewMetric}</span>
                            </div>
                            <div className="mt-3 space-y-1.5">
                              {room.previewLines.map((line) => (
                                <div
                                  key={line.left}
                                  className="flex items-center justify-between font-mono text-[11.5px]"
                                >
                                  <span className="text-neutral-400">{line.left}</span>
                                  <span className="text-neutral-200 tabular-nums">
                                    {line.right}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Link>
                </div>
              );
            })}

            {/* Floating Cursor-Tracking Mini-Preview Thumbnail (Desktop) */}
            <AnimatePresence>
              {hoveredRoom && !reduce && (
                <motion.div
                  key={hoveredRoom.id}
                  style={{ x: smoothX, y: smoothY }}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.22, ease: fluidEase }}
                  className="pointer-events-none hidden lg:block absolute top-0 left-0 z-30 w-[320px] rounded-lg border border-white/15 bg-[#111110]/95 p-4 backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.75)]"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <span className="font-mono text-[11px] font-medium text-white">
                      {hoveredRoom.previewTitle}
                    </span>
                    <span className="font-mono text-[10.5px] text-[#E02B20]">
                      {hoveredRoom.previewMetric}
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-[10.5px] leading-relaxed text-neutral-400">
                    {hoveredRoom.previewMeta}
                  </p>
                  <div className="mt-3 space-y-1.5 border-t border-white/[0.06] pt-2.5">
                    {hoveredRoom.previewLines.map((line) => (
                      <div
                        key={line.left}
                        className="flex items-center justify-between font-mono text-[11px]"
                      >
                        <span className="text-neutral-400 truncate pr-3">{line.left}</span>
                        <span className="text-white font-medium tabular-nums shrink-0">
                          {line.right}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   SECTION 04: CLOSING WORKSPACE ENTRY
   ============================================================================ */

function ClosingWorkspaceFrame({
  workspaceHref,
  hasClerk,
}: {
  workspaceHref: string;
  hasClerk: boolean;
}) {
  return (
    <section className="relative border-t border-white/[0.08] pt-24 pb-16 md:pt-32 md:pb-20">
      <div className="landing-wrap">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="text-[clamp(40px,6.8vw,84px)] font-medium tracking-[-0.05em] text-[#F5F3ED] leading-[0.98]"
            style={{ fontFamily: 'var(--landing-display)' }}
          >
            Brief. Quote. <span className="text-[#E02B20]">Invoice. Paid.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-lg text-[16px] sm:text-[17px] leading-relaxed text-neutral-400">
            Step into your operations desk and keep every client, rental, and tax invoice on one ledger.
          </p>

          <div className="mt-9 flex justify-center">
            <Link
              href={workspaceHref}
              className="group inline-flex items-center justify-center gap-3 rounded-md bg-[#E02B20] px-7 py-4 font-mono text-[12.5px] font-medium tracking-[0.08em] text-white uppercase no-underline transition-all duration-200 hover:bg-[#c61c2e]"
            >
              <span>Enter Workspace</span>
              <span
                aria-hidden="true"
                className="inline-flex transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>

          {/* Direct Quick-Links */}
          <nav
            aria-label="Direct workspace desks"
            className="mt-8 flex flex-wrap items-center justify-center gap-4 font-mono text-[11.5px] tracking-[0.06em] text-neutral-500"
          >
            <Link
              href={hasClerk ? '/sign-in' : '/clients'}
              className="text-neutral-400 no-underline transition-colors duration-150 hover:text-white"
            >
              Clients
            </Link>
            <span aria-hidden="true" className="text-white/15">
              ·
            </span>
            <Link
              href={hasClerk ? '/sign-in' : '/quotations'}
              className="text-neutral-400 no-underline transition-colors duration-150 hover:text-white"
            >
              Quotations
            </Link>
            <span aria-hidden="true" className="text-white/15">
              ·
            </span>
            <Link
              href={hasClerk ? '/sign-in' : '/invoices'}
              className="text-neutral-400 no-underline transition-colors duration-150 hover:text-white"
            >
              Invoices
            </Link>
            <span aria-hidden="true" className="text-white/15">
              ·
            </span>
            <Link
              href={hasClerk ? '/sign-in' : '/operations'}
              className="text-neutral-400 no-underline transition-colors duration-150 hover:text-white"
            >
              Operations
            </Link>
          </nav>
        </div>

        {/* Minimal Editorial Colophon */}
        <footer className="mt-20 border-t border-white/[0.08] pt-7 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-neutral-500">
          <span>Collage · Corporate Marketing, Events, Advertising & Equipment Rentals</span>
          <span>Accra, Ghana · GETFund 2.5% · NHIL 2.5% · GRA VAT 15.0%</span>
        </footer>
      </div>
    </section>
  );
}

/* ============================================================================
   MAIN WELCOME COMPONENT
   ============================================================================ */

export function Welcome({ hasClerk }: { hasClerk: boolean }) {
  const workspaceHref = hasClerk ? '/sign-in' : '/dashboard';
  const reduce = useReducedMotion();

  return (
    <div className="landing min-h-[100dvh] overflow-x-hidden">
      <header className="landing-nav sticky top-0 z-30">
        <div className="landing-wrap flex items-center justify-between gap-4 py-4">
          <Link href="/" aria-label="Collage home">
            <Brand />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Landing">
            <a href="#workspace" className="landing-link hidden sm:inline-flex">
              Workspace
            </a>
            {hasClerk ? (
              <>
                <Link href="/sign-in" className="landing-link">
                  Sign in
                </Link>
                <Link href="/sign-up" className="landing-cta landing-cta--ghost">
                  Create account
                </Link>
              </>
            ) : (
              <Link href="/dashboard" className="landing-cta landing-cta--solid">
                Enter your workspace
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="landing-hero landing-wrap">
          <div className="landing-hero__copy">
            <FadeIn delay={0.06}>
              <p className="landing-kicker">Collat</p>
            </FadeIn>
            <h1 className="landing-headline">
              <LineReveal delay={0.16}>From first brief</LineReveal>
              <LineReveal delay={0.3}>
                to <span className="landing-headline__accent">paid in full.</span>
              </LineReveal>
            </h1>
            <FadeIn delay={0.68} y={8}>
              <p className="landing-lede">
                Keep every part of the job connected. Clients, quotations, invoices and payments, on one desk.
              </p>
            </FadeIn>
            <FadeIn delay={0.84} className="landing-actions" y={8}>
              <Link href={workspaceHref} className="landing-cta landing-cta--solid">
                Enter your workspace <ArrowRight size={16} aria-hidden="true" />
              </Link>
              {hasClerk && (
                <Link href="/sign-up" className="landing-cta landing-cta--ghost">
                  Create account
                </Link>
              )}
            </FadeIn>
          </div>
          <motion.div
            className="landing-hero__visual"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.08, ease }}
          >
            <LandingMark />
          </motion.div>
        </section>

        <section className="landing-marquee" aria-label="Collat capabilities">
          <div className="landing-marquee__track">
            {[...services, ...services].map((service, i) => (
              <span key={`${service}-${i}`} className="landing-marquee__item">
                {service}
                <i aria-hidden="true" />
              </span>
            ))}
          </div>
        </section>

        {/* Deep Obsidian Canvas Below Hero */}
        <div className="relative bg-[#0E0D0C] text-[#F5F3ED]">
          {/* Section 02: The Living Thread Document & Financial Ledger */}
          <LivingThreadStage workspaceHref={workspaceHref} />

          {/* Section 03: The Four Workspace Rooms */}
          <WorkspaceRoomsDirectory hasClerk={hasClerk} />

          {/* Section 04: Workspace Entry & Colophon */}
          <ClosingWorkspaceFrame workspaceHref={workspaceHref} hasClerk={hasClerk} />
        </div>
      </main>
    </div>
  );
}
