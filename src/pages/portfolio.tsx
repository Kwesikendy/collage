import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'wouter';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  FileText,
  Filter,
  Flag,
  Globe,
  Grid,
  Layers,
  List,
  Lock,
  Mail,
  MapPin,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Truck,
  Wrench,
  X,
} from 'lucide-react';
import { Brand } from '@/components/brand';
import {
  COMPANY_PROFILE,
  PORTFOLIO_PROJECTS,
  PORTFOLIO_SERVICES,
  type PortfolioProject,
  type ServiceCategory,
  getProjectById,
  getProjectsByCategory,
} from '@/data/portfolio-data';
import { ProjectCard } from '@/components/portfolio/project-card';
import { ProjectModal } from '@/components/portfolio/project-modal';
import { EnquiryForm } from '@/components/portfolio/enquiry-form';
import { ScopeEstimator } from '@/components/portfolio/scope-estimator';

function getServiceIcon(category: ServiceCategory) {
  switch (category) {
    case 'billboards':
      return Layers;
    case 'field_production':
      return Building2;
    case 'telescopic_flags':
      return Flag;
    case 'event_branding':
      return Sparkles;
    case 'wayfinding':
      return Compass;
    case 'large_format_print':
      return Truck;
    default:
      return Layers;
  }
}

const CLIENT_LOGOS = [
  { id: 'all', name: 'All Clients', count: 6 },
  { id: 'Ecobank Ghana PLC', name: 'Ecobank', tag: 'Banking' },
  { id: 'Scancom PLC (MTN Ghana)', name: 'MTN Ghana', tag: 'Telecom' },
  { id: 'Standard Chartered', name: 'Standard Chartered', tag: 'Finance' },
  { id: 'Kempinski Hotel Gold Coast City', name: 'Kempinski', tag: 'Hospitality' },
  { id: 'Gold Fields Ghana', name: 'Gold Fields', tag: 'Mining' },
  { id: 'Enterprise Insurance PLC', name: 'Enterprise Insurance', tag: 'Insurance' },
];

export function PortfolioPage() {
  const params = useParams<{ id?: string }>();
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'ledger'>('grid');
  const [activeModalProject, setActiveModalProject] = useState<PortfolioProject | null>(null);
  const [quoteService, setQuoteService] = useState<ServiceCategory>('billboards');
  const [quoteMessage, setQuoteMessage] = useState<string>('');

  // Deep linking: check route params :id or search params ?project=...
  useEffect(() => {
    if (params?.id) {
      const match = getProjectById(params.id);
      if (match) {
        setActiveModalProject(match);
        return;
      }
    }

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get('project');
      if (projectId) {
        const match = getProjectById(projectId);
        if (match) {
          setActiveModalProject(match);
        }
      }
    }
  }, [params?.id]);

  const filteredProjects = useMemo(() => {
    let list = getProjectsByCategory(selectedCategory);

    if (selectedClient !== 'all') {
      list = list.filter((p) => p.client.toLowerCase().includes(selectedClient.toLowerCase()));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.client.toLowerCase().includes(query) ||
          p.location.toLowerCase().includes(query) ||
          p.summary.toLowerCase().includes(query) ||
          p.specs.some((s) => s.toLowerCase().includes(query)),
      );
    }

    return list;
  }, [selectedCategory, selectedClient, searchQuery]);

  const handleOpenModal = (project: PortfolioProject) => {
    setActiveModalProject(project);
    if (typeof window !== 'undefined' && window.history) {
      const newUrl = `${window.location.pathname}?project=${project.id.replace(/^prj-/, '')}`;
      window.history.replaceState(null, '', newUrl);
    }
  };

  const handleCloseModal = () => {
    setActiveModalProject(null);
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const handleRequestQuote = (category: ServiceCategory) => {
    setQuoteService(category);
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleApplyEstimate = (category: ServiceCategory, estimateSummary: string) => {
    setQuoteService(category);
    setQuoteMessage(estimateSummary);
  };

  const filterTabs: { id: ServiceCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Projects (6)' },
    { id: 'billboards', label: 'Billboard Skins' },
    { id: 'field_production', label: 'Field Production' },
    { id: 'telescopic_flags', label: 'Telescopic Flags' },
    { id: 'event_branding', label: 'Event Branding' },
    { id: 'wayfinding', label: 'Wayfinding' },
    { id: 'large_format_print', label: 'Large-Format Print' },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0C] text-[#F5F3ED] antialiased selection:bg-red-900 selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          1. STICKY PUBLIC NAVIGATION HEADER
          ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0D0D0C]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" aria-label="Collage Home">
              <Brand />
            </Link>
            <span className="hidden font-mono text-[11px] uppercase tracking-widest text-neutral-500 md:inline-block">
              Portfolio & Credentials
            </span>
          </div>

          <nav className="hidden items-center gap-6 text-xs font-medium text-neutral-300 md:flex">
            <a href="#overview" className="transition-colors hover:text-white">
              Overview
            </a>
            <a href="#services" className="transition-colors hover:text-white">
              Capabilities
            </a>
            <a href="#estimator" className="transition-colors hover:text-white">
              Estimator
            </a>
            <a href="#projects" className="transition-colors hover:text-white">
              Selected Work
            </a>
            <a href="#about" className="transition-colors hover:text-white">
              About Collage
            </a>
            <a href="#contact" className="transition-colors hover:text-white">
              Contact & Quote
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#contact"
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 font-mono text-xs font-semibold text-white shadow-md shadow-red-950 transition-all hover:bg-red-500"
            >
              <span>Request a Quote</span>
              <ArrowRight size={13} aria-hidden="true" />
            </a>

            <Link
              href="/dashboard"
              className="hidden rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-neutral-300 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              Staff Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION
          ───────────────────────────────────────────────────────────── */}
      <section id="overview" className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Ambient background glows */}
        <div
          className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-red-600/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-1/2 left-10 h-72 w-72 rounded-full bg-amber-600/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Operational Status Ticker */}
          <div className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs text-neutral-300 backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
              Live Operations:
            </span>
            <span className="font-medium text-white">
              Ridge Fabrication Hub · AICC Grand Arena Crew · Tema Motorway Rigging Desk
            </span>
          </div>

          <div className="max-w-3xl space-y-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
              Creating Results for <span className="text-red-500">Ghana's Leading Brands.</span>
            </h1>

            <p className="text-base leading-relaxed text-neutral-300 sm:text-lg">
              From heavy-gauge 550gsm highway billboard skins and high-wind telescopic flag fleets to turnkey ministerial arena staging and permanent architectural wayfinding across Ghana.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#projects"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-neutral-200"
              >
                <span>View Selected Work</span>
                <ArrowRight size={14} aria-hidden="true" />
              </a>

              <a
                href="#estimator"
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/20 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-red-300 transition-colors hover:bg-red-950/40"
              >
                <Sparkles size={14} aria-hidden="true" />
                <span>Scope & Budget Estimator</span>
              </a>

              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
              >
                <span>Request Project Proposal</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. SERVICES SECTION: 01 // CORE CAPABILITIES
          ───────────────────────────────────────────────────────────── */}
      <section id="services" className="border-t border-white/10 bg-neutral-950/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-red-400">
                01 // Core Capabilities
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Engineered Out-of-Home & Event Fabrication
              </h2>
            </div>
            <p className="max-w-md text-xs text-neutral-400 sm:text-sm">
              Six specialized operational divisions operating with in-house structural rigging crews and sister manufacturing facility PrintD Pigh.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PORTFOLIO_SERVICES.map((service) => {
              const Icon = getServiceIcon(service.category);
              return (
                <div
                  key={service.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-neutral-900/40 p-6 backdrop-blur-md transition-all duration-200 hover:border-red-500/30 hover:bg-neutral-900/70"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-950/30 text-red-400">
                        <Icon size={20} aria-hidden="true" />
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                        {service.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">
                        {service.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-neutral-300">
                        {service.description}
                      </p>
                    </div>

                    <div className="border-t border-white/5 pt-3">
                      <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                        Key Capabilities
                      </div>
                      <ul className="mt-2 space-y-1.5">
                        {service.capabilities.slice(0, 3).map((cap, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-1.5 text-xs text-neutral-300"
                          >
                            <CheckCircle2
                              size={12}
                              className="mt-0.5 shrink-0 text-emerald-400"
                              aria-hidden="true"
                            />
                            <span>{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[10px] text-neutral-400">
                        Turnaround: {service.turnaround}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRequestQuote(service.category)}
                        className="font-mono text-xs font-semibold text-red-400 hover:text-red-300"
                      >
                        Request Scope &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. ESTIMATOR SECTION: 02 // INSTANT SCOPE & BUDGET ESTIMATOR
          ───────────────────────────────────────────────────────────── */}
      <section id="estimator" className="border-t border-white/10 py-20 bg-gradient-to-b from-[#0D0D0C] via-neutral-950 to-[#0D0D0C]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-red-400">
              02 // Scope Planning
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Simulate Your Commercial Scope & Statutory Levies
            </h2>
            <p className="mt-2 max-w-2xl text-xs text-neutral-400 sm:text-sm">
              Use our live Accra studio estimator to model quantities, turnaround timelines, and statutory tax obligations before dispatching your RFP.
            </p>
          </div>

          <ScopeEstimator onApplyEstimate={handleApplyEstimate} />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. PROJECTS SECTION: 03 // SELECTED WORK
          ───────────────────────────────────────────────────────────── */}
      <section id="projects" className="border-t border-white/10 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-red-400">
                03 // Selected Work
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Proven Deployments Across Ghana
              </h2>
              <p className="mt-2 max-w-2xl text-xs text-neutral-400 sm:text-sm">
                Explore authentic corporate case studies including technical specifications, engineering briefs, and verified results.
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1 self-start md:self-end">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Grid size={13} aria-hidden="true" />
                <span>Visual Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('ledger')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-all ${
                  viewMode === 'ledger'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <List size={13} aria-hidden="true" />
                <span>Engineering Ledger</span>
              </button>
            </div>
          </div>

          {/* Interactive Client Filter Logo Band */}
          <div className="mt-8 border-y border-white/10 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                Filter by Corporate Partner:
              </span>
              {selectedClient !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedClient('all')}
                  className="font-mono text-xs text-red-400 hover:text-red-300"
                >
                  Clear Partner Filter &times;
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {CLIENT_LOGOS.map((client) => {
                const isSelected = selectedClient === client.name || (client.id === 'all' && selectedClient === 'all');
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => setSelectedClient(client.id === 'all' ? 'all' : client.name)}
                    className={`rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-all ${
                      isSelected
                        ? 'border border-red-500 bg-red-950/40 text-white shadow-sm'
                        : 'border border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    <span>{client.name}</span>
                    {client.tag && (
                      <span className="ml-1.5 text-[10px] text-neutral-500 uppercase">
                        · {client.tag}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls Bar: Category Pills + Search */}
          <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Filter Pill Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {filterTabs.map((tab) => {
                const isActive = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`rounded-full px-3.5 py-1.5 font-mono text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-red-600 text-white shadow-md shadow-red-950'
                        : 'border border-white/10 bg-white/5 text-neutral-400 hover:border-white/20 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search specs, materials, clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-8 py-1.5 font-mono text-xs text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Projects View */}
          {viewMode === 'grid' ? (
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onSelect={handleOpenModal}
                />
              ))}
            </div>
          ) : (
            /* Engineering Spec Ledger Table */
            <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/40 backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="border-b border-white/10 bg-white/[0.02] text-neutral-400">
                    <tr>
                      <th className="px-5 py-3.5 uppercase tracking-wider font-semibold">Client & Project</th>
                      <th className="px-4 py-3.5 uppercase tracking-wider font-semibold">Division</th>
                      <th className="px-4 py-3.5 uppercase tracking-wider font-semibold">Location</th>
                      <th className="px-4 py-3.5 uppercase tracking-wider font-semibold">Primary Specification</th>
                      <th className="px-4 py-3.5 uppercase tracking-wider font-semibold">Documented Impact</th>
                      <th className="px-5 py-3.5 text-right uppercase tracking-wider font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-neutral-300">
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-white text-sm">{project.title}</div>
                          <div className="text-red-400 text-[11px] mt-0.5">{project.client}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-block rounded-md border border-red-500/30 bg-red-950/30 px-2 py-0.5 text-[10px] text-red-300 uppercase">
                            {project.categoryLabel}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-neutral-400">
                          {project.location} ({project.year})
                        </td>
                        <td className="px-4 py-4 max-w-xs text-neutral-300">
                          {project.specs[0] || 'Technical specification on file'}
                        </td>
                        <td className="px-4 py-4 max-w-xs text-emerald-400">
                          {project.results[0] || 'Verified deployment'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(project)}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white hover:border-white/20 hover:bg-white/10"
                          >
                            <span>Inspect Specs</span>
                            <ArrowRight size={12} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredProjects.length === 0 && (
            <div className="mt-10 rounded-2xl border border-white/10 bg-neutral-900/30 p-12 text-center">
              <p className="text-sm text-neutral-400">
                No case studies matched your current search criteria.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedClient('all');
                  setSearchQuery('');
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-mono text-xs text-white hover:bg-red-500"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. ABOUT SECTION: 04 // ABOUT COLLAGE
          ───────────────────────────────────────────────────────────── */}
      <section id="about" className="border-t border-white/10 bg-neutral-950/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Left Column: Background & Sister Company */}
            <div className="space-y-6 lg:col-span-5">
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-red-400">
                04 // About Collage
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Engineering Discipline & Ghanaian Scale
              </h2>
              <p className="text-xs leading-relaxed text-neutral-300 sm:text-sm">
                {COMPANY_PROFILE.about}
              </p>
              <p className="text-xs leading-relaxed text-neutral-400 sm:text-sm">
                {COMPANY_PROFILE.history}
              </p>

              {/* Sister Facility PrintD Pigh Highlight */}
              <div className="rounded-xl border border-white/10 bg-neutral-900/60 p-5">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-red-400">
                  <Truck size={14} aria-hidden="true" />
                  <span>Sister Facility: {COMPANY_PROFILE.sisterCompany.name}</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-neutral-300">
                  {COMPANY_PROFILE.sisterCompany.description}
                </p>
              </div>

              {/* Tax Compliance Credential */}
              <div className="rounded-xl border border-emerald-950/50 bg-emerald-950/20 p-5">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <ShieldCheck size={14} aria-hidden="true" />
                  <span>Statutory Tax & Regulatory Rigor</span>
                </div>
                <div className="mt-2 font-mono text-xs text-neutral-300">
                  TIN: {COMPANY_PROFILE.taxCompliance.tin} · GETFund (2.5%) · NHIL (2.5%) · GRA VAT (15.0%)
                </div>
                <p className="mt-1 text-[11px] text-neutral-400">
                  {COMPANY_PROFILE.taxCompliance.authority}
                </p>
              </div>
            </div>

            {/* Right Column: 4 Operational Pillars */}
            <div className="space-y-4 lg:col-span-7">
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
                Four Operational Pillars
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {COMPANY_PROFILE.pillars.map((pillar) => (
                  <div
                    key={pillar.number}
                    className="rounded-xl border border-white/10 bg-neutral-900/40 p-5 backdrop-blur-md"
                  >
                    <div className="font-mono text-xl font-black text-red-500">
                      {pillar.number}
                    </div>
                    <h4 className="mt-2 text-sm font-bold text-white">
                      {pillar.title}
                    </h4>
                    <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                      {pillar.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Company Values Row */}
              <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <div className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Corporate Values
                </div>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {COMPANY_PROFILE.values.map((val, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="font-mono text-xs font-semibold text-white">
                        {val.title}
                      </div>
                      <div className="text-[11px] leading-relaxed text-neutral-400">
                        {val.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. CONTACT & ENQUIRY SECTION: 05 // WORK WITH US
          ───────────────────────────────────────────────────────────── */}
      <section id="contact" className="border-t border-white/10 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Left Column: Contact details */}
            <div className="space-y-6 lg:col-span-5">
              <div>
                <div className="font-mono text-xs font-bold uppercase tracking-widest text-red-400">
                  05 // Work With Us
                </div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Connect With Our Accra Project Desk
                </h2>
                <p className="mt-2 text-xs text-neutral-400 sm:text-sm">
                  Reach out for commercial tenders, flagpole rentals, billboard print runs, and field event staging across Ghana.
                </p>
              </div>

              <div className="space-y-4">
                {/* Physical Location */}
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-neutral-900/40 p-4">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-red-400" aria-hidden="true" />
                  <div>
                    <div className="font-mono text-xs font-semibold uppercase tracking-wider text-white">
                      Headquarters & Commercial Office
                    </div>
                    <div className="mt-1 text-xs text-neutral-300">
                      {COMPANY_PROFILE.headquarters.address}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-neutral-500">
                      Off Independence Avenue, Ridge Corporate Enclave
                    </div>
                  </div>
                </div>

                {/* Telephone */}
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-neutral-900/40 p-4">
                  <Phone size={18} className="mt-0.5 shrink-0 text-red-400" aria-hidden="true" />
                  <div>
                    <div className="font-mono text-xs font-semibold uppercase tracking-wider text-white">
                      Phone & Emergency Field Lines
                    </div>
                    <div className="mt-1 space-y-0.5 font-mono text-xs text-neutral-300">
                      {COMPANY_PROFILE.phoneNumbers.map((p, idx) => (
                        <div key={idx}>
                          <a href={`tel:${p.replace(/\s+/g, '')}`} className="hover:text-white">
                            {p}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-neutral-900/40 p-4">
                  <Mail size={18} className="mt-0.5 shrink-0 text-red-400" aria-hidden="true" />
                  <div>
                    <div className="font-mono text-xs font-semibold uppercase tracking-wider text-white">
                      Electronic Mail & RFPs
                    </div>
                    <div className="mt-1 space-y-0.5 font-mono text-xs text-neutral-300">
                      {COMPANY_PROFILE.emails.map((e, idx) => (
                        <div key={idx}>
                          <a href={`mailto:${e}`} className="hover:text-white">
                            {e}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-neutral-900/40 p-4">
                  <Clock size={18} className="mt-0.5 shrink-0 text-red-400" aria-hidden="true" />
                  <div>
                    <div className="font-mono text-xs font-semibold uppercase tracking-wider text-white">
                      Operational Hours
                    </div>
                    <div className="mt-1 space-y-0.5 text-xs text-neutral-300">
                      <div>{COMPANY_PROFILE.businessHours.weekdays}</div>
                      <div>{COMPANY_PROFILE.businessHours.saturday}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Quote Enquiry Form */}
            <div className="lg:col-span-7">
              <EnquiryForm initialService={quoteService} initialMessage={quoteMessage} />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. FOOTER / EDITORIAL COLOPHON
          ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-[#0A0A09] py-10 font-mono text-xs text-neutral-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <Link href="/" aria-label="Collage Home">
                <Brand />
              </Link>
              <span>·</span>
              <span>Creating Results · Accra, Ghana</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-neutral-400">
              <Link href="/" className="transition-colors hover:text-white">
                Main Portal
              </Link>
              <span>·</span>
              <Link href="/privacy" className="transition-colors hover:text-white">
                Privacy Policy
              </Link>
              <span>·</span>
              <a href="#overview" className="transition-colors hover:text-white">
                Back to Top
              </a>
              <span>·</span>
              <Link href="/dashboard" className="transition-colors hover:text-white">
                Staff Login
              </Link>
            </div>
          </div>

          <div className="mt-6 border-t border-white/5 pt-6 text-center text-[11px] text-neutral-600 sm:text-left">
            Collage Ghana Limited · Sister Company PrintD Pigh · 2 Morocco Lane, Off Independence Avenue, Ridge, Accra · GRA GETFund 2.5% · NHIL 2.5% · VAT 15.0%
          </div>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────
          9. CASE STUDY DETAIL MODAL
          ───────────────────────────────────────────────────────────── */}
      <ProjectModal
        project={activeModalProject}
        isOpen={Boolean(activeModalProject)}
        onClose={handleCloseModal}
        onRequestQuote={handleRequestQuote}
      />
    </div>
  );
}