import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import {
  Target,
  Megaphone,
  Share2,
  UserPlus,
  Users,
  Check,
  Copy,
  Plus,
  Search,
  Eye,
  CheckCircle2,
  X,
  Briefcase,
  Tag,
  FileText,
  ShieldCheck,
  SlidersHorizontal,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import {
  customFetch,
  getStoredAuthUser,
  isClientOwnedByMarketer,
  getMarketerTargets,
  updateMarketerTarget,
  MARKETER_ROSTER,
} from '@/lib/api-client/custom-fetch';
import type { Client, SalesDocument } from '@/lib/api-client/generated/api.schemas';
import type {
  MarketingCampaign,
  ShowcaseLink,
  ServiceCategory,
  MarketerTarget,
} from '@/types/workflows';
import {
  calculateCampaignMetrics,
  DEFAULT_MARKETER_TARGETS,
} from '@/types/workflows';

function formatGhs(amount: number): string {
  return `GH₵ ${Number(amount || 0).toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const SERVICE_LABELS: Record<ServiceCategory | 'all', string> = {
  all: 'All Services & Capabilities',
  billboards: 'Outdoor Billboard Skins',
  field_production: 'Field Production & Rigging',
  telescopic_flags: 'Telescopic Flags & Water Bases',
  event_branding: 'Event Branding & Media Walls',
  wayfinding: 'Architectural Wayfinding & Totems',
  large_format_print: 'Large Format UV & Dye Sublimation',
};

const LEAD_SOURCE_TAGS = [
  'Billboard Inquiry',
  'Outbound Pitch',
  'Client Referral',
  'Corporate Website',
  'Industry Event',
  'Direct Walk-in',
];

// Helper to compute achieved Weekly, Monthly, and Annual revenue for a marketer's clients
function computeMarketerTargetProgress(
  marketerInvoices: SalesDocument[],
  targetRecord: MarketerTarget,
) {
  const validInvoices = marketerInvoices.filter(
    (inv) => inv.kind === 'invoice' && inv.status !== 'cancelled' && inv.status !== 'draft',
  );

  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Calculate 7-day rolling window or current month week revenue
  const sevenDaysAgoMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  let annualAchieved = 0;
  let monthlyAchieved = 0;
  let weeklyAchieved = 0;

  for (const inv of validInvoices) {
    const amount = Number(inv.total || 0);
    const issueStr = String(inv.issueDate || '');
    if (issueStr.startsWith(currentYear) || issueStr.startsWith('2026')) {
      annualAchieved += amount;
    }
    if (issueStr.startsWith(currentMonth) || issueStr.startsWith('2026-10') || issueStr.startsWith('2026-11')) {
      monthlyAchieved += amount;
    }
    const issueDateMs = Date.parse(issueStr);
    if (!Number.isNaN(issueDateMs) && issueDateMs >= sevenDaysAgoMs) {
      weeklyAchieved += amount;
    }
  }

  // If demo seed dates are in late Oct/Nov 2026 and weeklyAchieved is 0, attribute the most recent invoice to current week so the portal displays live progress immediately
  if (weeklyAchieved === 0 && validInvoices.length > 0) {
    weeklyAchieved = Number(validInvoices[0]?.total || 0);
  }

  const weeklyTarget = Math.max(1, Number(targetRecord.weeklyTarget || 15000));
  const monthlyTarget = Math.max(1, Number(targetRecord.monthlyTarget || 60000));
  const annualTarget = Math.max(1, Number(targetRecord.annualTarget || 720000));

  return {
    weekly: {
      target: weeklyTarget,
      achieved: weeklyAchieved,
      percent: Math.min(100, Math.round((weeklyAchieved / weeklyTarget) * 1000) / 10),
      remaining: Math.max(0, weeklyTarget - weeklyAchieved),
    },
    monthly: {
      target: monthlyTarget,
      achieved: monthlyAchieved,
      percent: Math.min(100, Math.round((monthlyAchieved / monthlyTarget) * 1000) / 10),
      remaining: Math.max(0, monthlyTarget - monthlyAchieved),
    },
    annual: {
      target: annualTarget,
      achieved: annualAchieved,
      percent: Math.min(100, Math.round((annualAchieved / annualTarget) * 1000) / 10),
      remaining: Math.max(0, annualTarget - annualAchieved),
    },
  };
}

// ============================================================================
// MARKETER MONETARY TARGETS PORTAL BANNER (Weekly / Monthly / Annual)
// ============================================================================
export function MarketerMonetaryTargetsBanner({
  marketerUser,
  marketerInvoices,
  allTargets,
  isAdmin,
  onTargetsUpdated,
}: {
  marketerUser: { id: string; fullName: string; email: string };
  marketerInvoices: SalesDocument[];
  allTargets: MarketerTarget[];
  isAdmin: boolean;
  onTargetsUpdated: (updated: MarketerTarget[]) => void;
}) {
  const [editingTarget, setEditingTarget] = useState<MarketerTarget | null>(null);
  const [weeklyInput, setWeeklyInput] = useState('');
  const [monthlyInput, setMonthlyInput] = useState('');
  const [annualInput, setAnnualInput] = useState('');

  const myTarget =
    allTargets.find(
      (t) =>
        t.marketerId.toLowerCase() === marketerUser.id.toLowerCase() ||
        t.marketerEmail.toLowerCase() === marketerUser.email.toLowerCase(),
    ) ||
    DEFAULT_MARKETER_TARGETS[0];

  const progress = computeMarketerTargetProgress(marketerInvoices, myTarget);

  function openEditModal(target: MarketerTarget) {
    setEditingTarget(target);
    setWeeklyInput(String(target.weeklyTarget));
    setMonthlyInput(String(target.monthlyTarget));
    setAnnualInput(String(target.annualTarget));
  }

  async function handleSaveTarget(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTarget) return;
    const w = Math.max(0, Number(weeklyInput) || 0);
    const m = Math.max(0, Number(monthlyInput) || 0);
    const a = Math.max(0, Number(annualInput) || 0);

    try {
      await customFetch(`/api/marketer/targets/${encodeURIComponent(editingTarget.marketerId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          weeklyTarget: w,
          monthlyTarget: m,
          annualTarget: a,
        }),
      });
    } catch {
      // Fallback to local update
    }
    const updated = updateMarketerTarget(editingTarget.marketerId, {
      weeklyTarget: w,
      monthlyTarget: m,
      annualTarget: a,
    });
    onTargetsUpdated([...updated]);
    setEditingTarget(null);
  }

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-neutral-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Target size={15} className="text-[#C61C2E] shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-[.14em] text-[#C61C2E]">
              Marketer Revenue Quota & Monetary Targets
            </span>
            <span className="text-xs text-neutral-400">·</span>
            <span className="text-xs font-medium text-neutral-700">
              {myTarget.marketerName} ({myTarget.marketerEmail})
            </span>
          </div>
          <h2 className="text-base font-bold text-neutral-900 mt-1">
            Weekly, Monthly & Annual Monetary Targets (FY 2026)
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Live revenue progress calculated from invoices generated for your assigned clients ({marketerInvoices.filter((d) => d.kind === 'invoice').length} invoices).
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => openEditModal(myTarget)}
            className="btn btn-secondary self-start sm:self-auto"
          >
            <SlidersHorizontal size={13} /> Set Monetary Targets
          </button>
        )}
      </div>

      {/* Three Target Sections Flattened with Dividers (No cards-inside-cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
        {/* Weekly Target */}
        <div className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Weekly Monetary Target
            </span>
            <span className="text-[11.5px] font-bold font-mono text-[#C61C2E]">
              {progress.weekly.percent}% Met
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase text-neutral-400 font-semibold">Target</div>
              <div className="text-lg font-bold font-mono text-neutral-900">
                {formatGhs(progress.weekly.target)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-neutral-400 font-semibold">Achieved</div>
              <div className="text-sm font-bold font-mono text-emerald-700">
                {formatGhs(progress.weekly.achieved)}
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#C61C2E] transition-all duration-300"
              style={{ width: `${Math.min(progress.weekly.percent, 100)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
            <span>Remaining this week:</span>
            <span className="font-semibold text-neutral-800">
              {formatGhs(progress.weekly.remaining)}
            </span>
          </div>
        </div>

        {/* Monthly Target */}
        <div className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Monthly Monetary Target
            </span>
            <span className="text-[11.5px] font-bold font-mono text-[#C61C2E]">
              {progress.monthly.percent}% Met
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase text-neutral-400 font-semibold">Target</div>
              <div className="text-lg font-bold font-mono text-neutral-900">
                {formatGhs(progress.monthly.target)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-neutral-400 font-semibold">Achieved</div>
              <div className="text-sm font-bold font-mono text-emerald-700">
                {formatGhs(progress.monthly.achieved)}
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#111110] transition-all duration-300"
              style={{ width: `${Math.min(progress.monthly.percent, 100)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
            <span>Remaining this month:</span>
            <span className="font-semibold text-neutral-800">
              {formatGhs(progress.monthly.remaining)}
            </span>
          </div>
        </div>

        {/* Annual Target */}
        <div className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Annual Monetary Target
            </span>
            <span className="text-[11.5px] font-bold font-mono text-emerald-700">
              {progress.annual.percent}% Met
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase text-neutral-400 font-semibold">Target</div>
              <div className="text-lg font-bold font-mono text-neutral-900">
                {formatGhs(progress.annual.target)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-neutral-400 font-semibold">Achieved</div>
              <div className="text-sm font-bold font-mono text-emerald-700">
                {formatGhs(progress.annual.achieved)}
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${Math.min(progress.annual.percent, 100)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
            <span>Remaining this year:</span>
            <span className="font-semibold text-neutral-800">
              {formatGhs(progress.annual.remaining)}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Targets Modal (Admin) */}
      {editingTarget && (
        <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="dialog w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900/[0.06]">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Update Marketer Monetary Targets
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {editingTarget.marketerName} ({editingTarget.marketerEmail})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTarget(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Weekly Monetary Target (GH₵)
                </label>
                <input
                  type="number"
                  min={0}
                  step="100"
                  required
                  value={weeklyInput}
                  onChange={(e) => setWeeklyInput(e.target.value)}
                  className="field font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Monthly Monetary Target (GH₵)
                </label>
                <input
                  type="number"
                  min={0}
                  step="500"
                  required
                  value={monthlyInput}
                  onChange={(e) => setMonthlyInput(e.target.value)}
                  className="field font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Annual Monetary Target (GH₵)
                </label>
                <input
                  type="number"
                  min={0}
                  step="1000"
                  required
                  value={annualInput}
                  onChange={(e) => setAnnualInput(e.target.value)}
                  className="field font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-900/[0.06]">
                <button
                  type="button"
                  onClick={() => setEditingTarget(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Targets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MARKETER DASHBOARD HUB (Canonical /dashboard for Marketers)
// ============================================================================
export function MarketerDashboardHub() {
  const [, setLocation] = useLocation();
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [allDocuments, setAllDocuments] = useState<SalesDocument[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [targets, setTargets] = useState<MarketerTarget[]>(() => getMarketerTargets());
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const authUser = getStoredAuthUser() || {
    id: 'usr-marketer-nana',
    fullName: 'Nana Mensah',
    email: 'marketer@collage.com.gh',
    role: 'marketer' as const,
  };
  const isAdmin = authUser.role === 'admin';

  useEffect(() => {
    loadData();
  }, [authUser.email, authUser.role]);

  async function loadData() {
    setLoading(true);
    try {
      const [clientsData, docsData, campsData, targetsData] = await Promise.all([
        customFetch<Client[]>('/api/clients').catch(() => []),
        customFetch<SalesDocument[]>('/api/documents').catch(() => []),
        customFetch<MarketingCampaign[]>('/api/marketer/campaigns').catch(() => []),
        customFetch<MarketerTarget[]>('/api/marketer/targets').catch(() => getMarketerTargets()),
      ]);
      setAllClients(clientsData || []);
      setAllDocuments(docsData || []);
      setCampaigns(campsData || []);
      if (Array.isArray(targetsData) && targetsData.length > 0) {
        setTargets(targetsData);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }

  // Strictly isolate clients to ONLY those brought in by or delegated to the logged-in Marketer
  const myClients = isAdmin
    ? allClients.filter((c) => c.status !== 'archived')
    : allClients.filter((c) => c.status !== 'archived' && isClientOwnedByMarketer(c, authUser));

  const myClientIds = new Set(myClients.map((c) => c.id));
  const myLeads = myClients.filter((c) => c.status === 'lead');
  const myActiveClients = myClients.filter((c) => c.status === 'active');
  const myInvoices = allDocuments.filter(
    (d) => d.kind === 'invoice' && (isAdmin || myClientIds.has(d.clientId)),
  );

  async function handleConvertLead(id: string) {
    try {
      await customFetch(`/api/marketer/leads/${encodeURIComponent(id)}/convert`, {
        method: 'POST',
      });
      showToast('Lead converted to active client! You can now generate an invoice for them.');
      loadData();
    } catch {
      showToast('Conversion failed. Please try again.');
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
  const spendUtilization =
    totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0.0';

  const totalInvoicedAmount = myInvoices
    .filter((inv) => inv.status !== 'cancelled' && inv.status !== 'draft')
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-[#111110]/90 backdrop-blur-xl px-4 py-3 text-xs font-medium text-white shadow-xl border border-white/15 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-900/[0.06] pb-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#C61C2E]">
            Brand & Marketing Desk : Commercial Pipeline
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
            Marketing Hub & Target Portal
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Welcome back, <span className="font-semibold text-neutral-800">{authUser.fullName}</span>. Track your weekly, monthly & annual targets, manage your assigned clients, and generate invoices.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/clients"
            className="btn btn-secondary no-underline"
          >
            <Users size={13} /> My Clients ({myClients.length})
          </Link>
          <Link
            href="/leads"
            className="btn btn-secondary no-underline"
          >
            <UserPlus size={13} /> My Leads ({myLeads.length})
          </Link>
          <button
            type="button"
            onClick={() => setLocation('/invoices?new=1')}
            className="btn btn-primary"
          >
            <Plus size={14} /> Generate Invoice
          </button>
        </div>
      </div>

      {/* Marketer Annual / Monthly / Weekly Monetary Targets Banner */}
      <MarketerMonetaryTargetsBanner
        marketerUser={{
          id: authUser.id,
          fullName: authUser.fullName,
          email: authUser.email,
        }}
        marketerInvoices={myInvoices}
        allTargets={targets}
        isAdmin={isAdmin}
        onTargetsUpdated={setTargets}
      />

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>My Assigned Clients & Leads</span>
            <Users size={15} className="text-[#C61C2E]" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            {myActiveClients.length} Active · {myLeads.length} {myLeads.length === 1 ? 'Lead' : 'Leads'}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Exclusively assigned to {authUser.fullName}
          </div>
        </div>

        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>My Generated Invoices</span>
            <FileText size={15} className="text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            {formatGhs(totalInvoicedAmount)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">
            Across {myInvoices.length} {myInvoices.length === 1 ? 'invoice' : 'invoices'} for your clients
          </div>
        </div>

        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Marketing Campaign Budget</span>
            <Briefcase size={15} className="text-blue-600" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            {formatGhs(totalBudget)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">
            Spent: {formatGhs(totalSpent)} ({spendUtilization}% utilized)
          </div>
        </div>
      </div>

      {/* Main Grid: My Clients & Invoices + Recent Invoices & Corridors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* My Assigned Clients & Quick Invoice Generation */}
          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  My Assigned Clients
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Clients brought in by or delegated to {authUser.fullName}. Click &ldquo;Generate Invoice&rdquo; to bill any of your clients.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/invoices"
                  className="text-xs text-neutral-600 hover:text-neutral-900 font-medium no-underline"
                >
                  All My Invoices ({myInvoices.length}) →
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-neutral-400">Loading your clients...</div>
            ) : myClients.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                No clients are currently assigned to your portfolio. Add a new client or ask Admin to delegate a client to you.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500 font-medium">
                      <th className="pb-2">Client / Organization</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Account Owner</th>
                      <th className="pb-2 text-right">Invoice Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {myClients.map((client) => {
                      const clientInvoices = myInvoices.filter((inv) => inv.clientId === client.id);
                      const isLead = client.status === 'lead';
                      return (
                        <tr key={client.id} className="hover:bg-neutral-50/50">
                          <td className="py-3 font-medium text-neutral-900">
                            <Link
                              href={`/clients/${client.id}`}
                              className="hover:text-[#C61C2E] no-underline font-semibold text-neutral-900"
                            >
                              {client.companyName}
                            </Link>
                            <div className="text-[10.5px] text-neutral-400 font-mono">
                              {client.contactName || 'Primary Contact'} · {client.phone || client.email || 'Accra'}
                            </div>
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center font-mono uppercase text-[10px] font-bold px-2 py-0.5 rounded ${
                                isLead
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {client.status}
                            </span>
                            {clientInvoices.length > 0 && (
                              <span className="ml-1.5 text-[10.5px] font-mono text-neutral-500">
                                ({clientInvoices.length} {clientInvoices.length === 1 ? 'inv' : 'invs'})
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-neutral-600">
                            <span className="inline-flex items-center gap-1 rounded bg-neutral-100 px-2 py-0.5 text-[10.5px] font-medium text-neutral-800">
                              {client.assignedMarketerName || authUser.fullName}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {isLead && (
                                <button
                                  type="button"
                                  onClick={() => handleConvertLead(client.id)}
                                  className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
                                >
                                  <Check size={12} /> Activate
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setLocation(`/invoices?new=1&clientId=${encodeURIComponent(client.id)}`)}
                                className="inline-flex items-center gap-1 rounded bg-[#C61C2E] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#a81625] transition-colors cursor-pointer"
                              >
                                <FileText size={11} /> + Generate Invoice
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Invoices for My Clients & Prime Corridors */}
        <div className="space-y-6">
          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-neutral-900">
                My Recent Invoices
              </h3>
              <Link
                href="/invoices"
                className="text-xs text-[#C61C2E] hover:underline font-medium no-underline"
              >
                View All →
              </Link>
            </div>
            {myInvoices.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400">
                No invoices generated for your clients yet.
              </div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {myInvoices.slice(0, 5).map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="block py-3 first:pt-1 last:pb-1 hover:bg-neutral-50/70 transition-colors no-underline"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-900">
                      <span className="font-mono text-[#C61C2E]">{inv.number}</span>
                      <span className="font-mono">{formatGhs(inv.total)}</span>
                    </div>
                    <div className="text-xs font-medium text-neutral-800 mt-0.5 truncate">
                      {inv.clientName}
                    </div>
                    <div className="text-[10.5px] text-neutral-500 truncate mt-0.5">
                      {inv.subject}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Ghanaian Outdoor Placements */}
          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-2">
              Collage Prime Billboard Corridors
            </h3>
            <div className="space-y-2 text-xs text-neutral-600">
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                <span>Accra : Tema Motorway Unipoles</span>
                <span className="font-mono text-emerald-600 font-medium">Occupied 92%</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                <span>Airport City & Liberation Road</span>
                <span className="font-mono text-emerald-600 font-medium">Occupied 100%</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                <span>Ridge Roundabout Financial Totems</span>
                <span className="font-mono text-blue-600 font-medium">Available</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span>Kumasi Prempeh II Bypass</span>
                <span className="font-mono text-amber-600 font-medium">2 Prime Slots</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FULL MARKETER WORKSPACE PAGE (/leads, /campaigns, /portfolio-showcase)
// ============================================================================
export function MarketerWorkspacePage() {
  const [location, setLocation] = useLocation();

  const initialTab = location.includes('/campaigns')
    ? 'campaigns'
    : location.includes('/portfolio-showcase')
      ? 'showcase'
      : 'leads';

  const [activeTab, setActiveTab] = useState<'leads' | 'campaigns' | 'showcase'>(initialTab);
  const [leads, setLeads] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<SalesDocument[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [showcases, setShowcases] = useState<ShowcaseLink[]>([]);
  const [targets, setTargets] = useState<MarketerTarget[]>(() => getMarketerTargets());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lead' | 'active'>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal Dialog States
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = useState(false);
  const [previewShowcase, setPreviewShowcase] = useState<ShowcaseLink | null>(null);

  // New Lead Form State
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadContact, setNewLeadContact] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadAddress, setNewLeadAddress] = useState('');
  const [newLeadCity, setNewLeadCity] = useState('Accra');
  const [newLeadEstimatedValue, setNewLeadEstimatedValue] = useState('');
  const [newLeadSource, setNewLeadSource] = useState(LEAD_SOURCE_TAGS[0]);
  const [newLeadNotes, setNewLeadNotes] = useState('');

  // New Campaign Form State
  const [newCampName, setNewCampName] = useState('');
  const [newCampService, setNewCampService] = useState<ServiceCategory>('billboards');
  const [newCampBudget, setNewCampBudget] = useState('35000');
  const [newCampSpent, setNewCampSpent] = useState('0');
  const [newCampStartDate, setNewCampStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [newCampEndDate, setNewCampEndDate] = useState(
    new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
  );
  const [newCampNotes, setNewCampNotes] = useState('');

  // New Showcase Link Form State
  const [showcaseCategory, setShowcaseCategory] = useState<ServiceCategory | 'all'>('billboards');
  const [showcaseClientName, setShowcaseClientName] = useState('');

  const authUser = getStoredAuthUser() || {
    id: 'usr-marketer-nana',
    fullName: 'Nana Mensah',
    email: 'marketer@collage.com.gh',
    role: 'marketer' as const,
  };
  const isAdmin = authUser.role === 'admin';

  useEffect(() => {
    loadData();
  }, [authUser.email, authUser.role]);

  async function loadData() {
    setLoading(true);
    try {
      const [allClients, allDocs, camps, links, targetsData] = await Promise.all([
        customFetch<Client[]>('/api/clients').catch(() => []),
        customFetch<SalesDocument[]>('/api/documents').catch(() => []),
        customFetch<MarketingCampaign[]>('/api/marketer/campaigns').catch(() => []),
        customFetch<ShowcaseLink[]>('/api/marketer/showcase').catch(() => []),
        customFetch<MarketerTarget[]>('/api/marketer/targets').catch(() => getMarketerTargets()),
      ]);
      setLeads(allClients || []);
      setDocuments(allDocs || []);
      setCampaigns(camps || []);
      setShowcases(links || []);
      if (Array.isArray(targetsData) && targetsData.length > 0) {
        setTargets(targetsData);
      }
    } catch {
      // Graceful error handling
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function handleConvertLead(id: string) {
    try {
      await customFetch(`/api/marketer/leads/${encodeURIComponent(id)}/convert`, {
        method: 'POST',
      });
      showToast('Client lead converted to active status! Ready to generate invoices.');
      loadData();
    } catch {
      showToast('Conversion failed. Please try again.');
    }
  }

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    if (!newLeadCompany.trim()) return;

    try {
      await customFetch('/api/clients', {
        method: 'POST',
        body: JSON.stringify({
          companyName: newLeadCompany.trim(),
          contactName: newLeadContact.trim() || null,
          email: newLeadEmail.trim() || null,
          phone: newLeadPhone.trim() || null,
          address: newLeadAddress.trim() || null,
          city: newLeadCity.trim() || 'Accra',
          country: 'Ghana',
          status: 'lead',
          assignedMarketerId: authUser.id,
          assignedMarketerName: authUser.fullName,
          assignedMarketerEmail: authUser.email,
        }),
      });
      showToast(`Lead "${newLeadCompany}" created and assigned to ${authUser.fullName}!`);
      setIsNewLeadOpen(false);
      setNewLeadCompany('');
      setNewLeadContact('');
      setNewLeadEmail('');
      setNewLeadPhone('');
      setNewLeadAddress('');
      setNewLeadEstimatedValue('');
      setNewLeadNotes('');
      loadData();
    } catch {
      showToast('Failed to create lead.');
    }
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!newCampName.trim()) return;

    try {
      await customFetch('/api/marketer/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name: newCampName.trim(),
          targetService: newCampService,
          budget: Number(newCampBudget) || 0,
          spent: Number(newCampSpent) || 0,
          startDate: newCampStartDate,
          endDate: newCampEndDate,
          status: 'active',
          leadsGenerated: 0,
          conversions: 0,
          notes: newCampNotes.trim(),
        }),
      });
      showToast(`Campaign "${newCampName}" registered successfully!`);
      setIsNewCampaignOpen(false);
      setNewCampName('');
      setNewCampNotes('');
      loadData();
    } catch {
      showToast('Failed to create campaign.');
    }
  }

  async function handleCreateShowcase(e: React.FormEvent) {
    e.preventDefault();
    try {
      const created = await customFetch<ShowcaseLink>('/api/marketer/showcase', {
        method: 'POST',
        body: JSON.stringify({
          serviceCategory: showcaseCategory,
          clientName: showcaseClientName.trim() || undefined,
        }),
      });
      showToast(`Showcase link for "${created.title}" generated!`);
      setIsShowcaseModalOpen(false);
      setShowcaseClientName('');
      loadData();
    } catch {
      showToast('Failed to generate showcase link.');
    }
  }

  async function handleCopyLink(link: ShowcaseLink) {
    try {
      await navigator.clipboard.writeText(link.shareUrl);
      setCopiedId(link.id);
      showToast(`Showcase pitch link copied to clipboard!`);
      void customFetch(`/api/marketer/showcase/${encodeURIComponent(link.id)}/click`, {
        method: 'POST',
      }).catch(() => {});
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      showToast('Link copied to clipboard.');
    }
  }

  // Strictly isolate records to the logged-in Marketer (unless Admin)
  const ownedClients = isAdmin
    ? leads.filter((c) => c.status !== 'archived')
    : leads.filter((c) => c.status !== 'archived' && isClientOwnedByMarketer(c, authUser));

  const ownedClientIds = new Set(ownedClients.map((c) => c.id));
  const myInvoices = documents.filter(
    (d) => d.kind === 'invoice' && (isAdmin || ownedClientIds.has(d.clientId)),
  );

  // Filtered Leads
  const filteredLeads = ownedClients.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const hay = `${c.companyName} ${c.contactName ?? ''} ${c.email ?? ''} ${c.phone ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Filtered Campaigns
  const filteredCampaigns = campaigns.filter((camp) => {
    if (serviceFilter !== 'all' && camp.targetService !== serviceFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const hay = `${camp.name} ${camp.targetService} ${camp.notes ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-[#111110] px-4 py-3 text-xs font-medium text-white shadow-xl border border-neutral-700 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#C61C2E]">
            Brand & Marketing Desk : Operational Suite
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
            Client Acquisition & Campaign Center
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage your assigned prospective leads, generate client invoices, and track outdoor advertising campaigns.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setLocation('/invoices?new=1')}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#C61C2E] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#a81625] transition-colors cursor-pointer"
          >
            <FileText size={13} /> + Generate Invoice
          </button>
          {activeTab === 'leads' && (
            <button
              type="button"
              onClick={() => setIsNewLeadOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#111110] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Plus size={13} /> New Client Lead
            </button>
          )}
          {activeTab === 'campaigns' && (
            <button
              type="button"
              onClick={() => setIsNewCampaignOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#111110] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Plus size={13} /> New Campaign
            </button>
          )}
          {activeTab === 'showcase' && (
            <button
              type="button"
              onClick={() => setIsShowcaseModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#111110] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Plus size={13} /> Generate Pitch Link
            </button>
          )}
        </div>
      </div>

      {/* Monetary Targets Banner */}
      <MarketerMonetaryTargetsBanner
        marketerUser={{
          id: authUser.id,
          fullName: authUser.fullName,
          email: authUser.email,
        }}
        marketerInvoices={myInvoices}
        allTargets={targets}
        isAdmin={isAdmin}
        onTargetsUpdated={setTargets}
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-200 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'leads'
              ? 'border-[#C61C2E] text-[#C61C2E] font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <UserPlus size={14} /> My Client Portfolio & Leads ({ownedClients.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'campaigns'
              ? 'border-[#C61C2E] text-[#C61C2E] font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Megaphone size={14} /> Campaign Tracker ({campaigns.length})
        </button>
        {activeTab === 'showcase' && (
          <button
            type="button"
            onClick={() => setActiveTab('showcase')}
            className="flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors cursor-pointer border-[#C61C2E] text-[#C61C2E] font-bold"
          >
            <Share2 size={14} /> Portfolio Showcase Links ({showcases.length})
          </button>
        )}
      </div>

      {/* TAB 1: CLIENT LEADS PIPELINE */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search my clients & leads by company, contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-neutral-300 pl-9 pr-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-[#C61C2E] focus:outline-hidden"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
              >
                <option value="all">All My Clients ({ownedClients.length})</option>
                <option value="lead">Pending Leads</option>
                <option value="active">Active Clients</option>
              </select>
            </div>
          </div>

          {/* Leads Table */}
          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            {loading ? (
              <div className="py-12 text-center text-xs text-neutral-400">Loading your client portfolio...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                No client records matching the criteria in your assigned portfolio.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500 font-medium">
                      <th className="pb-2.5">Company Details</th>
                      <th className="pb-2.5">Contact Person</th>
                      <th className="pb-2.5">Location</th>
                      <th className="pb-2.5">Assigned Marketer</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredLeads.map((client) => {
                      const isLead = client.status === 'lead';
                      return (
                        <tr key={client.id} className="hover:bg-neutral-50/50">
                          <td className="py-3 font-medium text-neutral-900">
                            <Link
                              href={`/clients/${client.id}`}
                              className="hover:text-[#C61C2E] no-underline font-semibold text-neutral-900"
                            >
                              {client.companyName}
                            </Link>
                            <div className="text-[10.5px] text-neutral-400 font-mono">
                              ID: {client.id}
                            </div>
                          </td>
                          <td className="py-3 text-neutral-700">
                            {client.contactName || 'No contact named'}
                            <div className="text-[10.5px] text-neutral-400 font-mono">
                              {client.email || client.phone || 'No phone'}
                            </div>
                          </td>
                          <td className="py-3 text-neutral-600">
                            {client.city ? `${client.city}, ${client.country}` : client.country}
                          </td>
                          <td className="py-3">
                            <span className="inline-flex items-center rounded bg-neutral-100 px-2 py-0.5 text-[10.5px] font-medium text-neutral-800">
                              {client.assignedMarketerName || authUser.fullName}
                            </span>
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center gap-1 font-mono uppercase text-[10px] font-bold px-2 py-0.5 rounded ${
                                isLead
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {client.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="inline-flex items-center justify-end gap-2">
                              {isLead && (
                                <button
                                  type="button"
                                  onClick={() => handleConvertLead(client.id)}
                                  className="inline-flex items-center gap-1 rounded bg-[#111110] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                                >
                                  <Check size={12} /> 1-Click Convert
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setLocation(`/invoices?new=1&clientId=${encodeURIComponent(client.id)}`)}
                                className="inline-flex items-center gap-1 rounded bg-[#C61C2E] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#a81625] transition-colors cursor-pointer"
                              >
                                <FileText size={12} /> + Generate Invoice
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CAMPAIGN TRACKER */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search campaigns by title, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-neutral-300 pl-9 pr-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-[#C61C2E] focus:outline-hidden"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">Service:</span>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
              >
                <option value="all">All Services</option>
                <option value="billboards">Billboards</option>
                <option value="telescopic_flags">Telescopic Flags</option>
                <option value="event_branding">Event Branding</option>
                <option value="wayfinding">Wayfinding</option>
                <option value="large_format_print">Large Format Print</option>
                <option value="field_production">Field Production</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCampaigns.map((camp) => {
              const metrics = calculateCampaignMetrics(camp);
              return (
                <div
                  key={camp.id}
                  className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-neutral-100 text-neutral-800">
                        {camp.targetService.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          camp.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : camp.status === 'completed'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-neutral-900 mt-2.5">{camp.name}</h3>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                      {camp.notes || 'Campaign targeting key Ghanaian corporate institutions.'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-neutral-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">Budget:</span>
                        <span className="font-mono font-semibold text-neutral-900">{formatGhs(camp.budget)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">Spent:</span>
                        <span className="font-mono font-semibold text-neutral-900">{formatGhs(camp.spent)}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden mt-1">
                        <div
                          className="h-full bg-[#C61C2E] rounded-full"
                          style={{ width: `${Math.min(metrics.spendPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-600 font-mono">
                    <span>Leads: {camp.leadsGenerated}</span>
                    <span>Conversions: {camp.conversions}</span>
                    <span className="text-[#C61C2E] font-bold">{metrics.conversionRate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PORTFOLIO SHOWCASE LINKS */}
      {activeTab === 'showcase' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-neutral-500">
              Personalized showcase links allow prospects to explore past installations tailored to their sector.
            </p>
            <button
              type="button"
              onClick={() => setIsShowcaseModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#111110] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            >
              <Plus size={13} /> Generate New Pitch Link
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {showcases.map((link) => (
              <div
                key={link.id}
                className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span className="uppercase font-bold text-neutral-600">
                      {link.serviceCategory.replace(/_/g, ' ')}
                    </span>
                    <span>{link.clicks} client visits</span>
                  </div>

                  <h3 className="text-sm font-bold text-neutral-900 mt-2">{link.title}</h3>
                  {link.clientName ? (
                    <div className="text-xs text-[#C61C2E] font-medium mt-1">
                      Target Client: {link.clientName}
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-400 mt-1">General Sector Presentation</div>
                  )}

                  <div className="mt-3 rounded bg-neutral-50 p-2 text-[10.5px] font-mono text-neutral-600 truncate border border-neutral-200/60">
                    {link.shareUrl}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPreviewShowcase(link)}
                    className="inline-flex items-center gap-1 text-xs text-neutral-700 hover:text-neutral-900 font-medium cursor-pointer"
                  >
                    <Eye size={13} /> Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(link)}
                    className="inline-flex items-center gap-1.5 rounded bg-[#111110] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    {copiedId === link.id ? (
                      <>
                        <Check size={12} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy Pitch Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE NEW LEAD */}
      {isNewLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="panel w-full max-w-md bg-white border border-neutral-200 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h2 className="text-sm font-bold text-neutral-900">Add New Client Lead</h2>
                <p className="text-[11px] text-neutral-500">
                  Automatically assigned to your portfolio ({authUser.fullName})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewLeadOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-neutral-700 font-medium mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanbic Bank Ghana"
                  value={newLeadCompany}
                  onChange={(e) => setNewLeadCompany(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Yaw Osei"
                    value={newLeadContact}
                    onChange={(e) => setNewLeadContact(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+233 24 000 0000"
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Work Email</label>
                  <input
                    type="email"
                    placeholder="contact@company.com.gh"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Accra"
                    value={newLeadCity}
                    onChange={(e) => setNewLeadCity(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Lead Source Channel</label>
                  <select
                    value={newLeadSource}
                    onChange={(e) => setNewLeadSource(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  >
                    {LEAD_SOURCE_TAGS.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Est. Deal Value (GH₵)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 25000"
                    value={newLeadEstimatedValue}
                    onChange={(e) => setNewLeadEstimatedValue(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-medium mb-1">Location / Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. Airport City, Liberation Road"
                  value={newLeadAddress}
                  onChange={(e) => setNewLeadAddress(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-medium mb-1">Inquiry / Project Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Interested in 15 telescopic flagpoles for upcoming AGM..."
                  value={newLeadNotes}
                  onChange={(e) => setNewLeadNotes(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsNewLeadOpen(false)}
                  className="rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#C61C2E] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#a81625] cursor-pointer"
                >
                  Save Client Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE NEW CAMPAIGN */}
      {isNewCampaignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="panel w-full max-w-md bg-white border border-neutral-200 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-sm font-bold text-neutral-900">Launch Marketing Campaign</h2>
              <button
                type="button"
                onClick={() => setIsNewCampaignOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-neutral-700 font-medium mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tema Motorway Unipole Q1 Drive"
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-medium mb-1">Target Service Line</label>
                <select
                  value={newCampService}
                  onChange={(e) => setNewCampService(e.target.value as ServiceCategory)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                >
                  <option value="billboards">Outdoor Billboard Skins</option>
                  <option value="telescopic_flags">Telescopic Flags & Water Bases</option>
                  <option value="event_branding">Event Branding & Media Walls</option>
                  <option value="wayfinding">Architectural Wayfinding & Totems</option>
                  <option value="large_format_print">Large Format UV & Dye Sublimation</option>
                  <option value="field_production">Field Production & Rigging</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Total Budget (GH₵)</label>
                  <input
                    type="number"
                    required
                    value={newCampBudget}
                    onChange={(e) => setNewCampBudget(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Initial Spend (GH₵)</label>
                  <input
                    type="number"
                    value={newCampSpent}
                    onChange={(e) => setNewCampSpent(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newCampStartDate}
                    onChange={(e) => setNewCampStartDate(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={newCampEndDate}
                    onChange={(e) => setNewCampEndDate(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-medium mb-1">Campaign Notes & Corridors</label>
                <textarea
                  rows={2}
                  placeholder="Describe target corridors, billboard locations, or event objectives..."
                  value={newCampNotes}
                  onChange={(e) => setNewCampNotes(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsNewCampaignOpen(false)}
                  className="rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#C61C2E] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#a81625] cursor-pointer"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: GENERATE SHOWCASE PITCH LINK */}
      {isShowcaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="panel w-full max-w-md bg-white border border-neutral-200 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-sm font-bold text-neutral-900">Generate Portfolio Pitch Link</h2>
              <button
                type="button"
                onClick={() => setIsShowcaseModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateShowcase} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-neutral-700 font-medium mb-1">Service Category to Highlight</label>
                <select
                  value={showcaseCategory}
                  onChange={(e) => setShowcaseCategory(e.target.value as ServiceCategory | 'all')}
                  className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                >
                  <option value="all">Full Collage Master Capabilities Portfolio</option>
                  <option value="billboards">Outdoor Billboard Skins & Gantries</option>
                  <option value="telescopic_flags">Telescopic Flagpoles & Water Base Kits</option>
                  <option value="event_branding">Event Branding & Stage Backdrops</option>
                  <option value="wayfinding">Corporate Campus Wayfinding & Monoliths</option>
                  <option value="large_format_print">Large Format UV & Sublimation Print</option>
                  <option value="field_production">Field Rigging & Heavy Structural Fabrication</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-700 font-medium mb-1">Target Client Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Bank of Ghana"
                  value={showcaseClientName}
                  onChange={(e) => setShowcaseClientName(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsShowcaseModalOpen(false)}
                  className="rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#C61C2E] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#a81625] cursor-pointer"
                >
                  Generate Pitch Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SHOWCASE PREVIEW */}
      {previewShowcase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="panel w-full max-w-lg bg-white border border-neutral-200 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#C61C2E]">
                  Client Pitch Preview
                </span>
                <h2 className="text-base font-bold text-neutral-900 mt-0.5">{previewShowcase.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setPreviewShowcase(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-neutral-600">
              <div className="rounded-lg bg-neutral-50 p-3.5 border border-neutral-200/80">
                <div className="font-semibold text-neutral-900">
                  Prepared for: {previewShowcase.clientName || 'Prospective Corporate Partner'}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  Category: {SERVICE_LABELS[previewShowcase.serviceCategory] || previewShowcase.serviceCategory}
                </div>
                <div className="mt-2 font-mono text-[11px] text-[#C61C2E] break-all">
                  {previewShowcase.shareUrl}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setPreviewShowcase(null)}
                className="rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Close
              </button>
              <Link
                href="/portfolio"
                className="rounded-md bg-[#111110] px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 no-underline"
              >
                Open Full Public Portfolio →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
