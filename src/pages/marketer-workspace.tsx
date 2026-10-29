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
  ExternalLink,
  Plus,
  Filter,
  Search,
  Eye,
  Sparkles,
  Building2,
  Phone,
  Mail,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  TrendingUp,
  Briefcase,
  Globe,
  Tag,
} from 'lucide-react';
import { customFetch } from '@/lib/api-client/custom-fetch';
import type { Client } from '@/lib/api-client/generated/api.schemas';
import type {
  MarketingCampaign,
  ShowcaseLink,
  ServiceCategory,
} from '@/types/workflows';
import {
  calculateCampaignMetrics,
  generateShowcaseLink,
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

// ============================================================================
// MARKETER DASHBOARD HUB (Canonical /dashboard for Marketers)
// ============================================================================
export function MarketerDashboardHub() {
  const [leads, setLeads] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [showcases, setShowcases] = useState<ShowcaseLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [leadsData, campsData, showcaseData] = await Promise.all([
        customFetch<Client[]>('/api/clients?status=lead').catch(() => []),
        customFetch<MarketingCampaign[]>('/api/marketer/campaigns').catch(() => []),
        customFetch<ShowcaseLink[]>('/api/marketer/showcase').catch(() => []),
      ]);
      setLeads(leadsData || []);
      setCampaigns(campsData || []);
      setShowcases(showcaseData || []);
    } catch {
      // Graceful fallback to empty state
    } finally {
      setLoading(false);
    }
  }

  async function handleConvertLead(id: string) {
    try {
      await customFetch(`/api/marketer/leads/${encodeURIComponent(id)}/convert`, {
        method: 'POST',
      });
      showToast('Lead converted to active client successfully! Ready for billing.');
      loadData();
    } catch {
      showToast('Conversion failed. Please try again.');
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function handleCopyLink(link: ShowcaseLink) {
    try {
      await navigator.clipboard.writeText(link.shareUrl);
      setCopiedId(link.id);
      showToast(`Showcase link for "${link.title}" copied to clipboard!`);
      void customFetch(`/api/marketer/showcase/${encodeURIComponent(link.id)}/click`, {
        method: 'POST',
      }).catch(() => {});
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      showToast('Link copied to clipboard.');
    }
  }

  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
  const totalLeadsGenerated = campaigns.reduce((sum, c) => sum + (c.leadsGenerated || 0), 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
  const overallConversionRate =
    totalLeadsGenerated > 0 ? ((totalConversions / totalLeadsGenerated) * 100).toFixed(1) : '0.0';
  const spendUtilization =
    totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0.0';

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
            Brand & Marketing Desk : Commercial Pipeline
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
            Marketing Hub & Campaign Analytics
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Corporate lead acquisitions and advertising campaign performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors no-underline cursor-pointer"
          >
            <UserPlus size={13} /> Client Leads ({leads.length})
          </Link>
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#111110] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors no-underline cursor-pointer"
          >
            <Megaphone size={13} /> Active Campaigns
          </Link>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Marketing Budget</span>
            <Briefcase size={15} className="text-[#C61C2E]" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            {formatGhs(totalBudget)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">
            Spent: {formatGhs(totalSpent)} ({spendUtilization}% utilized)
          </div>
        </div>

        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Active Client Leads</span>
            <UserPlus size={15} className="text-blue-600" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            {leads.length} Prospective
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Awaiting 1-click conversion to active contracts
          </div>
        </div>

        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Campaign Conversions</span>
            <Sparkles size={15} className="text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            {overallConversionRate}% Rate
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">
            {totalConversions} won / {totalLeadsGenerated} leads generated
          </div>
        </div>
      </div>

      {/* Main Grid: Leads Pipeline & Active Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Leads Quick Conversion Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Prospective Client Leads Queue
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Direct inquiries from billboards, activations, and outbound pitches.
                </p>
              </div>
              <Link
                href="/leads"
                className="text-xs text-[#C61C2E] hover:underline font-medium no-underline"
              >
                View All Leads →
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-neutral-400">Loading leads...</div>
            ) : leads.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                No pending leads. All prospects have been converted to active clients!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500 font-medium">
                      <th className="pb-2">Company & Contact</th>
                      <th className="pb-2">Location</th>
                      <th className="pb-2">Channel Source</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {leads.slice(0, 5).map((lead) => (
                      <tr key={lead.id} className="hover:bg-neutral-50/50">
                        <td className="py-3 font-medium text-neutral-900">
                          {lead.companyName}
                          <div className="text-[10.5px] text-neutral-400 font-mono">
                            {lead.contactName || 'Primary Contact'} · {lead.email || lead.phone || 'No direct phone'}
                          </div>
                        </td>
                        <td className="py-3 text-neutral-600">
                          {lead.city ? `${lead.city}, Ghana` : 'Accra, Ghana'}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1 font-mono uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800">
                            <Tag size={10} /> Lead
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleConvertLead(lead.id)}
                            className="inline-flex items-center gap-1 rounded bg-[#111110] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            <Check size={12} /> Convert 1-Click
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Campaigns Progress Table */}
          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Campaign Budget & Spend Tracker
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Live budget utilization across Ghana media channels.
                </p>
              </div>
              <Link
                href="/campaigns"
                className="text-xs text-[#C61C2E] hover:underline font-medium no-underline"
              >
                Manage Campaigns →
              </Link>
            </div>

            <div className="space-y-4">
              {campaigns.map((camp) => {
                const metrics = calculateCampaignMetrics(camp);
                return (
                  <div key={camp.id} className="rounded-lg border border-neutral-100 bg-neutral-50/60 p-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-neutral-900">{camp.name}</div>
                        <div className="text-[10.5px] text-neutral-400 font-mono mt-0.5">
                          {SERVICE_LABELS[camp.targetService] || camp.targetService} · {camp.startDate} to {camp.endDate}
                        </div>
                      </div>
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-neutral-200/80 text-neutral-800 font-mono">
                        {camp.status}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] text-neutral-600 mb-1">
                        <span>Spend: {formatGhs(camp.spent)} of {formatGhs(camp.budget)}</span>
                        <span className="font-mono font-semibold">{metrics.spendPercentage}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-neutral-200 overflow-hidden">
                        <div
                          className="h-full bg-[#C61C2E] rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(metrics.spendPercentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[10.5px] text-neutral-500 pt-2 border-t border-neutral-200/60">
                      <span>Leads: {camp.leadsGenerated}</span>
                      <span>Conversions: {camp.conversions}</span>
                      <span>CPL: {formatGhs(metrics.costPerLead)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Key Operational Reference */}
        <div className="space-y-6">
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
  const [location] = useLocation();

  // Determine active section based on URL or tab state
  const initialTab = location.includes('/campaigns')
    ? 'campaigns'
    : location.includes('/portfolio-showcase')
      ? 'showcase'
      : 'leads';

  const [activeTab, setActiveTab] = useState<'leads' | 'campaigns' | 'showcase'>(initialTab);
  const [leads, setLeads] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [showcases, setShowcases] = useState<ShowcaseLink[]>([]);
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

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [allClients, camps, links] = await Promise.all([
        customFetch<Client[]>('/api/clients').catch(() => []),
        customFetch<MarketingCampaign[]>('/api/marketer/campaigns').catch(() => []),
        customFetch<ShowcaseLink[]>('/api/marketer/showcase').catch(() => []),
      ]);
      setLeads(allClients || []);
      setCampaigns(camps || []);
      setShowcases(links || []);
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
      showToast('Client lead successfully converted to active status!');
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
        }),
      });
      showToast(`Lead "${newLeadCompany}" created successfully!`);
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

  // Filtered Leads
  const filteredLeads = leads.filter((c) => {
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
            Manage corporate prospective leads and outdoor advertising campaigns.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <UserPlus size={14} /> Client Leads Pipeline ({leads.filter((c) => c.status === 'lead').length})
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
                placeholder="Search leads by company, contact, email..."
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
                <option value="all">All Records</option>
                <option value="lead">Pending Leads</option>
                <option value="active">Converted Clients</option>
              </select>
            </div>
          </div>

          {/* Leads Table */}
          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            {loading ? (
              <div className="py-12 text-center text-xs text-neutral-400">Loading client leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                No client leads matching the criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500 font-medium">
                      <th className="pb-2.5">Company Details</th>
                      <th className="pb-2.5">Contact Person</th>
                      <th className="pb-2.5">Location</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredLeads.map((client) => {
                      const isLead = client.status === 'lead';
                      return (
                        <tr key={client.id} className="hover:bg-neutral-50/50">
                          <td className="py-3 font-medium text-neutral-900">
                            {client.companyName}
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
                            {isLead ? (
                              <button
                                type="button"
                                onClick={() => handleConvertLead(client.id)}
                                className="inline-flex items-center gap-1 rounded bg-[#111110] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                              >
                                <Check size={12} /> 1-Click Convert
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                <CheckCircle2 size={13} /> Active Client
                              </span>
                            )}
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
          {/* Campaign Filter Controls */}
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

          {/* Campaigns Grid */}
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
              <h2 className="text-sm font-bold text-neutral-900">Add New Client Lead</h2>
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
                  <label className="block text-neutral-700 font-medium mb-1">Work Email</label>
                  <input
                    type="email"
                    placeholder="e.g. y.osei@stanbic.com.gh"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">City / Region</label>
                  <input
                    type="text"
                    placeholder="Accra"
                    value={newLeadCity}
                    onChange={(e) => setNewLeadCity(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewLeadOpen(false)}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#111110] px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
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
              <h2 className="text-sm font-bold text-neutral-900">Launch New Advertising Campaign</h2>
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
                  placeholder="e.g. Kotoka Airport Road Corporate Gantries"
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-medium mb-1">Target Service Category</label>
                <select
                  value={newCampService}
                  onChange={(e) => setNewCampService(e.target.value as ServiceCategory)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                >
                  <option value="billboards">Outdoor Billboard Skins</option>
                  <option value="telescopic_flags">Telescopic Flags & Water Bases</option>
                  <option value="event_branding">Event Branding & Media Walls</option>
                  <option value="wayfinding">Architectural Wayfinding & Totems</option>
                  <option value="large_format_print">Large Format UV Print</option>
                  <option value="field_production">Field Production & Rigging</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Budget (GHS) *</label>
                  <input
                    type="number"
                    required
                    value={newCampBudget}
                    onChange={(e) => setNewCampBudget(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 font-mono focus:border-[#C61C2E] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">Initial Spend (GHS)</label>
                  <input
                    type="number"
                    value={newCampSpent}
                    onChange={(e) => setNewCampSpent(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 font-mono focus:border-[#C61C2E] focus:outline-hidden"
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
                <label className="block text-neutral-700 font-medium mb-1">Strategic Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Focus on high-visibility placements along Liberation Road..."
                  value={newCampNotes}
                  onChange={(e) => setNewCampNotes(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCampaignOpen(false)}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#111110] px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: GENERATE SHOWCASE LINK */}
      {isShowcaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="panel w-full max-w-md bg-white border border-neutral-200 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-sm font-bold text-neutral-900">Generate Client Pitch Showcase</h2>
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
                <label className="block text-neutral-700 font-medium mb-1">Service Capabilities to Feature</label>
                <select
                  value={showcaseCategory}
                  onChange={(e) => setShowcaseCategory(e.target.value as any)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                >
                  <option value="all">All Services & Capabilities</option>
                  <option value="billboards">Outdoor Billboard Skins & Unipoles</option>
                  <option value="telescopic_flags">Telescopic Flagpoles & Water Bases</option>
                  <option value="event_branding">Event Branding & Stage Media Walls</option>
                  <option value="wayfinding">Architectural Wayfinding & Totems</option>
                  <option value="large_format_print">Large Format UV Print</option>
                  <option value="field_production">Field Production & Rigging</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-700 font-medium mb-1">Prospective Client Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Absa Bank Ghana PLC"
                  value={showcaseClientName}
                  onChange={(e) => setShowcaseClientName(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 focus:border-[#C61C2E] focus:outline-hidden"
                />
                <p className="text-[10.5px] text-neutral-400 mt-1">
                  Personalizes the pitch header with the client's corporate identity.
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsShowcaseModalOpen(false)}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#111110] px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Generate Shareable Pitch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SHOWCASE PREVIEW MODAL */}
      {previewShowcase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="panel w-full max-w-2xl bg-white border border-neutral-200 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#C61C2E]">
                  Showcase Pitch Preview
                </div>
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

            <div className="mt-4 space-y-4 text-xs">
              {previewShowcase.clientName && (
                <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                  <div className="text-[10px] font-bold uppercase text-neutral-400">Specially Prepared For</div>
                  <div className="text-sm font-bold text-neutral-900 mt-0.5">
                    {previewShowcase.clientName}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-neutral-200 p-4 space-y-3 bg-neutral-50/40">
                <div className="text-xs font-semibold text-neutral-800">
                  Featured Service : {SERVICE_LABELS[previewShowcase.serviceCategory] || previewShowcase.serviceCategory}
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Collage Ghana provides high-impact visual production, structural steel unipoles, and architectural signage.
                  Our nationwide footprint spans Accra, Tema, Kumasi, and Takoradi.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded bg-white p-2.5 border border-neutral-200/60">
                    <div className="text-[10px] text-neutral-400 font-mono">Material Spec</div>
                    <div className="font-semibold text-neutral-800 mt-0.5">550gsm UV Blackout PVC</div>
                  </div>
                  <div className="rounded bg-white p-2.5 border border-neutral-200/60">
                    <div className="text-[10px] text-neutral-400 font-mono">Turnaround SLA</div>
                    <div className="font-semibold text-neutral-800 mt-0.5">24 to 48 Hours</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400 font-mono">
                  Target URL : {previewShowcase.shareUrl}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyLink(previewShowcase)}
                  className="inline-flex items-center gap-1.5 rounded bg-[#111110] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <Copy size={12} /> Copy Shareable Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
