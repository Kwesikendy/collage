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
import { ProjectVisual } from './project-visuals';

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

export function ProjectCard({ project, onSelect }: ProjectCardProps) {
  const Icon = getCategoryIcon(project.category);

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
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/40 p-4 sm:p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-red-500/40 hover:bg-neutral-900/75 hover:shadow-2xl hover:shadow-red-950/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
    >
      {/* Top Architectural Visual Banner */}
      <div className="relative mb-4 overflow-hidden rounded-xl border border-white/5 bg-neutral-950">
        <ProjectVisual projectId={project.id} category={project.category} />

        {/* Ambient Overlay Tag */}
        {project.tag && (
          <div className="absolute top-3 left-3 rounded-full border border-white/20 bg-black/60 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
            {project.tag}
          </div>
        )}
      </div>

      <div className="space-y-3.5">
        {/* Top meta row */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-950/30 px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider text-red-300">
            <Icon size={12} aria-hidden="true" />
            {project.categoryLabel}
          </span>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-400">
            <Calendar size={12} aria-hidden="true" />
            <span>{project.year}</span>
          </div>
        </div>

        {/* Client & Title */}
        <div>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-red-400">
            {project.client}
          </div>
          <h3 className="mt-1 text-base font-bold tracking-tight text-white transition-colors duration-200 group-hover:text-red-200">
            {project.title}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
            <MapPin size={12} className="shrink-0 text-red-400" aria-hidden="true" />
            <span>{project.location}</span>
          </p>
        </div>

        {/* Summary */}
        <p className="line-clamp-2 text-xs leading-relaxed text-neutral-300">
          {project.summary}
        </p>

        {/* Key Scope Preview */}
        <div className="rounded-xl border border-white/5 bg-black/30 p-3">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Scope & Details
          </div>
          <ul className="mt-1.5 space-y-1">
            {project.specs.slice(0, 2).map((spec, idx) => (
              <li
                key={idx}
                className="flex items-start gap-1.5 text-[11px] leading-snug text-neutral-300"
              >
                <CheckCircle2
                  size={12}
                  className="mt-0.5 shrink-0 text-red-400"
                  aria-hidden="true"
                />
                <span className="line-clamp-1">{spec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="mt-4 border-t border-white/10 pt-3.5">
        <div className="flex items-center justify-between font-mono text-xs font-semibold text-red-400 transition-colors duration-200 group-hover:text-red-300">
          <span>View Project</span>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-red-500/40 group-hover:bg-red-500/20">
            <ArrowUpRight size={14} aria-hidden="true" />
          </span>
        </div>
      </div>
    </div>
  );
}
