import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'wouter';
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
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
  ShieldCheck,
  Sparkles,
  Truck,
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

export function PortfolioPage() {
  const params = useParams<{ id?: string }>();
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'ledger'>('grid');
  const [activeModalProject, setActiveModalProject] = useState<PortfolioProject | null>(null);
  const [quoteService, setQuoteService] = useState<ServiceCategory>('billboards');

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
  }, [selectedCategory, searchQuery]);

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

  const filterTabs: { id: ServiceCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Services (6)' },
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
              Portfolio & Services
            </span>
          </div>

          <nav className="hidden items-center gap-6 text-xs font-medium text-neutral-300 md:flex">
            <a href="#services" className="transition-colors hover:text-white">
              Services
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
      <section id="overview" className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
        {/* Subtle background glow */}
        <div
          className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-red-600/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
              Advertising, Event Staging & <span className="text-red-500">Large-Format Print.</span>
            </h1>

            <p className="text-base leading-relaxed text-neutral-300 sm:text-lg">
              Collage provides outdoor billboard skins, telescopic flagpole rentals, event branding, field setups, and large-format printing across Accra and beyond.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#services"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-neutral-200"
              >
                <span>Explore Services</span>
                <ArrowRight size={14} aria-hidden="true" />
              </a>

              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
              >
                <span>Request a Quote</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. SERVICES SECTION: OUR SERVICES
          ───────────────────────────────────────────────────────────── */}
      <section id="services" className="border-t border-white/10 bg-neutral-950/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-red-400">
                Our Services
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                What We Do
              </h2>
            </div>
            <p className="max-w-md text-xs text-neutral-400 sm:text-sm">
              From equipment rentals and outdoor billboard skins to event setup and high-volume printing.
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
                        Scope & Offerings
                      </div>
                      <ul className="mt-2 space-y-1.5">
                        {service.capabilities.map((cap, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-1.5 text-xs text-neutral-300"
                          >
                            <CheckCircle2
                              size={12}
                              className="mt-0.5 shrink-0 text-red-400"
                              aria-hidden="true"
                            />
                            <span>{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-4">
                    <button
                      type="button"
                      onClick={() => handleRequestQuote(service.category)}
                      className="font-mono text-xs font-semibold text-red-400 hover:text-red-300"
                    >
                      Request Quote &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. PROJECTS SECTION: SELECTED WORK
          ───────────────────────────────────────────────────────────── */}
      <section id="projects" className="border-t border-white/10 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-red-400">
                Selected Work
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Recent Deployments & Projects
              </h2>
              <p className="mt-2 max-w-2xl text-xs text-neutral-400 sm:text-sm">
                Representative examples of signage, billboard skins, flagpoles, and event setups.
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
                <span>Card View</span>
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
                <span>Table View</span>
              </button>
            </div>
          </div>

          {/* Controls Bar: Category Pills + Search */}
          <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                placeholder="Search projects..."
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
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onSelect={handleOpenModal}
                />
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/40 backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="border-b border-white/10 bg-white/[0.02] text-neutral-400">
                    <tr>
                      <th className="px-5 py-3.5 uppercase tracking-wider font-semibold">Client & Project</th>
                      <th className="px-4 py-3.5 uppercase tracking-wider font-semibold">Category</th>
                      <th className="px-4 py-3.5 uppercase tracking-wider font-semibold">Location</th>
                      <th className="px-4 py-3.5 uppercase tracking-wider font-semibold">Scope Details</th>
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
                          {project.summary}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(project)}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white hover:border-white/20 hover:bg-white/10"
                          >
                            <span>View Details</span>
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
            <div className="mt-8 rounded-2xl border border-white/10 bg-neutral-900/30 p-12 text-center">
              <p className="text-sm text-neutral-400">
                No projects found matching your search.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-mono text-xs text-white hover:bg-red-500"
              >
                Reset Search
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. ABOUT SECTION: ABOUT COLLAGE
          ───────────────────────────────────────────────────────────── */}
      <section id="about" className="border-t border-white/10 bg-neutral-950/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* Left Column: Real factual company background */}
            <div className="space-y-4 lg:col-span-6">
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-red-400">
                About Collage
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Advertising, Branding & Event Solutions
              </h2>
              <p className="text-sm leading-relaxed text-neutral-300">
                {COMPANY_PROFILE.about}
              </p>
              <p className="text-sm leading-relaxed text-neutral-400">
                {COMPANY_PROFILE.history}
              </p>

              {/* Sister Facility PrintD Pigh */}
              <div className="mt-6 rounded-xl border border-white/10 bg-neutral-900/60 p-4">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-red-400">
                  <Truck size={14} aria-hidden="true" />
                  <span>Print Partner: {COMPANY_PROFILE.sisterCompany.name}</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-neutral-300">
                  {COMPANY_PROFILE.sisterCompany.description}
                </p>
              </div>
            </div>

            {/* Right Column: Corporate compliance and details */}
            <div className="space-y-4 lg:col-span-6">
              <div className="rounded-xl border border-emerald-950/50 bg-emerald-950/20 p-5">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <ShieldCheck size={16} aria-hidden="true" />
                  <span>Statutory Registration & Taxes</span>
                </div>
                <div className="mt-3 space-y-1 font-mono text-xs text-neutral-300">
                  <div>TIN: {COMPANY_PROFILE.taxCompliance.tin}</div>
                  <div>Levies: GETFund (2.5%) · NHIL (2.5%) · GRA VAT (15.0%)</div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    {COMPANY_PROFILE.taxCompliance.authority}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-4">
                  <div className="font-mono text-xs font-semibold text-white">
                    Office Location
                  </div>
                  <div className="mt-2 text-xs text-neutral-300">
                    {COMPANY_PROFILE.headquarters.address}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-4">
                  <div className="font-mono text-xs font-semibold text-white">
                    Direct Contact
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-neutral-300">
                    <div>{COMPANY_PROFILE.phoneNumbers[0]}</div>
                    <div>{COMPANY_PROFILE.emails[0]}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. CONTACT & ENQUIRY SECTION: WORK WITH US
          ───────────────────────────────────────────────────────────── */}
      <section id="contact" className="border-t border-white/10 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Left Column: Contact details */}
            <div className="space-y-6 lg:col-span-5">
              <div>
                <div className="font-mono text-xs font-bold uppercase tracking-widest text-red-400">
                  Get in Touch
                </div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Request a Project Quote
                </h2>
                <p className="mt-2 text-xs text-neutral-400 sm:text-sm">
                  Send your enquiry for billboard skins, flagpole rentals, event branding, or printing.
                </p>
              </div>

              <div className="space-y-3">
                {/* Physical Location */}
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-neutral-900/40 p-4">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-red-400" aria-hidden="true" />
                  <div>
                    <div className="font-mono text-xs font-semibold uppercase tracking-wider text-white">
                      Office Address
                    </div>
                    <div className="mt-1 text-xs text-neutral-300">
                      {COMPANY_PROFILE.headquarters.address}
                    </div>
                  </div>
                </div>

                {/* Telephone */}
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-neutral-900/40 p-4">
                  <Phone size={18} className="mt-0.5 shrink-0 text-red-400" aria-hidden="true" />
                  <div>
                    <div className="font-mono text-xs font-semibold uppercase tracking-wider text-white">
                      Phone Lines
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
                      Email
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
                      Working Hours
                    </div>
                    <div className="mt-1 space-y-0.5 text-xs text-neutral-300">
                      <div>{COMPANY_PROFILE.businessHours.weekdays}</div>
                      <div>Saturday: {COMPANY_PROFILE.businessHours.saturday}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Quote Enquiry Form */}
            <div className="lg:col-span-7">
              <EnquiryForm initialService={quoteService} />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. FOOTER
          ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-[#0A0A09] py-8 font-mono text-xs text-neutral-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <Link href="/" aria-label="Collage Home">
                <Brand />
              </Link>
              <span>·</span>
              <span>Accra, Ghana</span>
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

          <div className="mt-4 border-t border-white/5 pt-4 text-center text-[11px] text-neutral-600 sm:text-left">
            Collage Ghana Limited · Sister Company PrintD Pigh · 2 Morocco Lane, Off Independence Avenue, Ridge, Accra
          </div>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────
          8. CASE STUDY DETAIL MODAL
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