import { type ReactNode, useState } from 'react';
import { Link } from 'wouter';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Compass,
  Flag,
  Globe,
  Layers,
  Mail,
  MapPin,
  Menu,
  Phone,
  Printer,
  Quote,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { Brand } from '@/components/brand';
import { LandingMark } from '@/components/landing/mark';

import portfolioBillboardImg from '@/assets/images/portfolio_billboard_accra_1794561742216.jpg';
import portfolioWayfindingImg from '@/assets/images/portfolio_wayfinding_pylon_1794561743430.jpg';
import portfolioStageImg from '@/assets/images/portfolio_event_stage_1794561744650.jpg';
import portfolioFlagsImg from '@/assets/images/portfolio_telescopic_flags_1794561745575.jpg';

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
   HERO INTERACTIVE VISUAL WITH PIECE-ARRIVING LOGO ANIMATION
   Preserves the signature Collage piece-arriving LandingMark animation
   on the right side of the Seobay-style 2-column Hero stage.
   ============================================================================ */

const HERO_OPERATIONAL_SCENARIOS = [
  {
    id: 'dispatch',
    label: 'Brief & Scope',
    invoiceRef: 'INV #00081126.01',
    invoiceClient: 'GHS 105,285.96 · Kasapreko',
    settlementAmount: 'GHS 65,000.00 · Ecobank',
    settlementChannel: 'Bank Wire',
  },
  {
    id: 'rigging',
    label: 'Field Rigging',
    invoiceRef: 'INV #00141126.02',
    invoiceClient: 'GHS 48,450.00 · MTN Ghana',
    settlementAmount: 'GHS 48,450.00 · Stanbic',
    settlementChannel: 'RTGS Transfer',
  },
  {
    id: 'settlement',
    label: 'Settled in Full',
    invoiceRef: 'INV #00191126.01',
    invoiceClient: 'GHS 82,900.00 · Standard Chartered',
    settlementAmount: 'GHS 82,900.00 · Cleared',
    settlementChannel: 'Corporate Wire',
  },
] as const;

function HeroInteractiveVisual() {
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const activeScenario = HERO_OPERATIONAL_SCENARIOS[activeScenarioIndex];

  return (
    <div className="landing-hero__visual relative flex flex-col justify-center items-center w-full">
      <div className="relative flex w-full justify-center items-center">
        {/* Central Piece-Arriving Collage Logo Animation */}
        <div className="relative z-10 w-full flex justify-center">
          <LandingMark />
        </div>
      </div>

      {/* Clean Static Operational Status Strip (Fits Mobile & Desktop without Clipping) */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md z-20">
        <button
          type="button"
          onClick={() =>
            setActiveScenarioIndex((prev) => (prev + 1) % HERO_OPERATIONAL_SCENARIOS.length)
          }
          className="flex items-center gap-2.5 rounded-xl border border-[#33302E] bg-[#1B1918] px-3.5 py-2.5 text-left transition-colors hover:border-[#C9C2B9]/40 cursor-pointer"
        >
          <ReceiptText size={15} className="text-[#E5232B] shrink-0" />
          <div className="font-mono text-[10.5px] leading-tight min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[#F4F0E9]">{activeScenario.invoiceRef}</span>
              <span className="text-[9px] font-bold text-[#E5232B] tracking-wider">
                DISPATCHED
              </span>
            </div>
            <div className="mt-0.5 text-[10px] text-[#C9C2B9] font-sans truncate">
              {activeScenario.invoiceClient}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveScenarioIndex((prev) => (prev + 1) % HERO_OPERATIONAL_SCENARIOS.length)
          }
          className="flex items-center gap-2.5 rounded-xl border border-[#33302E] bg-[#1B1918] px-3.5 py-2.5 text-left transition-colors hover:border-[#C9C2B9]/40 cursor-pointer"
        >
          <CheckCircle2 size={15} className="text-[#008F68] shrink-0" />
          <div className="font-mono text-[10.5px] leading-tight min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[#008F68]">SETTLED IN FULL</span>
              <span className="text-[9px] text-[#C9C2B9]/80">
                {activeScenario.settlementChannel}
              </span>
            </div>
            <div className="mt-0.5 text-[10px] text-[#F4F0E9] font-sans font-medium truncate">
              {activeScenario.settlementAmount}
            </div>
          </div>
        </button>
      </div>

      {/* Interactive Operational Scenario Selector Nodes */}
      <div
        className="mt-3 flex flex-wrap items-center justify-center gap-1.5 z-20"
        role="group"
        aria-label="Operational scenarios"
      >
        {HERO_OPERATIONAL_SCENARIOS.map((scenario, idx) => {
          const isActive = idx === activeScenarioIndex;
          return (
            <button
              key={scenario.id}
              type="button"
              onClick={() => setActiveScenarioIndex(idx)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10.5px] font-mono transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-[#E5232B] bg-[#1B1918] text-[#F4F0E9]'
                  : 'border-[#33302E] bg-[#100F0E] text-[#C9C2B9]/80 hover:border-[#C9C2B9]/35 hover:text-[#F4F0E9]'
              }`}
            >
              <span>{scenario.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   SECTION 2: "HOW CAN WE HELP YOU?" — 6-CARD SERVICES GRID (SEOBAY LAYOUT)
   ============================================================================ */

const SEOBAY_STYLE_SERVICES = [
  {
    id: 'design-billboards',
    title: 'Billboard Skins & Design',
    description:
      'Heavy-duty outdoor PVC billboard skin production, reinforced welded hem pockets, and highway tension rigging across major corridors in Accra and beyond.',
    meta: 'Outdoor Media · Highway Rigging',
    icon: Layers,
    href: '/portfolio#services',
  },
  {
    id: 'development-staging',
    title: 'Field Production & Staging',
    description:
      'Turnkey modular aluminum box trussing, height-adjustable stage platforms, temporary outdoor pavilions, and dedicated on-site technical crew.',
    meta: 'Event Infrastructure · Trussing',
    icon: Building2,
    href: '/portfolio#services',
  },
  {
    id: 'marketing-flags',
    title: 'Telescopic Flagpole Fleet',
    description:
      'Adjustable aluminum telescopic flagpole rentals with heavy fillable water or sand ballast bases and custom dye-sublimated corporate flags.',
    meta: 'Rental Fleet · Same-Day Dispatch',
    icon: Flag,
    href: '/portfolio#services',
  },
  {
    id: 'social-activations',
    title: 'Event Branding & Backdrops',
    description:
      'Non-reflective matte stage backdrops, step-and-repeat sponsor media walls, branded conference lecterns, and promotional roll-up displays.',
    meta: 'Brand Activations · Media Walls',
    icon: Sparkles,
    href: '/portfolio#services',
  },
  {
    id: 'print-production',
    title: 'Large-Format Print (PrintD)',
    description:
      'Produced with our sister facility PrintD Pigh: commercial fleet vehicle wraps, one-way vision window films, vinyl decals, and mesh building wraps.',
    meta: 'Sister Facility · PrintD Pigh',
    icon: Printer,
    href: '/portfolio#services',
  },
  {
    id: 'support-wayfinding-tax',
    title: 'Wayfinding & GRA Tax Desk',
    description:
      'Architectural directional pylons and 3D corporate signage paired with our unified quotation-to-invoice ledger (GETFund 2.5%, NHIL 2.5%, VAT 15%).',
    meta: 'Signage · Statutory Compliance',
    icon: Compass,
    href: '#workspace',
  },
] as const;

function HowCanWeHelpSection() {
  return (
    <section
      id="services"
      className="relative border-t border-[#33302E] bg-[#161514] py-20 sm:py-28"
      aria-labelledby="how-we-help-heading"
    >
      <div className="landing-wrap">
        {/* Centered Header (Mirrors Seobay "How can we help you?" + subtitle + Book Appointment button) */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E5232B]">
            Full-Spectrum Capabilities
          </p>
          <h2
            id="how-we-help-heading"
            className="mt-3 text-[clamp(30px,4.2vw,48px)] font-semibold tracking-[-0.035em] text-[#F4F0E9] leading-[1.08]"
            style={{ fontFamily: 'var(--landing-display)' }}
          >
            How can we help you?
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-[#C9C2B9]">
            From high-visibility highway billboard skins and telescopic flagpole rentals to turnkey stage production and statutory GRA-compliant billing across Ghana.
          </p>
          <div className="mt-7 flex justify-center">
            <Link
              href="/portfolio#contact"
              className="landing-cta landing-cta--solid whitespace-nowrap"
            >
              <span>Book Appointment</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* 3x2 Grid of 6 Service Cards (Mirrors Seobay 6-box layout with Collage dark/crimson theme) */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SEOBAY_STYLE_SERVICES.map((service) => {
            const Icon = service.icon;
            const isAnchor = service.href.startsWith('#');
            const CardTag = isAnchor ? 'a' : Link;

            return (
              <CardTag
                key={service.id}
                href={service.href}
                className="group flex flex-col justify-between rounded-2xl border border-[#33302E] bg-[#100F0E] p-8 sm:p-9 no-underline transition-colors duration-200 hover:border-[#E5232B]/50 hover:bg-[#1B1918]"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#E5232B]/12 text-[#E5232B] transition-colors duration-200 group-hover:bg-[#E5232B] group-hover:text-[#F4F0E9]">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <ArrowUpRight
                      size={18}
                      className="text-[#C9C2B9]/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#E5232B]"
                      aria-hidden="true"
                    />
                  </div>

                  <h3
                    className="mt-6 text-[21px] font-semibold tracking-[-0.02em] text-[#F4F0E9] transition-colors group-hover:text-white"
                    style={{ fontFamily: 'var(--landing-display)' }}
                  >
                    {service.title}
                  </h3>

                  <p className="mt-3 text-[14.5px] leading-relaxed text-[#C9C2B9]">
                    {service.description}
                  </p>
                </div>

                <div className="mt-7 border-t border-[#33302E] pt-4 flex items-center justify-between text-[12px] font-mono text-[#C9C2B9]/80">
                  <span>{service.meta}</span>
                  <span className="text-[#E5232B] font-medium">Explore →</span>
                </div>
              </CardTag>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   SECTION 3: "PORTFOLIO" — 4-COLUMN VISUAL SHOWCASE + EXPLORE MORE CTA
   ============================================================================ */

const PORTFOLIO_SHOWCASE_ITEMS = [
  {
    id: 'mtn-billboard-skins',
    title: 'Highway Billboard Skins & Mounting',
    client: 'Major Arterial Corridors · Accra',
    category: 'Outdoor Advertising',
    image: portfolioBillboardImg,
    fallbackIcon: Layers,
  },
  {
    id: 'ecobank-wayfinding',
    title: 'Directional Pylons & Wayfinding',
    client: 'Corporate Head Office · Ridge, Accra',
    category: 'Wayfinding Signage',
    image: portfolioWayfindingImg,
    fallbackIcon: Compass,
  },
  {
    id: 'ghana-energy-summit',
    title: 'Summit Stage & Truss Production',
    client: 'AICC Grand Arena · Accra',
    category: 'Field Production',
    image: portfolioStageImg,
    fallbackIcon: Building2,
  },
  {
    id: 'african-protocol-flags',
    title: 'Telescopic Flagpole Fleet Deployment',
    client: 'Diplomatic & Corporate Forecourts',
    category: 'Equipment Rental',
    image: portfolioFlagsImg,
    fallbackIcon: Flag,
  },
] as const;

function PortfolioSection() {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <section
      id="portfolio"
      className="relative border-t border-[#33302E] bg-[#100F0E] py-20 sm:py-28"
      aria-labelledby="portfolio-section-heading"
    >
      <div className="landing-wrap">
        {/* Centered Header (Mirrors Seobay "Portfolio" section) */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E5232B]">
            Selected Executions
          </p>
          <h2
            id="portfolio-section-heading"
            className="mt-3 text-[clamp(30px,4.2vw,48px)] font-semibold tracking-[-0.035em] text-[#F4F0E9] leading-[1.08]"
            style={{ fontFamily: 'var(--landing-display)' }}
          >
            Portfolio
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-[#C9C2B9]">
            Recent outdoor billboard campaigns, architectural wayfinding pylons, conference stage builds, and telescopic flagpole deployments across Ghana.
          </p>
        </div>

        {/* 4-Column Square Image Showcase Grid (Mirrors Seobay 4-column portfolio strip) */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PORTFOLIO_SHOWCASE_ITEMS.map((item) => {
            const FallbackIcon = item.fallbackIcon;
            const hasFailed = Boolean(failedImages[item.id]);

            return (
              <Link
                key={item.id}
                href={`/portfolio/${item.id}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#33302E] bg-[#161514] no-underline transition-colors duration-200 hover:border-[#E5232B]/60"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-[#1B1918]">
                  {!hasFailed ? (
                    <img
                      src={item.image}
                      alt={`${item.title} — ${item.client}`}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [item.id]: true }))
                      }
                      className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-90"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#1B1918] p-6 text-center">
                      <FallbackIcon size={32} className="text-[#E5232B]" />
                      <span className="font-mono text-xs text-[#C9C2B9]">{item.category}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#100F0E] via-[#100F0E]/35 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-5">
                    <span className="font-mono text-[11px] font-medium text-[#E5232B]">
                      {item.category}
                    </span>
                    <h3
                      className="mt-1 text-[17px] font-semibold leading-snug text-[#F4F0E9] group-hover:text-white"
                      style={{ fontFamily: 'var(--landing-display)' }}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[12.5px] text-[#C9C2B9]">{item.client}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Centered "EXPLORE MORE" CTA Button (Mirrors Seobay button below portfolio) */}
        <div className="mt-12 flex justify-center">
          <Link
            href="/portfolio"
            className="landing-cta landing-cta--solid px-8 whitespace-nowrap"
          >
            <span>EXPLORE MORE</span>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   SECTION 4: "OUR CUSTOMERS" — 4-COLUMN CLIENT TRUST STRIP (SEOBAY LAYOUT)
   ============================================================================ */

const CORPORATE_CUSTOMERS = [
  {
    id: 'ecobank',
    monogram: 'ECO',
    name: 'Ecobank Ghana PLC',
    sector: 'Pan-African Banking · Head Office',
    scope: 'Wayfinding & Signage',
  },
  {
    id: 'mtn',
    monogram: 'MTN',
    name: 'Scancom PLC (MTN)',
    sector: 'Telecommunications · Accra Corridors',
    scope: 'Highway Billboard Skins',
  },
  {
    id: 'stanchart',
    monogram: 'SCB',
    name: 'Standard Chartered',
    sector: 'Corporate & Institutional Banking',
    scope: 'Outdoor Event Pavilions',
  },
  {
    id: 'enterprise',
    monogram: 'EIC',
    name: 'Enterprise Insurance',
    sector: 'Insurance & Financial Services',
    scope: 'Corporate Fleet Branding',
  },
] as const;

function OurCustomersSection() {
  return (
    <section
      id="customers"
      className="relative border-t border-[#33302E] bg-[#161514] py-20 sm:py-24"
      aria-labelledby="our-customers-heading"
    >
      <div className="landing-wrap">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E5232B]">
            Verified Institutional Partners
          </p>
          <h2
            id="our-customers-heading"
            className="mt-3 text-[clamp(30px,4.2vw,48px)] font-semibold tracking-[-0.035em] text-[#F4F0E9] leading-[1.08]"
            style={{ fontFamily: 'var(--landing-display)' }}
          >
            Our Customers
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-[#C9C2B9]">
            Trusted by leading banking, telecommunications, energy, and corporate institutions across Ghana for mission-critical branding and field operations.
          </p>
        </div>

        {/* 4-Column Client Brand Grid (Mirrors Seobay 4-logo strip) */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CORPORATE_CUSTOMERS.map((client) => (
            <div
              key={client.id}
              className="flex flex-col items-center justify-center rounded-2xl border border-[#33302E] bg-[#100F0E] px-6 py-8 text-center transition-colors hover:border-[#C9C2B9]/30"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#E5232B]/35 bg-[#1B1918] font-mono text-sm font-bold tracking-wider text-[#E5232B]">
                {client.monogram}
              </div>
              <h3
                className="mt-4 text-[17px] font-semibold text-[#F4F0E9]"
                style={{ fontFamily: 'var(--landing-display)' }}
              >
                {client.name}
              </h3>
              <p className="mt-1 text-[12.5px] text-[#C9C2B9]">{client.sector}</p>
              <span className="mt-3 font-mono text-[11px] text-[#E5232B]">{client.scope}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   SECTION 5: CUSTOMER TESTIMONIAL SPOTLIGHT (SEOBAY CENTERED QUOTE BAND)
   ============================================================================ */

const CLIENT_TESTIMONIALS = [
  {
    id: 'ecobank',
    headline: '“Amazing Designs and Quality Work!”',
    quote:
      'Collage fabricated and installed our architectural directional pylons and wayfinding signage across our Ridge headquarters on schedule. Every quotation and GRA tax invoice reconciled cleanly with our corporate procurement desk.',
    author: 'Nana Ama Mensah',
    role: 'Head of Corporate Brand & Spaces, Ecobank Ghana PLC',
    initials: 'NM',
  },
  {
    id: 'mtn',
    headline: '“Precision Rigging Across Every Highway Corridor!”',
    quote:
      'From heavy-duty PVC billboard skin printing to rapid tension mounting along Accra arterial routes, Collage and PrintD Pigh delivered vibrant color consistency and zero campaign delays.',
    author: 'Kofi Boateng',
    role: 'Brand Operations Lead, Scancom PLC (MTN Ghana)',
    initials: 'KB',
  },
  {
    id: 'stanchart',
    headline: '“Reliable Field Production & Transparent Billing!”',
    quote:
      'Our temporary outdoor pavilion and telescopic flag fleet at Independence Square were assembled ahead of opening day and dismantled cleanly. Their itemized rental-day ledger makes sign-off effortless.',
    author: 'Abena Ofori-Atta',
    role: 'Corporate Affairs Directorate, Standard Chartered Bank Ghana',
    initials: 'AO',
  },
] as const;

function TestimonialSpotlightSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = CLIENT_TESTIMONIALS[activeIndex];

  return (
    <section
      className="relative border-t border-[#33302E] bg-[#100F0E] py-20 sm:py-28"
      aria-label="Customer Testimonial"
    >
      <div className="landing-wrap">
        <div className="mx-auto max-w-[760px] rounded-2xl border border-[#33302E] bg-[#161514] px-6 py-12 sm:px-14 sm:py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E5232B]/15 text-[#E5232B]">
            <Quote size={22} aria-hidden="true" />
          </div>

          <h3
            className="mt-6 text-[clamp(24px,3.5vw,36px)] font-semibold tracking-[-0.03em] text-[#F4F0E9]"
            style={{ fontFamily: 'var(--landing-display)' }}
          >
            {current.headline}
          </h3>

          <p className="mt-5 text-[16px] sm:text-[17px] leading-relaxed text-[#C9C2B9]">
            {current.quote}
          </p>

          {/* Author Avatar & Credentials (Mirrors Seobay testimonial block) */}
          <div className="mt-8 flex flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#E5232B] bg-[#100F0E] font-mono text-sm font-bold text-[#F4F0E9]">
              {current.initials}
            </div>
            <h4
              className="mt-3 text-[18px] font-semibold text-[#F4F0E9]"
              style={{ fontFamily: 'var(--landing-display)' }}
            >
              {current.author}
            </h4>
            <p className="mt-0.5 text-[13px] text-[#C9C2B9]">{current.role}</p>
          </div>

          {/* Interactive Testimonial Switcher */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {CLIENT_TESTIMONIALS.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`rounded-md border px-3 py-1.5 font-mono text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
                  idx === activeIndex
                    ? 'border-[#E5232B] bg-[#E5232B] text-[#F4F0E9] font-semibold'
                    : 'border-[#33302E] bg-[#100F0E] text-[#C9C2B9] hover:border-[#C9C2B9]/40 hover:text-[#F4F0E9]'
                }`}
              >
                {item.author.split(' ')[0]} · {item.id.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   SECTION 6: "MEET OUR LEADERSHIP" — 3-COLUMN TEAM GRID (SEOBAY LAYOUT)
   ============================================================================ */

const LEADERSHIP_TEAM = [
  {
    name: 'Kojo Mensah',
    role: 'Founder & Managing Director',
    department: 'Corporate Strategy & Key Accounts',
    bio: 'Leads institutional partnerships, commercial scoping, and executive delivery across Accra and regional corridors.',
    initials: 'KM',
  },
  {
    name: 'Kwame Osei',
    role: 'Director OPS',
    department: 'Field Rigging & Telescopic Fleet',
    bio: 'Oversees highway billboard skin installations, stage truss engineering, and same-day telescopic flagpole dispatch.',
    initials: 'KO',
  },
  {
    name: 'Ama Serwaa',
    role: 'Director Commercial & Finance',
    department: 'PrintD Dispatch & GRA Compliance',
    bio: 'Directs PrintD Pigh large-format production queues, marketer revenue targets, and statutory Ghana tax reconciliation.',
    initials: 'AS',
  },
] as const;

function MeetOurLeadershipSection() {
  return (
    <section
      id="about"
      className="relative border-t border-[#33302E] bg-[#161514] py-20 sm:py-28"
      aria-labelledby="leadership-heading"
    >
      <div className="landing-wrap">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E5232B]">
            Accra Operations Command
          </p>
          <h2
            id="leadership-heading"
            className="mt-3 text-[clamp(30px,4.2vw,48px)] font-semibold tracking-[-0.035em] text-[#F4F0E9] leading-[1.08]"
            style={{ fontFamily: 'var(--landing-display)' }}
          >
            Meet Our Leadership
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-[#C9C2B9]">
            The executive and operational leads driving Collage and our sister production house PrintD Pigh across Ghana.
          </p>
        </div>

        {/* 3-Column Leadership Cards (Mirrors Seobay 3-column team layout) */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {LEADERSHIP_TEAM.map((leader) => (
            <div
              key={leader.name}
              className="flex flex-col justify-between rounded-2xl border border-[#33302E] bg-[#100F0E] p-7 sm:p-8 transition-colors hover:border-[#E5232B]/40"
            >
              <div>
                <div className="flex items-center justify-between gap-4 border-b border-[#33302E] pb-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#E5232B]/40 bg-[#1B1918] font-mono text-lg font-bold text-[#E5232B]">
                    {leader.initials}
                  </div>
                  <span className="font-mono text-[11px] text-[#C9C2B9]/80 text-right">
                    {leader.department}
                  </span>
                </div>

                <h3
                  className="mt-5 text-[22px] font-semibold text-[#F4F0E9]"
                  style={{ fontFamily: 'var(--landing-display)' }}
                >
                  {leader.name}
                </h3>
                <p className="mt-1 font-mono text-[12px] font-medium text-[#E5232B]">
                  {leader.role}
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-[#C9C2B9]">
                  {leader.bio}
                </p>
              </div>

              <div className="mt-6 border-t border-[#33302E] pt-3.5 flex items-center justify-between font-mono text-[11px] text-[#C9C2B9]/70">
                <span>Ridge HQ · Accra</span>
                <span>Verified Operator</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   SECTION 7: THE LIVING THREAD WORKSPACE LEDGER PREVIEW (#workspace)
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
  const [activeStage, setActiveStage] = useState<0 | 1 | 2>(1);
  const reduce = useReducedMotion();

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
          statusText: 'VERIFIED CORPORATE RECORD',
          statusClass: 'text-neutral-300',
        }
      : activeStage === 1
        ? {
            ref: 'REF: QT00241026.01',
            statusText: 'PENDING RECONCILIATION',
            statusClass: 'text-[#E31E24]',
          }
        : {
            ref: 'REF: INV00221026.01',
            statusText: 'CLEARED IN FULL',
            statusClass: 'text-white',
          };

  return (
    <section id="workspace" className="relative border-t border-[#33302E] bg-[#100F0E] py-20 sm:py-28">
      <div className="landing-wrap">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-[#E02B20] uppercase">
            Live Operations Desk
          </p>
          <h2
            className="mt-3 text-[clamp(30px,4.2vw,48px)] font-semibold tracking-[-0.035em] text-[#F5F3ED] leading-[1.08]"
            style={{ fontFamily: 'var(--landing-display)' }}
          >
            One client. One living sheet. Settled without loose ends.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-[#C9C2B9]">
            Every job starts as a verified corporate profile, scopes cleanly with statutory Ghana levies, and converts directly into a reconciled tax invoice.
          </p>
        </div>

        {/* Stage Switcher */}
        <div className="mt-9 flex justify-center">
          <div
            role="tablist"
            aria-label="Document lifecycle stages"
            className="inline-flex flex-wrap items-center justify-center rounded-lg border border-[#33302E] bg-[#161514] p-1"
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
                  className={`relative flex items-center gap-2 rounded-md px-4 py-2 font-mono text-[11.5px] tracking-[0.04em] transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-white font-medium'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="living-thread-tab-pill"
                      className="absolute inset-0 rounded-md border border-white/10 bg-[#E5232B]"
                      transition={{ duration: 0.25, ease: fluidEase }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Document Container */}
        <div className="mx-auto mt-7 max-w-4xl rounded-xl border border-[#33302E] bg-[#161514] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#33302E] bg-[#1B1918] px-6 py-3.5 sm:px-8">
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-400">
              <span className="text-neutral-200 font-medium">COLLAGE OPS DESK</span>
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

          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {activeStage === 0 && (
                <motion.div
                  key="stage-client"
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? {} : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: fluidEase }}
                  className="space-y-7"
                >
                  <div className="flex flex-wrap items-start justify-between gap-6 border-b border-[#33302E] pb-6">
                    <div>
                      <p className="font-mono text-[11px] tracking-widest text-neutral-400 uppercase">
                        Master Account Ledger
                      </p>
                      <h3 className="mt-1.5 text-2xl sm:text-3xl font-medium tracking-tight text-white">
                        Ecobank Ghana PLC
                      </h3>
                      <p className="mt-1 text-[13.5px] text-neutral-400">
                        Banking & Financial Services · Head Office Account
                      </p>
                    </div>

                    <div className="rounded-lg border border-[#33302E] bg-[#100F0E] px-4 py-2.5 text-right">
                      <span className="block font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
                        GRA Taxpayer ID
                      </span>
                      <span className="mt-0.5 block font-mono text-[13px] font-medium tracking-tight text-white">
                        TIN · C0004829104
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 rounded-lg border border-[#33302E] divide-y sm:divide-y-0 sm:divide-x divide-[#33302E] bg-[#100F0E]">
                    <div className="p-5 space-y-4">
                      <div>
                        <span className="block font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
                          Primary Contact
                        </span>
                        <strong className="mt-1 block text-[14.5px] font-medium text-white">
                          Nana Ama Mensah
                        </strong>
                        <span className="mt-0.5 block text-[12.5px] text-neutral-400">
                          Head of Corporate Brand & Spaces
                        </span>
                      </div>
                      <div className="border-t border-[#33302E] pt-4">
                        <span className="block font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
                          Direct Correspondence
                        </span>
                        <span className="mt-1 block font-mono text-[13px] text-neutral-200">
                          +233 24 431 8902 · n.mensah@ecobank.com.gh
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div>
                        <span className="block font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
                          Billing Address
                        </span>
                        <strong className="mt-1 block text-[14.5px] font-medium text-white">
                          2 Morocco Lane, Off Independence Ave
                        </strong>
                        <span className="mt-0.5 block text-[12.5px] text-neutral-400">
                          Ridge, Accra · Greater Accra Region
                        </span>
                      </div>
                      <div className="border-t border-[#33302E] pt-4">
                        <span className="block font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
                          Active Scope Attached
                        </span>
                        <span className="mt-1 block font-mono text-[13px] text-white">
                          QT00241026.01 · 3 Line Items ({formatGhs(grandTotal)})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#33302E] pt-5">
                    <span className="font-mono text-[11px] text-neutral-400">
                      TIN & billing profile automatically inherited by all linked quotations
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveStage(1)}
                      className="inline-flex items-center gap-2 rounded-md bg-[#E5232B] px-4 py-2 font-mono text-[11.5px] font-medium text-white transition-colors hover:bg-[#cf1d25] cursor-pointer"
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
                  transition={{ duration: 0.25, ease: fluidEase }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-[#33302E]">
                          <th className="py-3 pr-4 font-mono text-[11px] font-medium uppercase tracking-widest text-neutral-400 w-14">
                            ITEM
                          </th>
                          <th className="py-3 px-4 font-mono text-[11px] font-medium uppercase tracking-widest text-neutral-400">
                            SCOPE SPECIFICATION
                          </th>
                          <th className="py-3 px-3 text-center font-mono text-[11px] font-medium uppercase tracking-widest text-neutral-400 w-20">
                            QTY
                          </th>
                          <th className="py-3 px-3 text-center font-mono text-[11px] font-medium uppercase tracking-widest text-neutral-400 w-20">
                            DAYS
                          </th>
                          <th className="py-3 px-4 text-right font-mono text-[11px] font-medium uppercase tracking-widest text-neutral-400 w-32">
                            RATE (GHS)
                          </th>
                          <th className="py-3 pl-4 text-right font-mono text-[11px] font-medium uppercase tracking-widest text-neutral-400 w-36">
                            LINE TOTAL (GHS)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {QUOTATION_LINE_ITEMS.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-[#33302E]/70 transition-colors duration-150 hover:bg-white/[0.02]"
                          >
                            <td className="py-4 pr-4 align-top font-mono text-[12px] text-neutral-400 tabular-nums">
                              {item.itemNo}
                            </td>
                            <td className="py-4 px-4 align-top">
                              <div className="text-[14px] font-medium text-white leading-snug">
                                {item.title}
                              </div>
                              <div className="mt-0.5 text-[12px] text-neutral-400 leading-relaxed">
                                {item.detail}
                              </div>
                            </td>
                            <td className="py-4 px-3 align-top text-center font-mono text-xs text-neutral-200 tabular-nums">
                              {item.qty}
                            </td>
                            <td className="py-4 px-3 align-top text-center font-mono text-xs text-neutral-200 tabular-nums">
                              {item.days}
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

                  <div className="mt-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                    <div className="hidden sm:block space-y-1 font-mono text-[11px] text-neutral-400">
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

                      <div className="my-2.5 border-t border-[#33302E]" />

                      <div className="flex items-baseline justify-between pt-1">
                        <span className="font-mono text-[12px] uppercase tracking-wider text-neutral-300">
                          Total Due:
                        </span>
                        <span className="font-mono text-[18px] font-bold tracking-tight text-[#E5232B] tabular-nums">
                          {formatGhs(grandTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[#33302E] pt-5">
                    <span className="font-mono text-[11px] text-neutral-400">
                      Generated under GRA Act 896/936 · Non-negotiable once converted
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveStage(2)}
                      className="inline-flex items-center gap-2 rounded-md bg-[#E5232B] px-4 py-2 font-mono text-[11.5px] font-medium text-white transition-colors hover:bg-[#cf1d25] cursor-pointer"
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
                  transition={{ duration: 0.25, ease: fluidEase }}
                  className="space-y-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-6 border-b border-[#33302E] pb-6">
                    <div>
                      <p className="font-mono text-[11px] tracking-widest text-neutral-400 uppercase">
                        Converted from QT00241026.01
                      </p>
                      <h3 className="mt-1.5 text-2xl sm:text-3xl font-medium tracking-tight text-white">
                        Reconciled Tax Invoice
                      </h3>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-[#33302E] bg-[#100F0E] px-3.5 py-2">
                      <CheckCircle2 size={16} className="text-[#008F68]" />
                      <div>
                        <span className="block font-mono text-[10.5px] font-semibold tracking-widest text-white uppercase">
                          100% Settled
                        </span>
                        <span className="block font-mono text-[10px] text-neutral-400">
                          Balance Due: GHS 0.00
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#33302E] divide-y divide-[#33302E] bg-[#100F0E]">
                    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-[14px] font-medium text-white">
                            Bank Transfer · GCB Corporate Treasury
                          </span>
                          <span className="font-mono text-[11px] text-neutral-400">
                            · 65% Mobilization
                          </span>
                        </div>
                        <span className="mt-0.5 block font-mono text-[11.5px] text-neutral-400">
                          25 Oct 2026 · Ref: TRX-884920-ECO
                        </span>
                      </div>
                      <div className="font-mono text-[13.5px] font-medium tracking-tight text-white tabular-nums">
                        {formatGhs(bankTranche)}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-[14px] font-medium text-white">
                            MTN Mobile Money · Corporate Settlement
                          </span>
                          <span className="font-mono text-[11px] text-[#E5232B]">
                            · 35% Final Tranche
                          </span>
                        </div>
                        <span className="mt-0.5 block font-mono text-[11.5px] text-neutral-400">
                          27 Oct 2026 · Ref: MOMO-29481042
                        </span>
                      </div>
                      <div className="font-mono text-[13.5px] font-medium tracking-tight text-white tabular-nums">
                        {formatGhs(momoTranche)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#33302E] pt-5">
                    <span className="font-mono text-[11px] text-neutral-400">
                      Auditable receipt trail archived under Ecobank Ghana PLC
                    </span>
                    <Link
                      href={workspaceHref}
                      className="inline-flex items-center gap-2 rounded-md bg-[#E5232B] px-4 py-2 font-mono text-[11.5px] font-medium text-white no-underline transition-colors hover:bg-[#cf1d25]"
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
   SECTION 8: "WOULD YOU LIKE TO START A PROJECT WITH US?" CTA BANNER
   Mirrors Seobay's horizontal split CTA card right above the 4-column footer.
   ============================================================================ */

function StartProjectCtaBanner({ workspaceHref }: { workspaceHref: string }) {
  return (
    <section
      id="contact"
      className="relative border-t border-[#33302E] bg-[#161514] py-16 sm:py-20"
      aria-labelledby="start-project-heading"
    >
      <div className="landing-wrap">
        <div className="rounded-2xl border border-[#33302E] bg-[#100F0E] p-8 sm:p-12 lg:p-14">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <h3
                id="start-project-heading"
                className="text-[clamp(26px,3.6vw,40px)] font-semibold tracking-[-0.03em] text-[#E5232B] leading-[1.1]"
                style={{ fontFamily: 'var(--landing-display)' }}
              >
                Would you like to start a project with us?
              </h3>
              <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-[#C9C2B9]">
                Whether you need highway billboard skins, telescopic flagpole rentals, corporate summit staging, or want to log into the Collage operations workspace, our Accra desk is ready to assist.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:col-span-4 lg:justify-end">
              <Link
                href="/portfolio#contact"
                className="landing-cta landing-cta--solid px-7 whitespace-nowrap"
              >
                <span>GET A QUOTE</span>
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link
                href={workspaceHref}
                className="landing-cta landing-cta--ghost px-6 whitespace-nowrap"
              >
                <span>Workspace</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   SECTION 9: 4-COLUMN SITE FOOTER & COPYRIGHT BAR (SEOBAY COLOPHON LAYOUT)
   ============================================================================ */

function SeobayStyleFooter({ workspaceHref }: { workspaceHref: string }) {
  return (
    <footer
      id="colophon"
      className="border-t border-[#33302E] bg-[#0E0D0C] text-[#C9C2B9]"
    >
      {/* Primary 4-Column Footer Grid */}
      <div className="landing-wrap py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand + About + Quick Contact Icons */}
          <div className="space-y-4">
            <Link href="/" aria-label="Collage Home" className="inline-block">
              <Brand dark />
            </Link>
            <p className="text-[14px] leading-relaxed text-[#C9C2B9]/85">
              Advertising, outdoor billboard skins, telescopic flagpole rentals, event staging, and large-format printing (PrintD Pigh) in Accra, Ghana.
            </p>
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="tel:+233247361133"
                aria-label="Call Collage"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#33302E] bg-[#161514] text-[#C9C2B9] transition-colors hover:border-[#E5232B] hover:text-[#F4F0E9]"
              >
                <Phone size={15} />
              </a>
              <a
                href="mailto:marketing@collagenmosaic.com"
                aria-label="Email Collage"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#33302E] bg-[#161514] text-[#C9C2B9] transition-colors hover:border-[#E5232B] hover:text-[#F4F0E9]"
              >
                <Mail size={15} />
              </a>
              <Link
                href="/portfolio"
                aria-label="Collage Portfolio"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#33302E] bg-[#161514] text-[#C9C2B9] transition-colors hover:border-[#E5232B] hover:text-[#F4F0E9]"
              >
                <Globe size={15} />
              </Link>
            </div>
          </div>

          {/* Column 2: Company */}
          <div>
            <h2
              className="text-[17px] font-semibold text-[#F4F0E9]"
              style={{ fontFamily: 'var(--landing-display)' }}
            >
              Company
            </h2>
            <ul className="mt-4 space-y-2.5 text-[14px] list-none p-0 m-0">
              <li>
                <a
                  href="#top"
                  className="text-[#C9C2B9] no-underline transition-colors hover:text-[#E5232B]"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className="text-[#C9C2B9] no-underline transition-colors hover:text-[#E5232B]"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="text-[#C9C2B9] no-underline transition-colors hover:text-[#E5232B]"
                >
                  Services
                </a>
              </li>
              <li>
                <Link
                  href="/portfolio#contact"
                  className="text-[#C9C2B9] no-underline transition-colors hover:text-[#E5232B]"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Business */}
          <div>
            <h2
              className="text-[17px] font-semibold text-[#F4F0E9]"
              style={{ fontFamily: 'var(--landing-display)' }}
            >
              Business
            </h2>
            <ul className="mt-4 space-y-2.5 text-[14px] list-none p-0 m-0">
              <li>
                <a
                  href="#portfolio"
                  className="text-[#C9C2B9] no-underline transition-colors hover:text-[#E5232B]"
                >
                  Project Portfolio
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className="text-[#C9C2B9] no-underline transition-colors hover:text-[#E5232B]"
                >
                  Our Team
                </a>
              </li>
              <li>
                <a
                  href="#workspace"
                  className="text-[#C9C2B9] no-underline transition-colors hover:text-[#E5232B]"
                >
                  Operations Ledger
                </a>
              </li>
              <li>
                <a
                  href="#customers"
                  className="text-[#C9C2B9] no-underline transition-colors hover:text-[#E5232B]"
                >
                  Customers
                </a>
              </li>
              <li>
                <Link
                  href={workspaceHref}
                  className="text-[#C9C2B9] no-underline transition-colors hover:text-[#E5232B]"
                >
                  Operator Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Get In Touch */}
          <div>
            <h2
              className="text-[17px] font-semibold text-[#F4F0E9]"
              style={{ fontFamily: 'var(--landing-display)' }}
            >
              Get In Touch
            </h2>
            <div className="mt-4 space-y-2.5 text-[14px] leading-relaxed text-[#C9C2B9]">
              <p className="flex items-start gap-2">
                <MapPin size={15} className="mt-1 shrink-0 text-[#E5232B]" />
                <span>2 Morocco Lane, Off Independence Ave, Ridge, Accra, Ghana</span>
              </p>
              <p className="font-mono text-[13px]">marketing@collagenmosaic.com</p>
              <p className="font-mono text-[13px]">collagenmosaic@gmail.com</p>
              <p className="font-mono text-[13px] text-[#F4F0E9] font-medium">
                +233 24 736 1133 / +233 24 431 8902
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Below-Footer Copyright Bar */}
      <div className="border-t border-[#33302E] py-6">
        <div className="landing-wrap flex flex-col items-center justify-between gap-3 sm:flex-row text-[12.5px] text-[#C9C2B9]/75">
          <p className="m-0">
            Copyright © 2026 Collage Ghana Limited | Powered by Collage Operations
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-[#C9C2B9]/75 no-underline transition-colors hover:text-[#F4F0E9]"
            >
              Privacy Policy
            </Link>
            <span aria-hidden="true">·</span>
            <span>GRA VAT 15% · GETFund 2.5% · NHIL 2.5%</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================================
   MAIN WELCOME COMPONENT
   ============================================================================ */

export function Welcome({ hasClerk }: { hasClerk: boolean }) {
  const workspaceHref = '/sign-in';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div id="top" className="landing min-h-[100dvh] overflow-x-hidden bg-[#100F0E] text-[#F4F0E9]">
      {/* Sticky Top Header (Mirrors Seobay Header: Logo Left | Home, About, Services, Portfolio, Contact | Request Quote / Workspace CTA) */}
      <header className="sticky top-0 z-40 pt-3 sm:pt-4 px-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-6 rounded-2xl sm:rounded-full border border-[#33302E] bg-[#1B1918]/92 px-3.5 py-2.5 sm:px-6 sm:py-3 text-[#F4F0E9] backdrop-blur-xl">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center shrink-0">
            <Link href="/" aria-label="Collage home" className="shrink-0">
              <Brand dark />
            </Link>
          </div>

          {/* Zone 2: Desktop Navigation Links (Seobay Menu Structure) */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            <a
              href="#top"
              className="text-[13px] font-medium text-[#F4F0E9] no-underline transition-colors hover:text-[#E5232B] whitespace-nowrap shrink-0"
            >
              Home
            </a>
            <a
              href="#about"
              className="text-[13px] font-medium text-[#C9C2B9] no-underline transition-colors hover:text-[#F4F0E9] whitespace-nowrap shrink-0"
            >
              About
            </a>
            <a
              href="#services"
              className="text-[13px] font-medium text-[#C9C2B9] no-underline transition-colors hover:text-[#F4F0E9] whitespace-nowrap shrink-0"
            >
              Services
            </a>
            <a
              href="#portfolio"
              className="text-[13px] font-medium text-[#C9C2B9] no-underline transition-colors hover:text-[#F4F0E9] whitespace-nowrap shrink-0"
            >
              Portfolio
            </a>
            <a
              href="#workspace"
              className="text-[13px] font-medium text-[#C9C2B9] no-underline transition-colors hover:text-[#F4F0E9] whitespace-nowrap shrink-0"
            >
              Workspace
            </a>
            <Link
              href="/portfolio#contact"
              className="text-[13px] font-medium text-[#C9C2B9] no-underline transition-colors hover:text-[#F4F0E9] whitespace-nowrap shrink-0"
            >
              Contact
            </Link>
          </nav>

          {/* Zone 3: Primary Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/sign-in"
              title="Operator Sign In"
              aria-label="Operator Sign In"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#33302E] bg-[#100F0E] text-[#C9C2B9] transition-colors hover:border-[#C9C2B9]/40 hover:text-[#F4F0E9]"
            >
              <User size={14} />
            </Link>

            <Link
              href={hasClerk ? '/sign-up' : workspaceHref}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#E5232B] px-4 sm:px-5 py-2 text-[12px] sm:text-[12.5px] font-semibold text-[#F4F0E9] no-underline transition-colors hover:bg-[#cf1d25] whitespace-nowrap shrink-0"
            >
              <span>{hasClerk ? 'Request Quote' : 'Enter Workspace'}</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle mobile navigation"
              aria-expanded={mobileMenuOpen}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#33302E] bg-[#100F0E] text-[#F4F0E9] cursor-pointer"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mx-auto mt-2 max-w-7xl rounded-2xl border border-[#33302E] bg-[#161514] p-4 shadow-2xl">
            <nav className="flex flex-col space-y-2.5 text-[14px] font-medium">
              <a
                href="#top"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-[#F4F0E9] no-underline hover:bg-[#1B1918]"
              >
                Home
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-[#C9C2B9] no-underline hover:bg-[#1B1918] hover:text-[#F4F0E9]"
              >
                About
              </a>
              <a
                href="#services"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-[#C9C2B9] no-underline hover:bg-[#1B1918] hover:text-[#F4F0E9]"
              >
                Services
              </a>
              <a
                href="#portfolio"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-[#C9C2B9] no-underline hover:bg-[#1B1918] hover:text-[#F4F0E9]"
              >
                Portfolio
              </a>
              <a
                href="#workspace"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-[#C9C2B9] no-underline hover:bg-[#1B1918] hover:text-[#F4F0E9]"
              >
                Operations Ledger
              </a>
              <Link
                href="/portfolio#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-[#E5232B] font-semibold no-underline hover:bg-[#1B1918]"
              >
                Request a Quote →
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* SECTION 1: HERO (Seobay 2-Column Hero Structure + Collage Piece-Arriving Logo Animation) */}
        <section className="landing-hero landing-wrap">
          <div className="landing-hero__copy">
            <FadeIn delay={0.04} y={6}>
              <h4 className="m-0 mb-4 font-mono text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[#E5232B]">
                Advertising, Event Staging & Operations Engine
              </h4>
            </FadeIn>

            <h1 className="landing-headline text-[#F4F0E9]">
              <LineReveal delay={0.1}>
                <span className="text-[#F4F0E9]">From first brief</span>
              </LineReveal>
              <LineReveal delay={0.22}>
                <span className="landing-headline__accent relative inline-block text-[#E5232B]">
                  to paid in full.
                </span>
              </LineReveal>
            </h1>

            <FadeIn delay={0.34} y={8}>
              <p className="landing-lede text-[#C9C2B9]">
                We deliver outdoor billboard skins, telescopic flagpole rentals, corporate event staging, and large-format printing across Ghana—backed by one live operations and GRA tax billing desk.
              </p>
            </FadeIn>

            <FadeIn delay={0.46} className="landing-actions" y={8}>
              <Link
                href={workspaceHref}
                className="landing-cta landing-cta--solid group relative overflow-hidden whitespace-nowrap"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Book A Meeting / Workspace
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </span>
              </Link>
              <Link
                href="/portfolio"
                className="landing-cta landing-cta--ghost group whitespace-nowrap"
              >
                <span className="flex items-center gap-1.5">
                  Explore Portfolio
                  <ArrowUpRight
                    size={14}
                    aria-hidden="true"
                    className="text-[#C9C2B9] transition-colors group-hover:text-[#E5232B]"
                  />
                </span>
              </Link>
            </FadeIn>

            {/* Clean Trust Strip */}
            <FadeIn delay={0.58} y={8}>
              <div className="mt-8 border-t border-[#33302E] pt-5 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-[12.5px] text-[#C9C2B9] font-medium">
                <div className="inline-flex items-center gap-2">
                  <ShieldCheck size={15} className="text-[#E5232B] shrink-0" />
                  <span>100% Ghana Tax (GRA)</span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <Layers size={15} className="text-[#C9C2B9] shrink-0" />
                  <span>Rigging & Rental Days</span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <Printer size={15} className="text-[#E5232B] shrink-0" />
                  <span>Sister Dispatch (PrintD)</span>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Right Column: Preserved Piece-Arriving Collage Logo Animation & Live Status Strip */}
          <HeroInteractiveVisual />
        </section>

        {/* SECTION 2: "HOW CAN WE HELP YOU?" — 6-Card Services Grid */}
        <HowCanWeHelpSection />

        {/* SECTION 3: "PORTFOLIO" — 4-Column Visual Grid + EXPLORE MORE */}
        <PortfolioSection />

        {/* SECTION 4: "OUR CUSTOMERS" — 4-Column Institutional Trust Strip */}
        <OurCustomersSection />

        {/* SECTION 5: CUSTOMER TESTIMONIAL SPOTLIGHT */}
        <TestimonialSpotlightSection />

        {/* SECTION 6: "MEET OUR LEADERSHIP" — 3-Column Executive Team */}
        <MeetOurLeadershipSection />

        {/* SECTION 7: LIVE WORKSPACE LEDGER PREVIEW */}
        <LivingThreadStage workspaceHref={workspaceHref} />

        {/* SECTION 8: "WOULD YOU LIKE TO START A PROJECT WITH US?" CTA BANNER */}
        <StartProjectCtaBanner workspaceHref={workspaceHref} />
      </main>

      {/* SECTION 9: 4-COLUMN SEOBAY-STYLE FOOTER & COPYRIGHT */}
      <SeobayStyleFooter workspaceHref={workspaceHref} />
    </div>
  );
}
