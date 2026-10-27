import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion';
import { ArrowRight, ArrowUpRight, Check, Minus, Plus, RotateCcw } from 'lucide-react';
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

function formatGhs(amount: number) {
  return `GHS ${amount.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* ============================================================================
   SECTION 1: THE LIVING THREAD INTERACTIVE ENGINE
   ============================================================================ */

interface QuoteLineItem {
  id: string;
  title: string;
  detail: string;
  unit: string;
  qty: number;
  days: number;
  rate: number;
}

const BASE_LINE_ITEMS: QuoteLineItem[] = [
  {
    id: 'wayfinding',
    title: 'Wayfinding Pylons & Directional Totems',
    detail: 'Double-sided brushed aluminium & UV architectural print',
    unit: 'Units',
    qty: 6,
    days: 1,
    rate: 850,
  },
  {
    id: 'poles',
    title: 'Telescopic Pole Rentals & Forecourt Rigging',
    detail: '4.5m weighted aluminium poles with ground bases',
    unit: 'Sets',
    qty: 8,
    days: 3,
    rate: 150,
  },
  {
    id: 'uv-prints',
    title: 'Large-Format UV Prints & Stage Fascia',
    detail: 'Main auditorium backdrop & podium branding package',
    unit: 'Lots',
    qty: 2,
    days: 1,
    rate: 1400,
  },
];

const STAGE_TABS = [
  { index: 0, label: '[ 01 Contact Entry ]' },
  { index: 1, label: '[ 02 Quotation Engine ]' },
  { index: 2, label: '[ 03 Tax Invoice & Cleared ]' },
] as const;

function LivingThreadStage({ workspaceHref }: { workspaceHref: string }) {
  const [activeStage, setActiveStage] = useState<0 | 1 | 2>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [qtyOverrides, setQtyOverrides] = useState<Record<string, number>>({});
  const [dayOverrides, setDayOverrides] = useState<Record<string, number>>({});
  const reduce = useReducedMotion();

  useEffect(() => {
    if (isPaused || reduce) return;
    const timer = window.setInterval(() => {
      setActiveStage((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [isPaused, reduce]);

  const computedItems = BASE_LINE_ITEMS.map((item) => {
    const qty = qtyOverrides[item.id] ?? item.qty;
    const days = dayOverrides[item.id] ?? item.days;
    const lineTotal = qty * days * item.rate;
    return { ...item, qty, days, lineTotal };
  });

  // Base math: 5,100 + 3,600 + 2,800 = 11,500.00
  // + 2.5% GETFund (287.50) + 2.5% NHIL (287.50) = 12,075.00 Taxable
  // + 15% VAT (1,811.25) = GHS 13,886.25
  const subtotal = computedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const getfund = subtotal * 0.025;
  const nhil = subtotal * 0.025;
  const taxableBase = subtotal + getfund + nhil;
  const vat = taxableBase * 0.15;
  const grandTotal = taxableBase + vat;

  const isModified =
    Object.keys(qtyOverrides).length > 0 || Object.keys(dayOverrides).length > 0;

  const adjustQty = (id: string, base: number, delta: number) => {
    setIsPaused(true);
    setQtyOverrides((prev) => {
      const current = prev[id] ?? base;
      return { ...prev, [id]: Math.max(1, Math.min(24, current + delta)) };
    });
  };

  const adjustDays = (id: string, base: number, delta: number) => {
    setIsPaused(true);
    setDayOverrides((prev) => {
      const current = prev[id] ?? base;
      return { ...prev, [id]: Math.max(1, Math.min(14, current + delta)) };
    });
  };

  const resetMath = () => {
    setQtyOverrides({});
    setDayOverrides({});
  };

  const bankTranche = grandTotal * 0.65;
  const momoTranche = grandTotal - bankTranche;

  return (
    <section
      id="workspace"
      className="relative pt-24 pb-28 md:pt-32 md:pb-36"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="landing-wrap">
        {/* Centered Editorial Lead-In */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[11px] font-medium tracking-[0.22em] text-[#E02B20] uppercase">
            The Living Thread
          </p>
          <h2
            className="mt-4 text-[clamp(34px,4.8vw,60px)] font-medium tracking-[-0.045em] text-[#F5F3ED] leading-[1.02]"
            style={{ fontFamily: 'var(--landing-display)' }}
          >
            One client. <span className="text-[#E02B20]">One living thread.</span> Paid, without loose ends.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-neutral-400">
            Every engagement begins as a single client profile, expands into a statutory Ghana quotation, and settles as a reconciled tax invoice on the same sheet.
          </p>
        </div>

        {/* Sleek Horizontal Breadcrumb / Tab Bar Centered Above Stage */}
        <div className="mt-12 flex flex-col items-center">
          <div
            role="tablist"
            aria-label="Document lifecycle stages"
            className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-2 py-1.5"
          >
            {STAGE_TABS.map((tab, idx) => {
              const isActive = activeStage === tab.index;
              return (
                <div key={tab.label} className="flex items-center gap-2 sm:gap-4">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setActiveStage(tab.index);
                      setIsPaused(true);
                    }}
                    className={`relative px-3 py-2.5 font-mono text-[12px] sm:text-[13px] tracking-[0.04em] transition-colors duration-300 cursor-pointer ${
                      isActive
                        ? 'text-white font-semibold'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="living-thread-active-hairline"
                        className="absolute inset-x-0 bottom-0 h-[2px] bg-[#E02B20] shadow-[0_0_16px_rgba(224,43,32,0.85)]"
                        transition={{ duration: 0.45, ease: fluidEase }}
                      />
                    )}
                  </button>
                  {idx < STAGE_TABS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="hidden sm:inline-block font-mono text-[11px] tracking-[-0.08em] text-neutral-600 select-none"
                    >
                      ———&gt;
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Central Interactive Document (Glass & Paper Hybrid) */}
        <motion.div
          layout
          transition={{ duration: 0.5, ease: fluidEase }}
          className="mx-auto mt-8 max-w-4xl border border-white/10 bg-neutral-900/60 backdrop-blur-xl shadow-[0_32px_90px_rgba(0,0,0,0.55)] overflow-hidden"
        >
          {/* Persistent Document Sheet Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4 sm:px-9 bg-white/[0.015]">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#E02B20]" />
              <span className="font-mono text-[11px] tracking-[0.14em] text-neutral-300 uppercase">
                Collage Operations Desk · Accra
              </span>
            </div>
            <div className="flex items-center gap-5 font-mono text-[11px] text-neutral-400">
              <span>Account: Ecobank Ghana PLC</span>
              <span className="text-white/20">|</span>
              <span className="text-[#F5F3ED] font-medium tabular-nums">
                {formatGhs(grandTotal)}
              </span>
            </div>
          </div>

          {/* Morphing Document Canvas */}
          <div className="p-6 sm:p-10 min-h-[430px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {activeStage === 0 && (
                <motion.div
                  key="stage-client"
                  initial={reduce ? false : { opacity: 0, y: 14, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={reduce ? {} : { opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={{ duration: 0.42, ease: fluidEase }}
                  className="flex flex-col justify-between gap-8 flex-1"
                >
                  {/* Bespoke Swiss Corporate Profile Header */}
                  <div className="flex flex-wrap items-start justify-between gap-6 border-b border-white/10 pb-7">
                    <div>
                      <p className="font-mono text-[11px] tracking-[0.16em] text-neutral-400 uppercase">
                        Corporate Client Profile
                      </p>
                      <h3
                        className="mt-2 text-3xl sm:text-4xl font-medium tracking-[-0.035em] text-[#F5F3ED]"
                        style={{ fontFamily: 'var(--landing-display)' }}
                      >
                        Ecobank Ghana PLC
                      </h3>
                      <p className="mt-1.5 text-[14px] text-neutral-400">
                        Banking & Financial Services · Head Office Account
                      </p>
                    </div>

                    <div className="border border-white/10 bg-white/[0.02] px-4 py-2.5 text-right">
                      <span className="block font-mono text-[10px] tracking-[0.16em] text-neutral-500 uppercase">
                        Taxpayer Identification
                      </span>
                      <span className="mt-0.5 block font-mono text-[13px] font-semibold tracking-[0.06em] text-[#F5F3ED]">
                        TIN · C0004829104
                      </span>
                    </div>
                  </div>

                  {/* Swiss Business Card 4-Cell Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-l border-white/10">
                    <div className="border-r border-b border-white/10 p-5">
                      <span className="block font-mono text-[10px] tracking-[0.16em] text-neutral-500 uppercase">
                        Contact Person
                      </span>
                      <strong className="mt-1.5 block text-[16px] font-medium text-[#F5F3ED]">
                        Nana Ama Mensah
                      </strong>
                      <span className="mt-0.5 block text-[13px] text-neutral-400">
                        Head of Corporate Brand & Spaces
                      </span>
                    </div>

                    <div className="border-r border-b border-white/10 p-5">
                      <span className="block font-mono text-[10px] tracking-[0.16em] text-neutral-500 uppercase">
                        Location
                      </span>
                      <strong className="mt-1.5 block text-[16px] font-medium text-[#F5F3ED]">
                        2 Morocco Lane, Off Independence Ave
                      </strong>
                      <span className="mt-0.5 block text-[13px] text-neutral-400">
                        Ridge, Accra · Greater Accra Region
                      </span>
                    </div>

                    <div className="border-r border-b border-white/10 p-5">
                      <span className="block font-mono text-[10px] tracking-[0.16em] text-neutral-500 uppercase">
                        Direct Dispatch & Correspondence
                      </span>
                      <strong className="mt-1.5 block font-mono text-[14px] font-medium text-[#F5F3ED]">
                        +233 24 431 8902
                      </strong>
                      <span className="mt-0.5 block font-mono text-[12.5px] text-neutral-400">
                        n.mensah@ecobank.com.gh
                      </span>
                    </div>

                    <div className="border-r border-b border-white/10 p-5">
                      <span className="block font-mono text-[10px] tracking-[0.16em] text-neutral-500 uppercase">
                        Attached Project Brief
                      </span>
                      <strong className="mt-1.5 block text-[15px] font-medium text-[#F5F3ED]">
                        Annual Summit Wayfinding, Pole Rentals & UV Prints
                      </strong>
                      <span className="mt-0.5 block font-mono text-[12px] text-[#E02B20]">
                        3 Line Items Scoped · {formatGhs(grandTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Sheet Footer Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                    <span className="font-mono text-[11px] text-neutral-400">
                      Permanent client record linked to all future quotes & tax invoices
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStage(1);
                        setIsPaused(true);
                      }}
                      className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.04] px-4 py-2 font-mono text-[11px] font-medium tracking-[0.08em] text-[#F5F3ED] uppercase transition-all duration-300 hover:border-[#E02B20] hover:bg-[#E02B20] hover:text-white cursor-pointer"
                    >
                      Open Quotation Engine <ArrowRight size={13} />
                    </button>
                  </div>
                </motion.div>
              )}

              {activeStage === 1 && (
                <motion.div
                  key="stage-quotation"
                  initial={reduce ? false : { opacity: 0, y: 14, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={reduce ? {} : { opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={{ duration: 0.42, ease: fluidEase }}
                  className="flex flex-col justify-between gap-6 flex-1"
                >
                  {/* Quotation Sheet Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[12px] font-medium text-[#E02B20]">
                          QT00241026.01
                        </span>
                        <span className="text-white/20">·</span>
                        <span className="font-mono text-[11px] text-neutral-400">
                          Ecobank Ghana PLC
                        </span>
                      </div>
                      <h3
                        className="mt-1.5 text-2xl sm:text-3xl font-medium tracking-[-0.03em] text-[#F5F3ED]"
                        style={{ fontFamily: 'var(--landing-display)' }}
                      >
                        Summit Wayfinding, Pole Rentals & UV Print Package
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {isModified && (
                        <button
                          type="button"
                          onClick={resetMath}
                          className="inline-flex items-center gap-1.5 border border-white/10 px-2.5 py-1.5 font-mono text-[10px] tracking-[0.08em] text-neutral-300 uppercase hover:border-white/30 cursor-pointer"
                        >
                          <RotateCcw size={11} /> Reset
                        </button>
                      )}
                      <div className="border border-white/10 bg-white/[0.02] px-3.5 py-2 text-right font-mono text-[10.5px] text-neutral-300">
                        <div>ISSUED · 24 OCT 2026</div>
                        <div className="text-neutral-500">STATUTORY GHANA LEVIES</div>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="border border-white/10">
                    <div className="hidden sm:grid sm:grid-cols-[1.8fr_88px_88px_110px_125px] items-center gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-2.5 font-mono text-[10px] tracking-[0.14em] text-neutral-400 uppercase">
                      <span>Scope Description</span>
                      <span className="text-center">Qty</span>
                      <span className="text-center">Days</span>
                      <span className="text-right">Unit Rate</span>
                      <span className="text-right">Line Total</span>
                    </div>

                    {computedItems.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-1 sm:grid-cols-[1.8fr_88px_88px_110px_125px] items-center gap-3 border-b border-white/10 last:border-b-0 px-4 py-3.5"
                      >
                        <div>
                          <div className="text-[14px] font-medium text-[#F5F3ED]">
                            {item.title}
                          </div>
                          <div className="text-[12px] text-neutral-500">{item.detail}</div>
                        </div>

                        <div className="flex items-center justify-between border border-white/10 bg-black/30 px-1.5 py-1">
                          <button
                            type="button"
                            aria-label={`Decrease ${item.title} quantity`}
                            onClick={() => adjustQty(item.id, item.qty, -1)}
                            className="p-1 text-neutral-400 hover:text-white cursor-pointer"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="font-mono text-[12px] font-medium text-[#F5F3ED] tabular-nums">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase ${item.title} quantity`}
                            onClick={() => adjustQty(item.id, item.qty, 1)}
                            className="p-1 text-neutral-400 hover:text-white cursor-pointer"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between border border-white/10 bg-black/30 px-1.5 py-1">
                          <button
                            type="button"
                            aria-label={`Decrease ${item.title} days`}
                            onClick={() => adjustDays(item.id, item.days, -1)}
                            className="p-1 text-neutral-400 hover:text-white cursor-pointer"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="font-mono text-[12px] font-medium text-[#F5F3ED] tabular-nums">
                            {item.days}d
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase ${item.title} days`}
                            onClick={() => adjustDays(item.id, item.days, 1)}
                            className="p-1 text-neutral-400 hover:text-white cursor-pointer"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <div className="text-right font-mono text-[12.5px] text-neutral-300 tabular-nums">
                          {formatGhs(item.rate)}
                        </div>

                        <div className="text-right font-mono text-[13px] font-semibold text-[#F5F3ED] tabular-nums">
                          {formatGhs(item.lineTotal)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Automated Ghana Statutory Tax Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 border-t border-l border-white/10">
                    <div className="border-r border-b border-white/10 p-3.5">
                      <span className="block font-mono text-[10px] tracking-[0.12em] text-neutral-400 uppercase">
                        Subtotal
                      </span>
                      <strong className="mt-1 block font-mono text-[13.5px] text-[#F5F3ED] tabular-nums">
                        {formatGhs(subtotal)}
                      </strong>
                    </div>
                    <div className="border-r border-b border-white/10 p-3.5">
                      <span className="block font-mono text-[10px] tracking-[0.12em] text-neutral-400 uppercase">
                        2.5% GETFund
                      </span>
                      <strong className="mt-1 block font-mono text-[13.5px] text-[#F5F3ED] tabular-nums">
                        {formatGhs(getfund)}
                      </strong>
                    </div>
                    <div className="border-r border-b border-white/10 p-3.5">
                      <span className="block font-mono text-[10px] tracking-[0.12em] text-neutral-400 uppercase">
                        2.5% NHIL
                      </span>
                      <strong className="mt-1 block font-mono text-[13.5px] text-[#F5F3ED] tabular-nums">
                        {formatGhs(nhil)}
                      </strong>
                    </div>
                    <div className="border-r border-b border-white/10 p-3.5">
                      <span className="block font-mono text-[10px] tracking-[0.12em] text-neutral-400 uppercase">
                        15% VAT
                      </span>
                      <strong className="mt-1 block font-mono text-[13.5px] text-[#F5F3ED] tabular-nums">
                        {formatGhs(vat)}
                      </strong>
                    </div>
                    <div className="col-span-2 sm:col-span-1 border-r border-b border-white/10 bg-[#E02B20]/15 p-3.5">
                      <span className="block font-mono text-[10px] tracking-[0.12em] text-[#ff8982] uppercase">
                        Total Incl. Tax
                      </span>
                      <strong className="mt-1 block font-mono text-[14.5px] font-semibold text-white tabular-nums">
                        {formatGhs(grandTotal)}
                      </strong>
                    </div>
                  </div>

                  {/* Sheet Footer Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
                    <span className="font-mono text-[11px] text-neutral-400">
                      Subtotal + 2.5% GETFund + 2.5% NHIL + 15% VAT = {formatGhs(grandTotal)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStage(2);
                        setIsPaused(true);
                      }}
                      className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.04] px-4 py-2 font-mono text-[11px] font-medium tracking-[0.08em] text-[#F5F3ED] uppercase transition-all duration-300 hover:border-[#E02B20] hover:bg-[#E02B20] hover:text-white cursor-pointer"
                    >
                      Convert to Tax Invoice <ArrowRight size={13} />
                    </button>
                  </div>
                </motion.div>
              )}

              {activeStage === 2 && (
                <motion.div
                  key="stage-invoice"
                  initial={reduce ? false : { opacity: 0, y: 14, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={reduce ? {} : { opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={{ duration: 0.42, ease: fluidEase }}
                  className="flex flex-col justify-between gap-6 flex-1"
                >
                  {/* Tax Invoice Header + CLEARED IN FULL Seal */}
                  <div className="flex flex-wrap items-start justify-between gap-6 border-b border-white/10 pb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[12px] font-medium text-[#E02B20]">
                          INV 00221026.01
                        </span>
                        <span className="text-white/20">·</span>
                        <span className="font-mono text-[11px] text-neutral-400">
                          Converted from QT00241026.01
                        </span>
                      </div>
                      <h3
                        className="mt-1.5 text-2xl sm:text-3xl font-medium tracking-[-0.03em] text-[#F5F3ED]"
                        style={{ fontFamily: 'var(--landing-display)' }}
                      >
                        Ecobank Ghana PLC — Reconciled Tax Invoice
                      </h3>
                    </div>

                    {/* Emerald & Vermilion CLEARED IN FULL Seal */}
                    <div className="flex items-center gap-3 border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                        <Check size={14} />
                      </span>
                      <div>
                        <span className="block font-mono text-[11px] font-semibold tracking-[0.16em] text-emerald-300 uppercase">
                          CLEARED IN FULL
                        </span>
                        <span className="block font-mono text-[10px] tracking-[0.08em] text-emerald-400/80">
                          100% SETTLED · BALANCE GHS 0.00
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reconciliation Summary Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 border border-white/10 bg-white/[0.02]">
                    <div className="border-b sm:border-b-0 sm:border-r border-white/10 p-4">
                      <span className="block font-mono text-[10px] tracking-[0.14em] text-neutral-400 uppercase">
                        Invoice Total (Incl. Tax)
                      </span>
                      <strong className="mt-1 block font-mono text-[18px] font-semibold text-[#F5F3ED] tabular-nums">
                        {formatGhs(grandTotal)}
                      </strong>
                    </div>
                    <div className="border-b sm:border-b-0 sm:border-r border-white/10 p-4">
                      <span className="block font-mono text-[10px] tracking-[0.14em] text-neutral-400 uppercase">
                        Total Reconciled
                      </span>
                      <strong className="mt-1 block font-mono text-[18px] font-semibold text-emerald-400 tabular-nums">
                        {formatGhs(grandTotal)}
                      </strong>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <span className="block font-mono text-[10px] tracking-[0.14em] text-neutral-400 uppercase">
                          Settlement Stamp
                        </span>
                        <strong className="mt-1 block font-mono text-[12px] text-[#F5F3ED] uppercase">
                          Bank Transfer + Mobile Money
                        </strong>
                      </div>
                      <span className="border border-[#E02B20]/50 bg-[#E02B20]/15 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-[#ff8982] uppercase">
                        VERIFIED
                      </span>
                    </div>
                  </div>

                  {/* Payment Reconciliations Log */}
                  <div className="border border-white/10 divide-y divide-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                      <div className="flex items-start gap-3.5">
                        <span className="mt-0.5 font-mono text-[11px] font-semibold text-[#E02B20]">
                          01
                        </span>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <strong className="text-[14px] font-medium text-[#F5F3ED]">
                              Bank Transfer · GCB Corporate Treasury
                            </strong>
                            <span className="border border-white/15 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-neutral-300 uppercase">
                              BANK TRANSFER STAMP
                            </span>
                          </div>
                          <span className="mt-1 block font-mono text-[11.5px] text-neutral-400">
                            25 Oct 2026 · Ref: TRX-884920-ECO · 65% Mobilization Tranche
                          </span>
                        </div>
                      </div>
                      <div className="font-mono text-[14px] font-semibold text-[#F5F3ED] tabular-nums">
                        {formatGhs(bankTranche)}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                      <div className="flex items-start gap-3.5">
                        <span className="mt-0.5 font-mono text-[11px] font-semibold text-emerald-400">
                          02
                        </span>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <strong className="text-[14px] font-medium text-[#F5F3ED]">
                              MTN Mobile Money · Corporate Settlement
                            </strong>
                            <span className="border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300 uppercase">
                              MOBILE MONEY STAMP
                            </span>
                          </div>
                          <span className="mt-1 block font-mono text-[11.5px] text-neutral-400">
                            27 Oct 2026 · Ref: MOMO-29481042 · 35% Final Closing Tranche
                          </span>
                        </div>
                      </div>
                      <div className="font-mono text-[14px] font-semibold text-emerald-400 tabular-nums">
                        {formatGhs(momoTranche)}
                      </div>
                    </div>
                  </div>

                  {/* Sheet Footer Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
                    <span className="font-mono text-[11px] text-neutral-400">
                       Auditable receipt trail attached to Ecobank Ghana PLC
                    </span>
                    <Link
                      href={workspaceHref}
                      className="inline-flex items-center gap-2 bg-[#E02B20] px-4 py-2 font-mono text-[11px] font-semibold tracking-[0.08em] text-white uppercase transition-all duration-300 hover:bg-[#c61c2e]"
                    >
                      Inspect in Workspace <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================================
   SECTION 2: THE FOUR WORKSPACE ROOMS (HAYNES-STYLE INTERACTIVE DIRECTORY)
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
    previewMeta: 'Subtotal GHS 11,500 + GETFund 287.50 + NHIL 287.50 + VAT 1,811.25',
    previewLines: [
      { left: 'Wayfinding Pylons (6 × 1d)', right: 'GHS 5,100.00' },
      { left: 'Telescopic Pole Rentals (8 × 3d)', right: 'GHS 3,600.00' },
      { left: 'Large-Format UV Prints (2 × 1d)', right: 'GHS 2,800.00' },
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
    <section className="relative py-28 md:py-36 border-t border-neutral-800/80">
      <div className="landing-wrap">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column (Sticky) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <p className="font-mono text-[11px] font-semibold tracking-[0.22em] text-[#E02B20] uppercase">
              THE SYSTEM
            </p>
            <h2
              className="mt-4 text-[clamp(32px,4vw,52px)] font-medium tracking-[-0.045em] text-[#F5F3ED] leading-[1.03]"
              style={{ fontFamily: 'var(--landing-display)' }}
            >
              Four purpose-built desks. One continuous record.
            </h2>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-neutral-400">
              From the moment a brief arrives to the final bank transfer or Mobile Money receipt, every room reads and writes to the same underlying job thread.
            </p>
          </div>

          {/* Right Column: 4 Full-Width Stacked Rows + Floating Cursor Preview */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredRoom(null)}
            className="relative lg:col-span-7 border-b border-neutral-800"
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
                  className="group border-t border-neutral-800"
                >
                  <Link
                    href={targetHref}
                    onFocus={() => setActiveRoomId(room.id)}
                    className="block py-8 sm:py-10 no-underline focus:outline-none"
                  >
                    <div className="flex items-center justify-between gap-6">
                      {/* Row Text Shifts 12px Right on Hover */}
                      <div className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[12px]">
                        <h3
                          className="text-[clamp(24px,3vw,38px)] font-medium tracking-[-0.035em] text-[#F5F3ED] transition-colors duration-300 group-hover:text-white"
                          style={{ fontFamily: 'var(--landing-display)' }}
                        >
                          {room.label}
                        </h3>
                        <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-neutral-400 transition-colors duration-300 group-hover:text-neutral-300">
                          {room.subtitle}
                        </p>
                      </div>

                      {/* Arrow Icon Rotates 45 Degrees on Hover */}
                      <span
                        aria-hidden="true"
                        className="flex h-11 w-11 shrink-0 items-center justify-center border border-neutral-800 text-neutral-400 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-45 group-hover:border-[#E02B20] group-hover:bg-[#E02B20] group-hover:text-white"
                      >
                        <ArrowUpRight size={20} />
                      </span>
                    </div>

                    {/* Clean Inline Preview Card Underneath (Responsive / Accessible) */}
                    <AnimatePresence initial={false}>
                      {isSelected && (
                        <motion.div
                          initial={reduce ? false : { height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={reduce ? {} : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.38, ease: fluidEase }}
                          className="overflow-hidden lg:hidden"
                        >
                          <div className="mt-5 border border-white/10 bg-neutral-900/80 p-4">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 font-mono text-[11px]">
                              <span className="text-[#F5F3ED] font-medium">
                                {room.previewTitle}
                              </span>
                              <span className="text-[#E02B20]">{room.previewMetric}</span>
                            </div>
                            <div className="mt-3 space-y-2">
                              {room.previewLines.map((line) => (
                                <div
                                  key={line.left}
                                  className="flex items-center justify-between font-mono text-[11.5px]"
                                >
                                  <span className="text-neutral-400">{line.left}</span>
                                  <span className="text-[#F5F3ED] tabular-nums">
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
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.28, ease: fluidEase }}
                  className="pointer-events-none hidden lg:block absolute top-0 left-0 z-30 w-[330px] border border-white/15 bg-neutral-950/90 p-5 backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.75)]"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="font-mono text-[11px] font-semibold tracking-[0.06em] text-[#F5F3ED]">
                      {hoveredRoom.previewTitle}
                    </span>
                    <span className="font-mono text-[10.5px] text-[#E02B20]">
                      {hoveredRoom.previewMetric}
                    </span>
                  </div>
                  <p className="mt-2.5 font-mono text-[10.5px] leading-relaxed text-neutral-400">
                    {hoveredRoom.previewMeta}
                  </p>
                  <div className="mt-3.5 space-y-2 border-t border-white/10 pt-3">
                    {hoveredRoom.previewLines.map((line) => (
                      <div
                        key={line.left}
                        className="flex items-center justify-between font-mono text-[11px]"
                      >
                        <span className="text-neutral-400 truncate pr-3">{line.left}</span>
                        <span className="text-[#F5F3ED] font-medium tabular-nums shrink-0">
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
   SECTION 3: ARCHITECTURAL CENTERED CLOSING FRAME / WORKSPACE ENTRY
   ============================================================================ */

function MagneticWorkspaceButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 20, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 220, damping: 20, mass: 0.4 });

  const handleMove = (e: MouseEvent<HTMLAnchorElement>) => {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - (rect.left + rect.width / 2);
    const offsetY = e.clientY - (rect.top + rect.height / 2);
    x.set(offsetX * 0.16);
    y.set(offsetY * 0.22);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div style={{ x: springX, y: springY }} className="inline-block">
      <Link
        ref={ref}
        href={href}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="group inline-flex items-center justify-center gap-4 bg-[#E02B20] px-9 py-5 font-mono text-[13.5px] font-semibold tracking-[0.08em] text-white uppercase no-underline transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03] hover:bg-[#c92218] shadow-[0_20px_50px_rgba(224,43,32,0.28)]"
      >
        <span>{children}</span>
        <span
          aria-hidden="true"
          className="inline-flex transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5"
        >
          →
        </span>
      </Link>
    </motion.div>
  );
}

function ClosingWorkspaceFrame({
  workspaceHref,
  hasClerk,
}: {
  workspaceHref: string;
  hasClerk: boolean;
}) {
  return (
    <section className="relative border-t border-neutral-800/80 pt-28 pb-20 md:pt-36 md:pb-24">
      <div className="landing-wrap">
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className="text-[clamp(44px,7.8vw,96px)] font-medium tracking-[-0.055em] text-[#F5F3ED] leading-[0.96]"
            style={{ fontFamily: 'var(--landing-display)' }}
          >
            Brief. Quote. <span className="text-[#E02B20]">Invoice. Paid.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-[17px] sm:text-[18px] leading-relaxed text-neutral-400">
            Step into your operations desk and keep every project connected.
          </p>

          <div className="mt-10 flex justify-center">
            <MagneticWorkspaceButton href={workspaceHref}>
              Enter your workspace
            </MagneticWorkspaceButton>
          </div>

          {/* Direct Quick-Links in Muted Tabular Font */}
          <nav
            aria-label="Direct workspace desks"
            className="mt-9 flex flex-wrap items-center justify-center gap-3 font-mono text-[12px] tracking-[0.06em] text-neutral-500 tabular-nums"
          >
            <Link
              href={hasClerk ? '/sign-in' : '/clients'}
              className="text-neutral-400 no-underline transition-colors duration-200 hover:text-white"
            >
              [ Clients ]
            </Link>
            <span aria-hidden="true" className="text-neutral-700">
              ·
            </span>
            <Link
              href={hasClerk ? '/sign-in' : '/quotations'}
              className="text-neutral-400 no-underline transition-colors duration-200 hover:text-white"
            >
              [ Quotations ]
            </Link>
            <span aria-hidden="true" className="text-neutral-700">
              ·
            </span>
            <Link
              href={hasClerk ? '/sign-in' : '/invoices'}
              className="text-neutral-400 no-underline transition-colors duration-200 hover:text-white"
            >
              [ Invoices ]
            </Link>
            <span aria-hidden="true" className="text-neutral-700">
              ·
            </span>
            <Link
              href={hasClerk ? '/sign-in' : '/operations'}
              className="text-neutral-400 no-underline transition-colors duration-200 hover:text-white"
            >
              [ Operations ]
            </Link>
          </nav>
        </div>

        {/* Minimal Editorial Colophon */}
        <footer className="mt-24 border-t border-neutral-800/80 pt-8 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-neutral-500">
          <span>Collage · Corporate Marketing, Events, Advertising & Equipment Rentals</span>
          <span>Accra, Ghana · GETFund 2.5% · NHIL 2.5% · VAT 15%</span>
        </footer>
      </div>
    </section>
  );
}

/* ============================================================================
   MAIN WELCOME COMPONENT (HERO UNTOUCHED)
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

        {/* Unified Deep Refined Obsidian (#0E0D0C) Canvas Below Hero with Deliberate Diagonal Curtain Mask */}
        <div className="relative bg-[#0E0D0C] text-[#F5F3ED]">
          {/* Deliberate Full-Width Diagonal / Curtain Mask Transition from Warm Linen */}
          <div
            aria-hidden="true"
            className="pointer-events-none relative h-14 sm:h-20 w-full overflow-hidden bg-[#e9dfd2]"
          >
            <svg
              viewBox="0 0 1440 80"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full fill-[#0E0D0C]"
            >
              <polygon points="0,80 1440,0 1440,80" />
            </svg>
          </div>

          {/* Subtle Ambient Radial Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(ellipse_at_top,rgba(224,43,32,0.08),transparent_65%)]"
          />

          {/* Section 1: The Living Thread Interactive Engine */}
          <LivingThreadStage workspaceHref={workspaceHref} />

          {/* Section 2: The Four Workspace Rooms */}
          <WorkspaceRoomsDirectory hasClerk={hasClerk} />

          {/* Section 3: The Call to Action / Workspace Entry */}
          <ClosingWorkspaceFrame workspaceHref={workspaceHref} hasClerk={hasClerk} />
        </div>
      </main>
    </div>
  );
}
