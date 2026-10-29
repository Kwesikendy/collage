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
  Wrench,
  X,
} from 'lucide-react';
import type { PortfolioProject, ServiceCategory } from '@/data/portfolio-data';
import { ProjectVisual } from './project-visuals';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'results' | 'testimonial'>('overview');

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      setActiveTab('overview');
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
      const shareUrl = `${window.location.origin}/portfolio?project=${project.id.replace(/^prj-/, '')}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
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
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0D0D0C] text-neutral-100 shadow-2xl shadow-black">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-neutral-900/80 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-950/40 px-3 py-1 font-mono text-xs font-medium uppercase tracking-wider text-red-300">
              <Icon size={13} aria-hidden="true" />
              {project.categoryLabel}
            </span>
            <span className="font-mono text-xs text-neutral-400">
              {project.year} · Ref: {project.id}
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
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close project dialog"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-neutral-400 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {/* Visual Simulation Render */}
          <div className="mb-6 overflow-hidden rounded-xl border border-white/10 shadow-lg">
            <ProjectVisual
              projectId={project.id}
              category={project.category}
              className="h-56 sm:h-64 w-full"
            />
          </div>

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

          {/* Interactive Case Study Section Tabs */}
          <div className="mt-8 border-b border-white/10">
            <div className="flex flex-wrap gap-2 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-all ${
                  activeTab === 'overview'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-all ${
                  activeTab === 'specs'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                Specifications ({project.specs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('results')}
                className={`rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-all ${
                  activeTab === 'results'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                Highlights
              </button>
              {project.testimonial && (
                <button
                  type="button"
                  onClick={() => setActiveTab('testimonial')}
                  className={`rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-all ${
                    activeTab === 'testimonial'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Feedback
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-5">
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-300">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    Project Scope
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-neutral-300 sm:text-sm">
                    {project.challenge}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-5">
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Delivered Solution
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-neutral-300 sm:text-sm">
                    {project.solution}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="space-y-4">
                <div className="font-mono text-xs uppercase tracking-wider text-neutral-400">
                  Specifications & Deliverables
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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
            )}

            {activeTab === 'results' && (
              <div className="space-y-4">
                <div className="font-mono text-xs uppercase tracking-wider text-neutral-400">
                  Project Highlights
                </div>
                <div className="space-y-2.5">
                  {project.results.map((result, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 rounded-lg border border-emerald-950/40 bg-emerald-950/15 p-3.5 text-xs text-emerald-200"
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
            )}

            {activeTab === 'testimonial' && project.testimonial && (
              <div className="rounded-xl border border-red-900/30 bg-red-950/20 p-6">
                <Quote size={28} className="text-red-400/60" aria-hidden="true" />
                <blockquote className="mt-3 text-sm italic leading-relaxed text-neutral-200 sm:text-base">
                  "{project.testimonial.quote}"
                </blockquote>
                <div className="mt-5 border-t border-red-900/30 pt-4">
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
              Close
            </button>
            <button
              type="button"
              onClick={handleRequestSimilar}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-mono text-xs font-semibold text-white shadow-lg shadow-red-900/30 transition-all hover:bg-red-500 hover:shadow-red-800/50"
            >
              <span>Request Quote</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}