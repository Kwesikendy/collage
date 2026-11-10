import { useState } from 'react';
import { Link } from 'wouter';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  Flag,
  Layers,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  User,
} from 'lucide-react';
import { Brand } from '@/components/brand';
import {
  COMPANY_PROFILE,
  PORTFOLIO_SERVICES,
  type ServiceCategory,
} from '@/data/portfolio-data';
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
      return Layers;
    case 'wayfinding':
      return Compass;
    case 'large_format_print':
      return Truck;
    default:
      return Layers;
  }
}

export function PortfolioPage() {
  const [quoteService, setQuoteService] = useState<ServiceCategory>('billboards');

  const handleRequestQuote = (category: ServiceCategory) => {
    setQuoteService(category);
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#100F0E] text-[#F4F0E9] antialiased selection:bg-[#E5232B]/30 selection:text-[#F4F0E9]">
      {/* ─────────────────────────────────────────────────────────────
          1. STICKY PUBLIC NAVIGATION HEADER (DARK-GLASS PILL DESIGN)
          ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 pt-3 sm:pt-4 pb-2 px-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border border-[#33302E] bg-[#1B1918]/88 px-4 py-2 sm:px-6 sm:py-2.5 text-[#F4F0E9] shadow-[0_14px_38px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          {/* Left: Brand */}
          <div className="flex items-center">
            <Link href="/" aria-label="Collage Home" className="shrink-0">
              <Brand dark />
            </Link>
          </div>

          {/* Center: Dark-Glass Pill Navigation Links */}
          <nav className="hidden items-center gap-1 text-[12.5px] font-medium text-[#F4F0E9] md:flex" aria-label="Portfolio navigation">
            <a
              href="#overview"
              className="rounded-full border border-[#33302E] bg-[#100F0E]/65 px-3.5 py-1.5 text-[#F4F0E9] no-underline transition-colors hover:border-[#C9C2B9]/35 hover:bg-[#F4F0E9]/[0.06]"
            >
              Overview
            </a>
            <a
              href="#services"
              className="rounded-full px-3.5 py-1.5 text-[#F4F0E9]/90 no-underline transition-colors hover:bg-[#F4F0E9]/[0.06] hover:text-[#F4F0E9]"
            >
              Services
            </a>
            <a
              href="#about"
              className="rounded-full px-3.5 py-1.5 text-[#F4F0E9]/90 no-underline transition-colors hover:bg-[#F4F0E9]/[0.06] hover:text-[#F4F0E9]"
            >
              About Collage
            </a>
            <a
              href="#contact"
              className="rounded-full px-3.5 py-1.5 text-[#F4F0E9]/90 no-underline transition-colors hover:bg-[#F4F0E9]/[0.06] hover:text-[#F4F0E9]"
            >
              Contact & Quote
            </a>
          </nav>

          {/* Right: Circular Icon Actions + Brand Red Pill CTA */}
          <div className="flex items-center gap-2">
            <a
              href="tel:+233247361133"
              title="Call Collage Desk"
              aria-label="Call Collage Desk"
              className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#33302E] bg-[#100F0E]/55 text-[#C9C2B9] transition-colors hover:border-[#C9C2B9]/40 hover:bg-[#F4F0E9]/[0.06] hover:text-[#F4F0E9]"
            >
              <Phone size={14} />
            </a>
            <Link
              href="/dashboard"
              title="Staff Workspace"
              aria-label="Staff Workspace"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#33302E] bg-[#100F0E]/55 text-[#C9C2B9] transition-colors hover:border-[#C9C2B9]/40 hover:bg-[#F4F0E9]/[0.06] hover:text-[#F4F0E9]"
            >
              <User size={15} />
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#E5232B] px-4 sm:px-5 py-2 text-[12.5px] font-semibold text-[#F4F0E9] no-underline shadow-[0_6px_18px_rgba(229,35,43,0.25)] transition-colors hover:bg-[#cf1d25]"
            >
              <span>Request a Quote</span>
              <ArrowRight size={13} aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION (COHESIVE WARM DARK EDITORIAL STAGE)
          ───────────────────────────────────────────────────────────── */}
      <section
        id="overview"
        className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24"
        style={{
          background: [
            'radial-gradient(ellipse 60% 50% at 18% 30%, rgba(27, 25, 24, 0.95) 0%, transparent 70%)',
            'radial-gradient(ellipse 50% 55% at 82% 28%, rgba(229, 35, 43, 0.055) 0%, rgba(27, 25, 24, 0.5) 62%, transparent 80%)',
            'linear-gradient(180deg, #100F0E 0%, #100F0E 80%, #1B1918 100%)',
          ].join(', '),
        }}
      >
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#E5232B]">
              <span>Collage Ghana · Capabilities</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#F4F0E9] sm:text-5xl lg:text-6xl leading-[1.06]">
              Advertising, Event Staging &{' '}
              <span className="text-[#E5232B]">Large-Format Print.</span>
            </h1>

            <p className="text-base leading-relaxed text-[#C9C2B9] sm:text-lg">
              Collage provides outdoor billboard skins, telescopic flagpole rentals, event branding, field setups, and large-format printing across Accra and beyond.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#services"
                className="inline-flex items-center gap-2 rounded-full bg-[#E5232B] px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-[#F4F0E9] shadow-[0_8px_22px_rgba(229,35,43,0.22)] transition-colors hover:bg-[#cf1d25]"
              >
                <span>Explore Services</span>
                <ArrowRight size={14} aria-hidden="true" />
              </a>

              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full border border-[#33302E] bg-[#1B1918]/80 px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-[#F4F0E9] transition-colors hover:border-[#C9C2B9]/40 hover:bg-[#1B1918]"
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
                      className="font-mono text-xs font-semibold text-red-400 hover:text-red-300 cursor-pointer"
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
          4. ABOUT SECTION: ABOUT COLLAGE
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
              <div className="rounded-xl border border-white/15 bg-neutral-900/70 p-5">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#E31E24]">
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
          5. CONTACT & ENQUIRY SECTION: WORK WITH US
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
          6. FOOTER
          ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-[#0A0A09] py-8 font-mono text-xs text-neutral-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <Link href="/" aria-label="Collage Home">
                <Brand dark />
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
    </div>
  );
}