import { useState, useMemo } from 'react';
import {
  Calculator,
  CheckCircle2,
  Clock,
  Coins,
  FileCheck,
  Send,
  Shield,
  Sparkles,
} from 'lucide-react';
import type { ServiceCategory } from '@/data/portfolio-data';

interface ScopePreset {
  id: string;
  name: string;
  category: ServiceCategory;
  unitName: string;
  defaultQty: number;
  minQty: number;
  maxQty: number;
  baseRatePerUnit: number;
  turnaroundBaseDays: number;
  description: string;
}

const SCOPE_PRESETS: ScopePreset[] = [
  {
    id: 'flags',
    name: 'Telescopic Flagpole Fleet Deployment',
    category: 'telescopic_flags',
    unitName: 'Flagpole Kits (5m / 7m)',
    defaultQty: 10,
    minQty: 2,
    maxQty: 50,
    baseRatePerUnit: 180, // Daily rental / fabrication allocation
    turnaroundBaseDays: 3,
    description: 'Includes water-weighted bases, high-wind storm clips, and branded 110gsm knitted polyester fabric.',
  },
  {
    id: 'billboard',
    name: 'Highway Unipole Billboard Skin',
    category: 'billboards',
    unitName: 'Square Metres (550gsm UV Blackout)',
    defaultQty: 48,
    minQty: 18,
    maxQty: 150,
    baseRatePerUnit: 195,
    turnaroundBaseDays: 2,
    description: 'High-tensile perimeter reinforced eyelets with industrial night rigging crew across Accra and Kumasi.',
  },
  {
    id: 'wayfinding',
    name: 'Architectural Wayfinding Pylons & Totems',
    category: 'wayfinding',
    unitName: 'Totem Units (6063-T6 Aluminum)',
    defaultQty: 4,
    minQty: 1,
    maxQty: 20,
    baseRatePerUnit: 5400,
    turnaroundBaseDays: 10,
    description: 'Brushed aluminum with CNC internal solar/LED halo illumination and 3M directional vinyl.',
  },
  {
    id: 'stage',
    name: 'Grand Arena Stage & Box Truss Rigging',
    category: 'field_production',
    unitName: 'Modular Rigging Segments',
    defaultQty: 6,
    minQty: 2,
    maxQty: 24,
    baseRatePerUnit: 2800,
    turnaroundBaseDays: 4,
    description: 'TUV-certified aluminum trussing, ground support up to 10m, and acoustic baffle staging.',
  },
  {
    id: 'pavilion',
    name: 'Eco Brand Pavilion & Exhibition Booth',
    category: 'event_branding',
    unitName: 'Pavilion Footprint (10 sqm modules)',
    defaultQty: 3,
    minQty: 1,
    maxQty: 10,
    baseRatePerUnit: 6200,
    turnaroundBaseDays: 5,
    description: 'Modular structural steel, sustainable acoustic cladding, and rapid 48-hour event breakdown.',
  },
  {
    id: 'fleet',
    name: 'Corporate Fleet Commercial Vehicle Wrap',
    category: 'large_format_print',
    unitName: 'Vehicles (Full Cast Vinyl Wrap)',
    defaultQty: 5,
    minQty: 1,
    maxQty: 25,
    baseRatePerUnit: 3400,
    turnaroundBaseDays: 6,
    description: '3M cast vinyl with high-gloss UV laminate, heat-post cured for 36-month zero edge peeling.',
  },
];

interface ScopeEstimatorProps {
  onApplyEstimate: (category: ServiceCategory, estimateSummary: string) => void;
}

export function ScopeEstimator({ onApplyEstimate }: ScopeEstimatorProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('flags');
  const [quantity, setQuantity] = useState<number>(10);
  const [urgency, setUrgency] = useState<'standard' | 'priority' | 'emergency'>('standard');

  const activePreset = useMemo(() => {
    return SCOPE_PRESETS.find((p) => p.id === selectedPresetId) || SCOPE_PRESETS[0];
  }, [selectedPresetId]);

  const handleSelectPreset = (preset: ScopePreset) => {
    setSelectedPresetId(preset.id);
    setQuantity(preset.defaultQty);
  };

  const urgencyMultiplier = useMemo(() => {
    if (urgency === 'priority') return 1.2;
    if (urgency === 'emergency') return 1.4;
    return 1.0;
  }, [urgency]);

  const turnaroundDays = useMemo(() => {
    if (urgency === 'priority') {
      return Math.max(1, Math.round(activePreset.turnaroundBaseDays * 0.6));
    }
    if (urgency === 'emergency') {
      return Math.max(1, Math.round(activePreset.turnaroundBaseDays * 0.4));
    }
    return activePreset.turnaroundBaseDays;
  }, [urgency, activePreset]);

  // Financial computations following Ghana statutory tax regimen
  const financials = useMemo(() => {
    const rawSubtotal = quantity * activePreset.baseRatePerUnit * urgencyMultiplier;
    const getfund = Math.round(rawSubtotal * 0.025 * 100) / 100; // 2.5%
    const nhil = Math.round(rawSubtotal * 0.025 * 100) / 100; // 2.5%
    const vat = Math.round(rawSubtotal * 0.15 * 100) / 100; // 15.0%
    const total = Math.round((rawSubtotal + getfund + nhil + vat) * 100) / 100;

    return {
      subtotal: rawSubtotal,
      getfund,
      nhil,
      vat,
      total,
    };
  }, [quantity, activePreset, urgencyMultiplier]);

  const formattedEstimateText = useMemo(() => {
    return `Interactive Scope Estimate: ${activePreset.name}
Scope Quantity: ${quantity} ${activePreset.unitName}
Deployment Speed: ${urgency.toUpperCase()} (${turnaroundDays} business days)
Estimated Net Base: GHS ${financials.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
GRA Statutory Levies (GETFund 2.5% + NHIL 2.5% + VAT 15%): GHS ${(financials.getfund + financials.nhil + financials.vat).toLocaleString('en-US', { minimumFractionDigits: 2 })}
Estimated Total Budget: GHS ${financials.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}

Please contact us to finalize structural drawings and site survey schedule.`;
  }, [activePreset, quantity, urgency, turnaroundDays, financials]);

  const handleApply = () => {
    onApplyEstimate(activePreset.category, formattedEstimateText);
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-neutral-900/70 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
      {/* Decorative gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/40 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-red-300">
            <Calculator size={13} className="text-red-400" aria-hidden="true" />
            <span>Collage Interactive Scope & Budget Estimator</span>
          </div>
          <h3 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-white">
            Instant Turnaround & Ghana Statutory Cost Calculator
          </h3>
          <p className="mt-1 text-xs text-neutral-400">
            Select a core capability, adjust units, and simulate full GRA tax compliance in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-3.5 py-2">
          <Shield size={16} className="text-emerald-400 shrink-0" aria-hidden="true" />
          <div className="font-mono text-[11px] text-emerald-300">
            GETFund 2.5% · NHIL 2.5% · GRA VAT 15.0%
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Preset Selection & Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Preset Buttons */}
          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2.5">
              1. Select Production or Rental Service
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SCOPE_PRESETS.map((preset) => {
                const isSelected = preset.id === selectedPresetId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-red-500 bg-red-950/30 shadow-md shadow-red-950/40 text-white'
                        : 'border-white/10 bg-white/[0.02] text-neutral-300 hover:border-white/20 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="font-semibold text-xs text-white">
                      {preset.name}
                    </span>
                    <span className="mt-1 font-mono text-[10px] text-neutral-400">
                      From GHS {preset.baseRatePerUnit.toLocaleString('en-US')} / {preset.unitName.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">
              {activePreset.description}
            </p>
          </div>

          {/* Quantity Slider */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="quantity-slider" className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-300">
                2. Scope Quantity ({activePreset.unitName})
              </label>
              <span className="font-mono text-base font-bold text-red-400">
                {quantity} units
              </span>
            </div>
            <input
              id="quantity-slider"
              type="range"
              min={activePreset.minQty}
              max={activePreset.maxQty}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full accent-red-600 cursor-pointer h-2 bg-neutral-800 rounded-lg"
            />
            <div className="flex justify-between font-mono text-[10px] text-neutral-500 mt-1">
              <span>Min: {activePreset.minQty}</span>
              <span>Mid: {Math.round((activePreset.minQty + activePreset.maxQty) / 2)}</span>
              <span>Max: {activePreset.maxQty}</span>
            </div>
          </div>

          {/* Urgency Selector */}
          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              3. Production Schedule & Dispatch Speed
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setUrgency('standard')}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  urgency === 'standard'
                    ? 'border-red-500 bg-red-950/40 text-white'
                    : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white'
                }`}
              >
                <div className="font-mono text-xs font-semibold">Standard</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Regular Lead</div>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('priority')}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  urgency === 'priority'
                    ? 'border-amber-500 bg-amber-950/40 text-white'
                    : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white'
                }`}
              >
                <div className="font-mono text-xs font-semibold text-amber-300">Priority (+20%)</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Accelerated</div>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('emergency')}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  urgency === 'emergency'
                    ? 'border-red-500 bg-red-950/40 text-white'
                    : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white'
                }`}
              >
                <div className="font-mono text-xs font-semibold text-red-300">Emergency (+40%)</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">24h Express Rig</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Financial & Turnaround Ledger */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-white/15 bg-black/40 p-5 sm:p-6 shadow-inner">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-400">
                Estimated Timeline
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-amber-400">
                <Clock size={13} aria-hidden="true" />
                {turnaroundDays} Business Days
              </span>
            </div>

            {/* Itemized Calculation */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-neutral-300">
                <span>Base Production & Rigging:</span>
                <span className="font-mono font-medium text-white">
                  GHS {financials.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>GETFund Levy (2.5%):</span>
                <span className="font-mono">
                  GHS {financials.getfund.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>NHIL Levy (2.5%):</span>
                <span className="font-mono">
                  GHS {financials.nhil.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>GRA VAT (15.0%):</span>
                <span className="font-mono">
                  GHS {financials.vat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-neutral-400">
                    Total Estimated Budget
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    Includes all statutory Ghanaian levies
                  </div>
                </div>
                <div className="font-mono text-2xl font-black text-white">
                  GHS {financials.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-[11px] leading-relaxed text-neutral-400">
              <span className="font-semibold text-neutral-300">Collage Guarantee:</span> Fully itemized pro-forma invoice issued under GRA TIN 00211026. Includes structural mounting and insurance certificate.
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleApply}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-950 transition-all hover:bg-red-500 hover:shadow-red-900/50"
            >
              <Send size={14} aria-hidden="true" />
              <span>Auto-Fill Quote Enquiry with this Scope</span>
            </button>
            <div className="mt-2 text-center font-mono text-[10px] text-neutral-500">
              Transfers scope, unit volume, and tax computations directly into your RFP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}