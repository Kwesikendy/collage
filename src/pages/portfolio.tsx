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
  Sparkles,
  Truck,
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
  const [quoteService, setQuoteService] = useState<ServiceCategory>('billboards');

  const handleRequestQuote = (category: ServiceCategory) => {
    setQuoteService(category);
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
              Services & Capabilities
            </span>
          </div>

          <nav className="hidden items-center gap-6 text-xs font-medium text-neutral-300 md:flex">
            <a href="#services" className="transition-colors hover:text-white">
              Services
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
    </div>
  );
}