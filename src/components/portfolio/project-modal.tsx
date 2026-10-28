import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  ExternalLink,
  Flag,
  Layers,
  MapPin,
  Quote,
  Share2,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import type { PortfolioProject, ServiceCategory } from '@/data/portfolio-data';

interface ProjectModalProps {
  project: PortfolioProject | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestQuote?: (category: ServiceCategory) => void;
}

function getCategoryIcon(category: ServiceCategory) {
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

export function ProjectModal({
  project,
  isOpen,
  onClose,
  onRequestQuote,
}: ProjectModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  const Icon = getCategoryIcon(project.category);

  const handleCopyLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/portfolio/${project.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API is restricted
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleRequestSimilar = () => {
    onClose();
    if (onRequestQuote) {
      onRequestQuote(project.category);
    } else {
      const contactEl = document.getElementById('contact');
      if (contactEl) {
        contactEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Body */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-neutral-950 text-neutral-100 shadow-2xl shadow-black">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-neutral-900/80 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-950/40 px-3 py-1 font-mono text-xs font-medium uppercase tracking-wider text-red-300">
              <Icon size={13} aria-hidden="true" />
              {project.categoryLabel}
            </span>
            <span className="font-mono text-xs text-neutral-400">
              {project.year} · Case Study Ref: {project.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-neutral-300 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
              title="Copy shareable link"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400" aria-hidden="true" />
                  <span className="text-emerald-400">Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 size={14} aria-hidden="true" />
                  <span>Copy Shareable Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close case study dialog"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-neutral-400 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-7 sm:px-8">
          {/* Hero Meta */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-red-400">
              <span>{project.client}</span>
              <span>·</span>
              <span className="flex items-center gap-1 text-neutral-400">
                <MapPin size={12} className="text-red-400" aria-hidden="true" />
                {project.location}
              </span>
            </div>
            <h2
              id="modal-project-title"
              className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
            >
              {project.title}
            </h2>
            <p className="text-sm leading-relaxed text-neutral-300 sm:text-base">
              {project.summary}
            </p>
          </div>

          {/* Key Metrics Banner */}
          {project.metrics && project.metrics.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-3">
              {project.metrics.map((metric, idx) => (
                <div key={idx} className="border-l-2 border-red-500 pl-3">
                  <div className="font-mono text-xl font-bold text-white">
                    {metric.value}
                  </div>
                  <div className="font-mono text-xs uppercase tracking-wider text-neutral-400">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Challenge & Solution Grid */}
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-5">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                The Client Brief & Challenge
              </div>
              <p className="mt-3 text-xs leading-relaxed text-neutral-300 sm:text-sm">
                {project.challenge}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-5">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Engineering Solution Delivered
              </div>
              <p className="mt-3 text-xs leading-relaxed text-neutral-300 sm:text-sm">
                {project.solution}
              </p>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="mt-8">
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Technical Engineering & Material Specifications
            </h4>
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {project.specs.map((spec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs text-neutral-200"
                >
                  <CheckCircle2
                    size={14}
                    className="mt-0.5 shrink-0 text-red-400"
                    aria-hidden="true"
                  />
                  <span>{spec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verified Results */}
          <div className="mt-8">
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Verified Operational Results & Impact
            </h4>
            <div className="mt-3 space-y-2">
              {project.results.map((result, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 rounded-lg border border-emerald-950/40 bg-emerald-950/15 p-3 text-xs text-emerald-200"
                >
                  <Check
                    size={14}
                    className="mt-0.5 shrink-0 text-emerald-400"
                    aria-hidden="true"
                  />
                  <span>{result}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial Quote */}
          {project.testimonial && (
            <div className="mt-8 rounded-xl border border-red-900/30 bg-red-950/20 p-5 sm:p-6">
              <Quote size={24} className="text-red-400/60" aria-hidden="true" />
              <blockquote className="mt-2 text-sm italic leading-relaxed text-neutral-200 sm:text-base">
                "{project.testimonial.quote}"
              </blockquote>
              <div className="mt-4 border-t border-red-900/30 pt-3">
                <p className="font-semibold text-white">
                  {project.testimonial.author}
                </p>
                <p className="font-mono text-xs text-neutral-400">
                  {project.testimonial.position}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-neutral-900/80 px-6 py-4 backdrop-blur-md">
          <div className="font-mono text-xs text-neutral-400">
            Collage Ghana · Sister facility PrintD Pigh · 2 Morocco Lane, Ridge, Accra
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-2 font-mono text-xs text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              Close Preview
            </button>
            <button
              type="button"
              onClick={handleRequestSimilar}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-mono text-xs font-semibold text-white shadow-lg shadow-red-900/30 transition-all hover:bg-red-500 hover:shadow-red-800/50"
            >
              <span>Request Similar Scope</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
