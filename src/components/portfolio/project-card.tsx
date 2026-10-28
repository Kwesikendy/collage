import type { KeyboardEvent } from 'react';
import {
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Compass,
  Flag,
  Layers,
  MapPin,
  Sparkles,
  Truck,
} from 'lucide-react';
import type { PortfolioProject, ServiceCategory } from '@/data/portfolio-data';

interface ProjectCardProps {
  project: PortfolioProject;
  onSelect: (project: PortfolioProject) => void;
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

function getCategoryGradient(category: ServiceCategory) {
  switch (category) {
    case 'billboards':
      return 'from-amber-500/20 via-orange-500/10 to-transparent';
    case 'field_production':
      return 'from-blue-500/20 via-indigo-500/10 to-transparent';
    case 'telescopic_flags':
      return 'from-emerald-500/20 via-teal-500/10 to-transparent';
    case 'event_branding':
      return 'from-purple-500/20 via-pink-500/10 to-transparent';
    case 'wayfinding':
      return 'from-sky-500/20 via-cyan-500/10 to-transparent';
    case 'large_format_print':
      return 'from-rose-500/20 via-red-500/10 to-transparent';
    default:
      return 'from-neutral-500/20 via-neutral-600/10 to-transparent';
  }
}

export function ProjectCard({ project, onSelect }: ProjectCardProps) {
  const Icon = getCategoryIcon(project.category);
  const gradientClass = getCategoryGradient(project.category);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(project);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(project)}
      onKeyDown={handleKeyDown}
      aria-label={`View case study: ${project.title} for ${project.client}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-neutral-700/80 hover:bg-neutral-900/80 hover:shadow-2xl hover:shadow-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
    >
      {/* Dynamic ambient header gradient */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${gradientClass} opacity-70 transition-opacity duration-300 group-hover:opacity-100`}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Top meta bar */}
        <div className="flex items-center justify-between gap-2 pb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-950/40 px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-red-300">
            <Icon size={12} aria-hidden="true" />
            {project.categoryLabel}
          </span>
          <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-400">
            <span className="inline-flex items-center gap-1">
              <Calendar size={11} aria-hidden="true" />
              {project.year}
            </span>
          </div>
        </div>

        {/* Client & Title */}
        <div className="space-y-1.5">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            {project.client}
          </p>
          <h3 className="text-lg font-bold tracking-tight text-neutral-100 transition-colors duration-200 group-hover:text-white">
            {project.title}
          </h3>
          <p className="flex items-center gap-1 text-xs text-neutral-400">
            <MapPin size={12} className="shrink-0 text-red-400" aria-hidden="true" />
            <span>{project.location}</span>
          </p>
        </div>

        {/* Summary */}
        <p className="mt-3.5 line-clamp-3 text-xs leading-relaxed text-neutral-300">
          {project.summary}
        </p>

        {/* Technical specs preview */}
        <div className="mt-4 border-t border-white/5 pt-3.5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Technical Engineering Specs
          </p>
          <ul className="mt-2 space-y-1.5">
            {project.specs.slice(0, 2).map((spec, idx) => (
              <li
                key={idx}
                className="flex items-start gap-1.5 text-[11px] leading-snug text-neutral-300"
              >
                <CheckCircle2
                  size={12}
                  className="mt-0.5 shrink-0 text-emerald-400"
                  aria-hidden="true"
                />
                <span className="line-clamp-1">{spec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom metrics and action */}
      <div className="relative z-10 mt-5 border-t border-white/10 pt-4">
        {project.metrics && project.metrics.length > 0 && (
          <div className="mb-3.5 grid grid-cols-3 gap-2">
            {project.metrics.slice(0, 3).map((metric, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center"
              >
                <div className="font-mono text-[12px] font-bold text-white">
                  {metric.value}
                </div>
                <div className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-wider text-neutral-400">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between font-mono text-xs font-medium text-red-400 transition-colors duration-200 group-hover:text-red-300">
          <span>Explore Case Study</span>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-red-500/20">
            <ArrowUpRight size={14} aria-hidden="true" />
          </span>
        </div>
      </div>
    </div>
  );
}
