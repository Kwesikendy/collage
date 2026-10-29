import type { ServiceCategory } from '@/data/portfolio-data';

interface ProjectVisualProps {
  projectId: string;
  category: ServiceCategory;
  className?: string;
  interactive?: boolean;
}

export function ProjectVisual({
  projectId,
  category,
  className = '',
  interactive = true,
}: ProjectVisualProps) {
  // Select matching custom architectural visual based on project ID or category
  switch (projectId) {
    case 'mtn-billboard-skins':
      return <BillboardVisual className={className} interactive={interactive} />;
    case 'ecobank-wayfinding':
      return <WayfindingVisual className={className} interactive={interactive} />;
    case 'ghana-energy-summit':
      return <EventStageVisual className={className} interactive={interactive} />;
    case 'african-protocol-flags':
      return <FlagpoleVisual className={className} interactive={interactive} />;
    case 'stanchart-pavilion':
      return <PavilionVisual className={className} interactive={interactive} />;
    case 'enterprise-fleet-branding':
      return <FleetWrapVisual className={className} interactive={interactive} />;
    default:
      // Category fallbacks
      switch (category) {
        case 'billboards':
          return <BillboardVisual className={className} interactive={interactive} />;
        case 'wayfinding':
          return <WayfindingVisual className={className} interactive={interactive} />;
        case 'event_branding':
          return <EventStageVisual className={className} interactive={interactive} />;
        case 'telescopic_flags':
          return <FlagpoleVisual className={className} interactive={interactive} />;
        case 'field_production':
          return <PavilionVisual className={className} interactive={interactive} />;
        case 'large_format_print':
          return <FleetWrapVisual className={className} interactive={interactive} />;
        default:
          return <BillboardVisual className={className} interactive={interactive} />;
      }
  }
}

// 1. BILLBOARD VISUAL: 550gsm UV Blackout Highway Unipole on Accra-Tema Motorway
function BillboardVisual({ className = '', interactive = true }: { className?: string; interactive?: boolean }) {
  return (
    <div
      className={`relative h-48 w-full overflow-hidden rounded-xl bg-[#0C0B0A] select-none ${className}`}
      aria-label="Billboard Visual Simulation"
    >
      <svg
        className={`h-full w-full object-cover transition-transform duration-700 ease-out ${
          interactive ? 'group-hover:scale-105' : ''
        }`}
        viewBox="0 0 600 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="320" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0B0E14" />
            <stop offset="60%" stopColor="#151A24" />
            <stop offset="100%" stopColor="#251F1C" />
          </linearGradient>
          <linearGradient id="skinGrad" x1="50" y1="40" x2="550" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFCC00" />
            <stop offset="100%" stopColor="#E59900" />
          </linearGradient>
          <linearGradient id="steelGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#30353E" />
            <stop offset="50%" stopColor="#586170" />
            <stop offset="100%" stopColor="#22272E" />
          </linearGradient>
          <radialGradient id="floodlightL" cx="130" cy="30" r="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF2B2" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFCC00" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="floodlightR" cx="470" cy="30" r="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF2B2" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFCC00" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Night sky background with subtle stars / atmosphere */}
        <rect width="600" height="320" fill="url(#skyGrad)" />
        <circle cx="90" cy="50" r="1" fill="#FFFFFF" opacity="0.6" />
        <circle cx="210" cy="25" r="1" fill="#FFFFFF" opacity="0.4" />
        <circle cx="520" cy="65" r="1" fill="#FFFFFF" opacity="0.5" />
        <circle cx="410" cy="35" r="1" fill="#FFFFFF" opacity="0.3" />

        {/* Structural Unipole central column */}
        <rect x="282" y="190" width="36" height="130" fill="url(#steelGrad)" rx="2" />
        <line x1="282" y1="230" x2="318" y2="230" stroke="#181B20" strokeWidth="2" />
        <line x1="282" y1="270" x2="318" y2="270" stroke="#181B20" strokeWidth="2" />

        {/* Subframe diagonal steel bracing */}
        <line x1="160" y1="190" x2="282" y2="250" stroke="#3D4450" strokeWidth="3" />
        <line x1="440" y1="190" x2="318" y2="250" stroke="#3D4450" strokeWidth="3" />
        <line x1="200" y1="190" x2="300" y2="220" stroke="#3D4450" strokeWidth="2" strokeDasharray="4 2" />
        <line x1="400" y1="190" x2="300" y2="220" stroke="#3D4450" strokeWidth="2" strokeDasharray="4 2" />

        {/* Main Billboard Frame Shadow & Bezel */}
        <rect x="56" y="36" width="488" height="168" rx="8" fill="#0E1014" stroke="#4B5362" strokeWidth="2" />

        {/* 550gsm UV Printed Billboard Skin */}
        <rect x="66" y="46" width="468" height="148" rx="4" fill="url(#skinGrad)" />

        {/* Skin Graphic Details (MTN Brand Theme) */}
        <rect x="76" y="56" width="448" height="128" fill="#FFC800" rx="3" />
        <circle cx="460" cy="120" r="48" fill="#FFA500" opacity="0.3" />
        <circle cx="120" cy="120" r="32" fill="#FFE066" opacity="0.4" />

        <text x="96" y="98" fill="#111110" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="22" letterSpacing="0.05em">
          YELLOW SUMMER
        </text>
        <text x="96" y="122" fill="#2E2800" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="12" letterSpacing="0.02em">
          ACCRA-TEMA MOTORWAY GANTRIES · 550GSM UV
        </text>

        {/* Verification Tag & Spec Stamp */}
        <rect x="96" y="136" width="138" height="24" rx="4" fill="#111110" />
        <text x="106" y="152" fill="#FFC800" fontFamily="monospace" fontSize="10" fontWeight="700">
          VERIFIED GSA RIG
        </text>

        <rect x="242" y="136" width="110" height="24" rx="4" fill="#FFFFFF" fillOpacity="0.2" />
        <text x="252" y="152" fill="#111110" fontFamily="monospace" fontSize="10" fontWeight="700">
          WIND-LOAD OK
        </text>

        {/* Perimeter eyelets with tension cords */}
        <circle cx="70" cy="50" r="3" fill="#D4AF37" stroke="#111" strokeWidth="1" />
        <circle cx="530" cy="50" r="3" fill="#D4AF37" stroke="#111" strokeWidth="1" />
        <circle cx="70" cy="190" r="3" fill="#D4AF37" stroke="#111" strokeWidth="1" />
        <circle cx="530" cy="190" r="3" fill="#D4AF37" stroke="#111" strokeWidth="1" />

        {/* Top Catwalk & Floodlight Gantries */}
        <rect x="52" y="24" width="496" height="8" rx="2" fill="#2A303A" />
        <circle cx="140" cy="20" r="6" fill="#F0F3F8" stroke="#1F232B" strokeWidth="2" />
        <circle cx="300" cy="20" r="6" fill="#F0F3F8" stroke="#1F232B" strokeWidth="2" />
        <circle cx="460" cy="20" r="6" fill="#F0F3F8" stroke="#1F232B" strokeWidth="2" />

        {/* Floodlight beams */}
        <polygon points="140,24 60,194 220,194" fill="url(#floodlightL)" />
        <polygon points="460,24 380,194 540,194" fill="url(#floodlightR)" />

        {/* Highway road & traffic light streaks below */}
        <rect x="0" y="280" width="600" height="40" fill="#0A0B0E" />
        <line x1="0" y1="300" x2="600" y2="300" stroke="#FFCC00" strokeWidth="2" strokeDasharray="16 12" />
        <line x1="80" y1="290" x2="260" y2="290" stroke="#FF3333" strokeWidth="2" strokeOpacity="0.6" />
        <line x1="340" y1="310" x2="520" y2="310" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.7" />
      </svg>

      {/* Floating Pill Badge */}
      <div className="absolute bottom-3 right-3 rounded-md border border-white/20 bg-neutral-950/80 px-2.5 py-1 font-mono text-[10px] font-semibold text-neutral-300 backdrop-blur-md">
        HIGHWAY UNIPOLE · 12m x 4m
      </div>
    </div>
  );
}

// 2. WAYFINDING VISUAL: Monolithic Brushed Aluminium Directional Pylon for Ecobank Ghana
function WayfindingVisual({ className = '', interactive = true }: { className?: string; interactive?: boolean }) {
  return (
    <div
      className={`relative h-48 w-full overflow-hidden rounded-xl bg-[#0B0D11] select-none ${className}`}
      aria-label="Wayfinding Totem Simulation"
    >
      <svg
        className={`h-full w-full object-cover transition-transform duration-700 ease-out ${
          interactive ? 'group-hover:scale-105' : ''
        }`}
        viewBox="0 0 600 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pylonBody" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1E2229" />
            <stop offset="25%" stopColor="#3B4250" />
            <stop offset="50%" stopColor="#2A303A" />
            <stop offset="85%" stopColor="#4A5364" />
            <stop offset="100%" stopColor="#1B1E24" />
          </linearGradient>
          <linearGradient id="ambientCyan" x1="0" y1="0" x2="0" y2="320">
            <stop offset="0%" stopColor="#082A3A" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0B0D11" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        <rect width="600" height="320" fill="url(#ambientCyan)" />

        {/* Architectural grid background */}
        <line x1="40" y1="0" x2="40" y2="320" stroke="#162332" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="160" y1="0" x2="160" y2="320" stroke="#162332" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="440" y1="0" x2="440" y2="320" stroke="#162332" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="560" y1="0" x2="560" y2="320" stroke="#162332" strokeWidth="1" strokeDasharray="3 3" />

        {/* Ground plaza paving */}
        <polygon points="60,280 540,280 580,320 20,320" fill="#141820" />
        <line x1="180" y1="280" x2="150" y2="320" stroke="#252C3A" strokeWidth="1" />
        <line x1="300" y1="280" x2="300" y2="320" stroke="#252C3A" strokeWidth="1" />
        <line x1="420" y1="280" x2="450" y2="320" stroke="#252C3A" strokeWidth="1" />

        {/* Concrete Foundation Plinth */}
        <rect x="210" y="270" width="180" height="18" rx="2" fill="#4B5362" stroke="#2E333C" strokeWidth="1" />

        {/* Pylon Shadow */}
        <ellipse cx="300" cy="285" rx="100" ry="8" fill="#05070A" fillOpacity="0.8" />

        {/* Main Monolith Totem (Brushed Aluminium 6063-T6) */}
        <rect x="230" y="30" width="140" height="242" rx="6" fill="url(#pylonBody)" stroke="#68758C" strokeWidth="1.5" />

        {/* Top Header Badge / Ecobank Brand Panel */}
        <rect x="238" y="38" width="124" height="48" rx="4" fill="#005B82" />
        <circle cx="260" cy="62" r="12" fill="#00A3E0" />
        <rect x="280" y="52" width="66" height="8" rx="2" fill="#FFFFFF" />
        <rect x="280" y="64" width="46" height="5" rx="1" fill="#7FD1F2" />

        {/* Directional Directory Slats (Satin White Laser-Cut Acrylic) */}
        <g transform="translate(238, 98)">
          {/* Item 1 */}
          <rect x="0" y="0" width="124" height="28" rx="3" fill="#181B22" stroke="#313744" strokeWidth="1" />
          <path d="M 12 14 L 20 14 M 16 10 L 20 14 L 16 18" stroke="#00C0F3" strokeWidth="1.5" strokeLinecap="round" />
          <text x="28" y="18" fill="#FFFFFF" fontFamily="Inter, sans-serif" fontSize="8.5" fontWeight="700">
            EXECUTIVE SUITES
          </text>

          {/* Item 2 */}
          <rect x="0" y="33" width="124" height="28" rx="3" fill="#181B22" stroke="#313744" strokeWidth="1" />
          <path d="M 12 47 L 20 47 M 16 43 L 20 47 L 16 51" stroke="#00C0F3" strokeWidth="1.5" strokeLinecap="round" />
          <text x="28" y="51" fill="#FFFFFF" fontFamily="Inter, sans-serif" fontSize="8.5" fontWeight="700">
            RETAIL BANKING
          </text>

          {/* Item 3 */}
          <rect x="0" y="66" width="124" height="28" rx="3" fill="#181B22" stroke="#313744" strokeWidth="1" />
          <path d="M 20 80 L 12 80 M 16 76 L 12 80 L 16 84" stroke="#00C0F3" strokeWidth="1.5" strokeLinecap="round" />
          <text x="28" y="84" fill="#FFFFFF" fontFamily="Inter, sans-serif" fontSize="8.5" fontWeight="700">
            WEALTH & TREASURY
          </text>

          {/* Item 4 */}
          <rect x="0" y="99" width="124" height="28" rx="3" fill="#181B22" stroke="#313744" strokeWidth="1" />
          <circle cx="16" cy="113" r="3.5" fill="#00C0F3" />
          <text x="28" y="117" fill="#CBD5E1" fontFamily="Inter, sans-serif" fontSize="8.5" fontWeight="700">
            VISITOR PARKING
          </text>
        </g>

        {/* Ambient solar-LED ground up-lighting */}
        <polygon points="216,270 240,180 270,270" fill="#00A3E0" fillOpacity="0.25" />
        <polygon points="384,270 360,180 330,270" fill="#00A3E0" fillOpacity="0.25" />

        {/* Spec Callout Box */}
        <rect x="420" y="90" width="150" height="70" rx="6" fill="#10151E" stroke="#253042" strokeWidth="1" />
        <text x="432" y="110" fill="#00A3E0" fontFamily="monospace" fontSize="9" fontWeight="700">
          ARCHITECTURAL TOTEM
        </text>
        <text x="432" y="126" fill="#E2E8F0" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="600">
          Marine-Grade 6063
        </text>
        <text x="432" y="142" fill="#94A3B8" fontFamily="Inter, sans-serif" fontSize="9">
          Salt-resistant acrylic & steel
        </text>
        <line x1="370" y1="120" x2="420" y2="120" stroke="#00A3E0" strokeWidth="1" strokeDasharray="2 2" />
      </svg>

      <div className="absolute bottom-3 right-3 rounded-md border border-white/20 bg-neutral-950/80 px-2.5 py-1 font-mono text-[10px] font-semibold text-neutral-300 backdrop-blur-md">
        BRUSHED MONOLITH · 2.4m x 0.9m
      </div>
    </div>
  );
}

// 3. EVENT STAGE VISUAL: Grand Arena Stage Rigging & 18m Matte Fabric Media Wall at AICC
function EventStageVisual({ className = '', interactive = true }: { className?: string; interactive?: boolean }) {
  return (
    <div
      className={`relative h-48 w-full overflow-hidden rounded-xl bg-[#0A090D] select-none ${className}`}
      aria-label="Event Staging Simulation"
    >
      <svg
        className={`h-full w-full object-cover transition-transform duration-700 ease-out ${
          interactive ? 'group-hover:scale-105' : ''
        }`}
        viewBox="0 0 600 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="stageLighting" x1="0" y1="0" x2="0" y2="320">
            <stop offset="0%" stopColor="#1C0E28" />
            <stop offset="60%" stopColor="#100818" />
            <stop offset="100%" stopColor="#050308" />
          </linearGradient>
          <linearGradient id="spotCyan" x1="120" y1="20" x2="260" y2="250" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="spotWarm" x1="480" y1="20" x2="340" y2="250" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FF7A00" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="600" height="320" fill="url(#stageLighting)" />

        {/* Overhead 290mm Box Truss Structure */}
        <g stroke="#64748B" strokeWidth="2">
          {/* Top and bottom horizontal truss chords */}
          <line x1="40" y1="24" x2="560" y2="24" />
          <line x1="40" y1="44" x2="560" y2="44" />
          {/* Truss webbing diagonals */}
          <path
            d="M 40 24 L 60 44 L 80 24 L 100 44 L 120 24 L 140 44 L 160 24 L 180 44 L 200 24 L 220 44 L 240 24 L 260 44 L 280 24 L 300 44 L 320 24 L 340 44 L 360 24 L 380 44 L 400 24 L 420 44 L 440 24 L 460 44 L 480 24 L 500 44 L 520 24 L 540 44 L 560 24"
            strokeWidth="1.5"
            fill="none"
          />
        </g>

        {/* Stage Lights mounted on truss */}
        <rect x="110" y="44" width="20" height="12" rx="2" fill="#334155" />
        <rect x="290" y="44" width="20" height="12" rx="2" fill="#334155" />
        <rect x="470" y="44" width="20" height="12" rx="2" fill="#334155" />

        {/* Light Beams */}
        <polygon points="120,56 160,250 290,250" fill="url(#spotCyan)" />
        <polygon points="480,56 310,250 440,250" fill="url(#spotWarm)" />

        {/* 18m Seamless Matte Blackout Fabric Backdrop Screen */}
        <rect x="60" y="60" width="480" height="170" rx="4" fill="#14111D" stroke="#3B2E4C" strokeWidth="2" />
        <rect x="70" y="70" width="460" height="150" rx="2" fill="#0D0A14" />

        {/* Backdrop Graphic Design (Ghana Energy Summit Theme) */}
        <circle cx="300" cy="140" r="42" fill="#8B5CF6" fillOpacity="0.12" />
        <circle cx="300" cy="140" r="28" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="4 2" />

        <text x="300" y="125" textAnchor="middle" fill="#FFFFFF" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="17" letterSpacing="0.08em">
          GHANA ENERGY SUMMIT 2026
        </text>
        <text x="300" y="148" textAnchor="middle" fill="#A78BFA" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="10" letterSpacing="0.15em">
          ACCRA INTERNATIONAL CONFERENCE CENTRE (AICC)
        </text>
        <text x="300" y="172" textAnchor="middle" fill="#94A3B8" fontFamily="monospace" fontSize="8.5">
          18m x 4.5m SEAMLESS MATTE TEXTILE · ZERO BROADCAST GLARE
        </text>

        {/* Left & Right Sponsor Media Walls */}
        <rect x="80" y="80" width="48" height="130" fill="#181424" stroke="#2B233C" strokeWidth="1" rx="2" />
        <text x="104" y="145" textAnchor="middle" fill="#64748B" fontFamily="monospace" fontSize="7" transform="rotate(-90 104 145)">
          SPONSOR MEDIA WALL
        </text>

        <rect x="472" y="80" width="48" height="130" fill="#181424" stroke="#2B233C" strokeWidth="1" rx="2" />
        <text x="496" y="145" textAnchor="middle" fill="#64748B" fontFamily="monospace" fontSize="7" transform="rotate(90 496 145)">
          SPONSOR MEDIA WALL
        </text>

        {/* Elevated Executive Stage Decking */}
        <polygon points="40,240 560,240 580,285 20,285" fill="#1C1828" stroke="#332B45" strokeWidth="1" />
        <rect x="20" y="285" width="560" height="35" fill="#0C0A12" />

        {/* Center Illuminated Acrylic VIP Speaker Podium */}
        <rect x="282" y="215" width="36" height="40" rx="3" fill="#2E2440" stroke="#A78BFA" strokeWidth="1.5" />
        <line x1="282" y1="230" x2="318" y2="230" stroke="#8B5CF6" strokeWidth="1" />
      </svg>

      <div className="absolute bottom-3 right-3 rounded-md border border-white/20 bg-neutral-950/80 px-2.5 py-1 font-mono text-[10px] font-semibold text-neutral-300 backdrop-blur-md">
        TRUSS GRID · 18m MEDIA WALL
      </div>
    </div>
  );
}

// 4. FLAGPOLE VISUAL: High-Wind Telescopic Flags & Water Bases for African Protocol Summit
function FlagpoleVisual({ className = '', interactive = true }: { className?: string; interactive?: boolean }) {
  return (
    <div
      className={`relative h-48 w-full overflow-hidden rounded-xl bg-[#090E0D] select-none ${className}`}
      aria-label="Telescopic Flagpole Fleet Simulation"
    >
      <svg
        className={`h-full w-full object-cover transition-transform duration-700 ease-out ${
          interactive ? 'group-hover:scale-105' : ''
        }`}
        viewBox="0 0 600 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="flagSky" x1="0" y1="0" x2="0" y2="320">
            <stop offset="0%" stopColor="#0B1614" />
            <stop offset="60%" stopColor="#112924" />
            <stop offset="100%" stopColor="#1A3B34" />
          </linearGradient>
          <linearGradient id="flagGhana" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E52B20" />
            <stop offset="33%" stopColor="#E52B20" />
            <stop offset="34%" stopColor="#FFCD00" />
            <stop offset="66%" stopColor="#FFCD00" />
            <stop offset="67%" stopColor="#008751" />
            <stop offset="100%" stopColor="#008751" />
          </linearGradient>
        </defs>

        <rect width="600" height="320" fill="url(#flagSky)" />

        {/* Coastal Promenade horizon */}
        <polygon points="0,270 600,270 600,320 0,320" fill="#0C1412" />
        <line x1="0" y1="270" x2="600" y2="270" stroke="#1F3630" strokeWidth="2" />

        {/* Fleet of 3 Anodized Aluminium Telescopic Flagpoles */}

        {/* Pole 1 (Left - Background perspective) */}
        <g opacity="0.75" transform="scale(0.85) translate(40, 50)">
          <ellipse cx="140" cy="270" rx="30" ry="8" fill="#030806" />
          {/* Heavy 35L Water Ballast Base */}
          <rect x="122" y="258" width="36" height="16" rx="4" fill="#202A27" stroke="#3D4F4A" strokeWidth="1" />
          {/* Telescopic mast */}
          <rect x="138" y="30" width="4" height="230" fill="#D1D5DB" />
          {/* 360 rotating horizontal arm */}
          <line x1="140" y1="30" x2="190" y2="30" stroke="#9CA3AF" strokeWidth="2" />
          {/* Flag textile waving */}
          <path d="M 140 30 Q 165 40 190 30 L 190 140 Q 165 150 140 140 Z" fill="#0284C7" />
        </g>

        {/* Pole 2 (Center - Hero Flagpole with Ghana Sovereign Flag) */}
        <g>
          <ellipse cx="280" cy="272" rx="42" ry="10" fill="#030806" />
          {/* Heavy 35L Polyethylene Water Ballast Base */}
          <rect x="256" y="256" width="48" height="20" rx="5" fill="#1C2422" stroke="#344641" strokeWidth="1.5" />
          <circle cx="280" cy="266" r="3" fill="#00D287" />

          {/* Anodized 6063 Aluminium Telescopic Pole */}
          <rect x="278" y="20" width="5" height="240" fill="#E5E7EB" />
          <line x1="278" y1="80" x2="283" y2="80" stroke="#6B7280" strokeWidth="2" />
          <line x1="278" y1="140" x2="283" y2="140" stroke="#6B7280" strokeWidth="2" />
          <line x1="278" y1="200" x2="283" y2="200" stroke="#6B7280" strokeWidth="2" />

          {/* 360 Rotating Top Arm */}
          <line x1="280" y1="20" x2="365" y2="20" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
          <circle cx="280" cy="20" r="4" fill="#111827" stroke="#E5E7EB" strokeWidth="1" />

          {/* Double-Sided Sublimated Satin Flag Billowing in Wind */}
          <path
            d="M 280 20 C 310 32 335 10 365 20 L 365 160 C 335 150 310 172 280 160 Z"
            fill="url(#flagGhana)"
            stroke="#1F2937"
            strokeWidth="0.5"
          />
          {/* Center Black Star of Ghana */}
          <polygon points="322,86 325,93 333,93 327,98 329,105 322,100 316,105 318,98 312,93 320,93" fill="#111110" />
        </g>

        {/* Pole 3 (Right - Foreground perspective) */}
        <g opacity="0.85" transform="scale(0.9) translate(120, 30)">
          <ellipse cx="400" cy="270" rx="34" ry="9" fill="#030806" />
          <rect x="380" y="258" width="40" height="18" rx="4" fill="#202A27" stroke="#3D4F4A" strokeWidth="1" />
          <rect x="398" y="25" width="4.5" height="235" fill="#D1D5DB" />
          <line x1="400" y1="25" x2="465" y2="25" stroke="#9CA3AF" strokeWidth="2.5" />
          <path d="M 400 25 C 425 35 445 15 465 25 L 465 155 C 445 145 425 165 400 155 Z" fill="#F59E0B" />
        </g>

        {/* Ambient wind gust particles */}
        <path d="M 100 100 Q 180 80 260 95" stroke="#34D399" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="6 8" />
        <path d="M 380 70 Q 460 55 540 70" stroke="#34D399" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="6 8" />
      </svg>

      <div className="absolute bottom-3 right-3 rounded-md border border-white/20 bg-neutral-950/80 px-2.5 py-1 font-mono text-[10px] font-semibold text-neutral-300 backdrop-blur-md">
        TELESCOPIC 5m · 35L BASE
      </div>
    </div>
  );
}

// 5. PAVILION VISUAL: 300sqm Modular Cassette Flooring & Clear-Span Canopy at Independence Square
function PavilionVisual({ className = '', interactive = true }: { className?: string; interactive?: boolean }) {
  return (
    <div
      className={`relative h-48 w-full overflow-hidden rounded-xl bg-[#0A0D14] select-none ${className}`}
      aria-label="Modular Pavilion Simulation"
    >
      <svg
        className={`h-full w-full object-cover transition-transform duration-700 ease-out ${
          interactive ? 'group-hover:scale-105' : ''
        }`}
        viewBox="0 0 600 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pavilionSky" x1="0" y1="0" x2="0" y2="320">
            <stop offset="0%" stopColor="#0E1726" />
            <stop offset="60%" stopColor="#1B2B44" />
            <stop offset="100%" stopColor="#0B1320" />
          </linearGradient>
        </defs>

        <rect width="600" height="320" fill="url(#pavilionSky)" />

        {/* Independence Square tarmac */}
        <polygon points="20,260 580,260 600,320 0,320" fill="#141923" />

        {/* 300sqm Raised Leveling Cassette Flooring Deck (500kg/sqm) */}
        <polygon points="60,240 540,240 560,265 40,265" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1" />
        <rect x="40" y="265" width="520" height="12" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />

        {/* Front Accessibility Ramp */}
        <polygon points="240,265 360,265 380,285 220,285" fill="#3B82F6" opacity="0.8" />

        {/* Clear-Span Aluminium Portal Arch Frame */}
        <path d="M 80 240 L 80 110 L 300 50 L 520 110 L 520 240" stroke="#94A3B8" strokeWidth="4" fill="none" />
        <path d="M 120 240 L 120 120 L 300 65 L 480 120 L 480 240" stroke="#64748B" strokeWidth="2" fill="none" />

        {/* Architectural Membrane Canopy Roof (650gsm fire-retardant) */}
        <polygon points="70,110 300,45 530,110 520,130 300,65 80,130" fill="#F8FAFC" fillOpacity="0.85" />

        {/* Inside Interior Wall Branding / Glass Manifestations */}
        <rect x="140" y="130" width="320" height="110" rx="2" fill="#1E3A8A" fillOpacity="0.5" stroke="#3B82F6" strokeWidth="1" />

        <text x="300" y="175" textAnchor="middle" fill="#FFFFFF" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="16" letterSpacing="0.05em">
          STANDARD CHARTERED
        </text>
        <text x="300" y="196" textAnchor="middle" fill="#93C5FD" fontFamily="Inter, sans-serif" fontWeight="600" fontSize="10">
          SUSTAINABLE BANKING PAVILION · 300 SQM
        </text>

        {/* Safety Railing along platform */}
        <line x1="60" y1="215" x2="230" y2="215" stroke="#CBD5E1" strokeWidth="2" />
        <line x1="370" y1="215" x2="540" y2="215" stroke="#CBD5E1" strokeWidth="2" />
        <line x1="100" y1="215" x2="100" y2="240" stroke="#CBD5E1" strokeWidth="1.5" />
        <line x1="160" y1="215" x2="160" y2="240" stroke="#CBD5E1" strokeWidth="1.5" />
        <line x1="440" y1="215" x2="440" y2="240" stroke="#CBD5E1" strokeWidth="1.5" />
        <line x1="500" y1="215" x2="500" y2="240" stroke="#CBD5E1" strokeWidth="1.5" />
      </svg>

      <div className="absolute bottom-3 right-3 rounded-md border border-white/20 bg-neutral-950/80 px-2.5 py-1 font-mono text-[10px] font-semibold text-neutral-300 backdrop-blur-md">
        CASSETTE DECK · 300 SQM
      </div>
    </div>
  );
}

// 6. FLEET WRAP VISUAL: UV Precision Fleet Vehicle Wrap via PrintD Pigh Facility
function FleetWrapVisual({ className = '', interactive = true }: { className?: string; interactive?: boolean }) {
  return (
    <div
      className={`relative h-48 w-full overflow-hidden rounded-xl bg-[#0E0C0B] select-none ${className}`}
      aria-label="Vehicle Wrap Simulation"
    >
      <svg
        className={`h-full w-full object-cover transition-transform duration-700 ease-out ${
          interactive ? 'group-hover:scale-105' : ''
        }`}
        viewBox="0 0 600 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wrapSheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#C2410C" />
            <stop offset="50%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#9A3412" />
          </linearGradient>
        </defs>

        {/* Clean Studio Bay background */}
        <rect width="600" height="320" fill="#131110" />
        <line x1="0" y1="270" x2="600" y2="270" stroke="#2B2624" strokeWidth="2" />

        {/* Vehicle Shadow */}
        <ellipse cx="290" cy="275" rx="210" ry="14" fill="#000000" fillOpacity="0.8" />

        {/* Commercial Double-Cab Pickup Silhouette */}
        {/* Wheels */}
        <circle cx="170" cy="255" r="34" fill="#1C1917" stroke="#44403C" strokeWidth="6" />
        <circle cx="170" cy="255" r="16" fill="#78716C" stroke="#292524" strokeWidth="3" />

        <circle cx="410" cy="255" r="34" fill="#1C1917" stroke="#44403C" strokeWidth="6" />
        <circle cx="410" cy="255" r="16" fill="#78716C" stroke="#292524" strokeWidth="3" />

        {/* Main Body with High-Gloss Cast Vinyl Wrap */}
        <path
          d="M 90 220 L 110 185 L 170 175 L 230 115 L 370 115 L 430 165 L 490 170 L 490 235 L 450 235 C 450 215 370 215 370 235 L 210 235 C 210 215 130 215 130 235 L 90 235 Z"
          fill="url(#wrapSheen)"
          stroke="#F97316"
          strokeWidth="1.5"
        />

        {/* Cabin Glass / Optical Vision Window Graphics */}
        <polygon points="236,125 300,125 300,170 180,170" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
        <polygon points="310,125 365,125 410,170 310,170" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />

        {/* Corporate Livery Graphics & PrintD Pigh badge */}
        <rect x="180" y="185" width="210" height="32" rx="3" fill="#111110" />
        <text x="192" y="206" fill="#FFFFFF" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="12" letterSpacing="0.08em">
          ENTERPRISE INSURANCE
        </text>

        <rect x="180" y="220" width="90" height="12" rx="2" fill="#EA580C" />
        <text x="186" y="229" fill="#FFFFFF" fontFamily="monospace" fontSize="8" fontWeight="700">
          PRINTD PIGH UV
        </text>

        {/* Precision Inspection Grid Lines */}
        <line x1="80" y1="100" x2="80" y2="140" stroke="#EA580C" strokeWidth="1" />
        <line x1="60" y1="120" x2="100" y2="120" stroke="#EA580C" strokeWidth="1" />
        <circle cx="80" cy="120" r="14" stroke="#EA580C" strokeWidth="1" strokeDasharray="2 2" />
        <text x="105" y="123" fill="#EA580C" fontFamily="monospace" fontSize="8">
          ZERO-BUBBLE CAST
        </text>
      </svg>

      <div className="absolute bottom-3 right-3 rounded-md border border-white/20 bg-neutral-950/80 px-2.5 py-1 font-mono text-[10px] font-semibold text-neutral-300 backdrop-blur-md">
        PRINTD PIGH · CAST OVERLAMINATE
      </div>
    </div>
  );
}
