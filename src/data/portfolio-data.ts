export type ServiceCategory =
  | 'billboards'
  | 'field_production'
  | 'telescopic_flags'
  | 'event_branding'
  | 'wayfinding'
  | 'large_format_print';

export interface PortfolioService {
  id: string;
  category: ServiceCategory;
  title: string;
  shortTitle: string;
  summary: string;
  description: string;
  capabilities: string[];
  specifications: string[];
  turnaround: string;
  badge: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  client: string;
  category: ServiceCategory;
  categoryLabel: string;
  location: string;
  year: number;
  summary: string;
  challenge: string;
  solution: string;
  specs: string[];
  results: string[];
  testimonial?: {
    quote: string;
    author: string;
    position: string;
  };
  metrics?: { label: string; value: string }[];
  tag?: string;
}

export interface CompanyValue {
  title: string;
  description: string;
}

export interface OperationalPillar {
  number: string;
  title: string;
  description: string;
}

export interface CompanyProfile {
  name: string;
  legalName: string;
  tagline: string;
  headline: string;
  about: string;
  history: string;
  sisterCompany: {
    name: string;
    description: string;
  };
  headquarters: {
    address: string;
    street: string;
    area: string;
    city: string;
    country: string;
  };
  phoneNumbers: string[];
  emails: string[];
  website: string;
  businessHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  taxCompliance: {
    tin: string;
    getfund: string;
    nhil: string;
    vat: string;
    authority: string;
  };
  values: CompanyValue[];
  pillars: OperationalPillar[];
  statistics: { label: string; value: string; detail: string }[];
}

export interface ContactInquiry {
  id?: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  service: ServiceCategory | string;
  message: string;
  createdAt?: string;
}

export const PORTFOLIO_SERVICES: PortfolioService[] = [
  {
    id: 'srv-billboards',
    category: 'billboards',
    title: 'Outdoor Billboard Skins & Heavy PVC Rigging',
    shortTitle: 'Billboard Skins',
    summary: 'Heavy-gauge 550gsm UV blackout PVC, reinforced welded perimeter pockets, and high-tension highway rigging.',
    description: 'Precision large-scale outdoor skins engineered for Ghanaian arterial corridors including the Accra-Tema Motorway, Ring Road, and George Walker Bush Highway. High-frequency welded hem pockets and heavy-gauge eyelets withstand torrential seasonal rains and coastal wind buffeting.',
    capabilities: [
      '550gsm heavy blackout PVC media printing',
      'High-frequency thermal welded hem reinforcement',
      'Solid brass perimeter eyelets at 30cm pitch',
      'Elastic shock-cord and turnbuckle tension systems',
      'Night-rigging crews with dedicated mobile cherry pickers',
      'Wind-load engineering compliant with GSA standards',
    ],
    specifications: [
      'Media: 550gsm UV blackout multi-layer PVC',
      'Max seamless width: Up to 5.0m seamless width',
      'Inks: UV-cured outdoor pigments (ISO 105-B02 Grade 7)',
      'Perimeter: 50mm welded pocket with internal webbing',
    ],
    turnaround: '48 to 72 hours for standard unipoles and gantries',
    badge: 'High-Impact Outdoor',
  },
  {
    id: 'srv-field-production',
    category: 'field_production',
    title: 'Turnkey Field Production & Structural Rigging',
    shortTitle: 'Field Production',
    summary: 'Turnkey event staging, certified structural aluminium box trussing, on-site installation, and rapid teardown.',
    description: 'From ceremonial state pavilions to multi-day corporate summits across Accra and regional capitals. Our field engineers deploy certified aluminium truss grids, raised cassette flooring, and climate-controlled temporary structures with rigorous on-site safety protocols.',
    capabilities: [
      'Engineered structural aluminium box trussing (290mm & 400mm)',
      'Heavy-duty raised cassette leveling flooring systems',
      'Weather-sealed fire-retardant architectural canopies',
      'Dedicated certified rigging master on every site',
      'Integrated power distribution and safety cable ramp management',
      'Rapid overnight teardown leaving sites pristine',
    ],
    specifications: [
      'Truss material: Certified EN AW-6082 T6 aluminium alloy',
      'Load capacity: Distributed loads up to 1,200kg per span',
      'Flooring: 500kg/sqm load-rated cassette decking',
      'Safety: Rigging inspections and wind monitoring on-site',
    ],
    turnaround: '3 to 5 calendar days complete build for major pavilions',
    badge: 'Turnkey Rigging',
  },
  {
    id: 'srv-telescopic-flags',
    category: 'telescopic_flags',
    title: 'Telescopic Flag Poles & Corporate Rental Fleet',
    shortTitle: 'Telescopic Flags',
    summary: '3.5m to 5.5m anodized aluminium telescopic poles, weighted water and iron ballast bases, and custom flag fabrication.',
    description: 'The preferred flag deployment system for diplomatic summits, presidential corridors, corporate AGMs, and stadium activations. Features 360-degree free-spinning rotation arms to prevent flag furling in variable coastal winds.',
    capabilities: [
      '3.5m, 4.2m, and 5.0m adjustable anodized aluminium poles',
      'Heavy-duty 35L water ballast and solid iron base plates',
      'Ground spike anchors for soft lawn and field deployments',
      'Double-sided mirror-penetration dye-sublimation flags',
      '360-degree free-rotating top arm preventing furling',
      'Corporate rental fleet supporting up to 150 poles simultaneously',
    ],
    specifications: [
      'Poles: 6063-T5 high-tensile silver anodized aluminium',
      'Bases: 35L molded HDPE water/sand or 15kg flat steel plates',
      'Flag fabric: 110gsm - 130gsm knitted polyester sublimation',
      'Wind rating: Engineered for gusts up to 50 km/h',
    ],
    turnaround: 'Same-day mobilization from Accra warehouse for rental fleet',
    badge: 'Rental Fleet & Print',
  },
  {
    id: 'srv-event-branding',
    category: 'event_branding',
    title: 'Event Branding & High-Gloss Media Backdrops',
    shortTitle: 'Event Branding',
    summary: 'Glitch-free tension fabric media backdrops, stage fascia, roll-up luxury banners, and VIP plinths.',
    description: 'Transforming ballrooms, conference auditoriums, and exhibition halls into branded spaces. Our non-reflective matte tension fabrics eliminate camera flash glare for live television broadcasts, press conferences, and executive sponsor media walls.',
    capabilities: [
      'Seamless tension fabric backdrops up to 20m continuous width',
      'Zero-glare matte media walls optimized for broadcast cameras',
      'Heavyweight luxury roll-up banner cassettes (85cm & 120cm)',
      'Custom CNC-cut acrylic stage plinths and lectern fascias',
      'Fabric pop-up display booths and registration counters',
      'Step-and-repeat red carpet sponsor photo walls',
    ],
    specifications: [
      'Backdrop media: 240gsm matte blackout stretch fabric',
      'Frame: Tool-less push-pin anodized tubular aluminium',
      'Finish: Glare-free, moire-resistant for HD/4K television',
      'Plinths: 10mm cast acrylic with internal LED illumination',
    ],
    turnaround: '24 to 48 hours for bespoke event fabrications',
    badge: 'Broadcast Ready',
  },
  {
    id: 'srv-wayfinding',
    category: 'wayfinding',
    title: 'Architectural Wayfinding & Directional Signage',
    shortTitle: 'Wayfinding & Signage',
    summary: 'Brushed aluminium directional totems, monolithic campus pylons, and modular interior navigation suites.',
    description: 'Permanent and campus architectural signage designed for corporate headquarters, banking institutions, and medical centers. Engineered with marine-grade anti-corrosive finishes to withstand Accra coastal air while upholding brand typography.',
    capabilities: [
      'Exterior monolithic directional pylons and entrance totems',
      'Laser-routed satin acrylic 3D lettering and logos',
      'Brushed composite aluminium panels with UV protective lacquer',
      'Modular interior floor directories and suspended directional signs',
      'Internal concrete ballast foundations and anchor bolts',
      'Photoluminescent safety and emergency exit directional signs',
    ],
    specifications: [
      'Materials: 3mm - 4mm architectural aluminium composite panel',
      'Internal core: Galvanized square hollow steel internal skeleton',
      'Lettering: 8mm - 12mm cast acrylic with bevelled edge routing',
      'Coating: Marine-grade anti-corrosive polyurethane clearcoat',
    ],
    turnaround: '10 to 18 business days for complete facility rollouts',
    badge: 'Architectural Systems',
  },
  {
    id: 'srv-large-format-print',
    category: 'large_format_print',
    title: 'Large-Format UV Flatbed & Fleet Wraps (PrintD Pigh)',
    shortTitle: 'Large-Format Print',
    summary: 'High-precision UV flatbed print, cast vinyl vehicle fleet wraps, and architectural window graphics via PrintD Pigh facility.',
    description: 'Operated in seamless synergy with sister facility PrintD Pigh. Houses industrial Roland and EFI wide-format flatbed and roll-to-roll presses, producing microscopic color fidelity on rigid boards, flexible films, cast vinyls, and clear architectural window films.',
    capabilities: [
      'Cast vinyl vehicle wraps with protective gloss overlaminates',
      'Direct-to-substrate UV flatbed printing on wood, glass, and acrylic',
      'Micro-perforated one-way optical vision architectural glass films',
      'Dye-sublimation textile printing for flags and soft signage',
      'Precision digital contour blade and router cutting',
      'Full fleet branding management across Ghana regional offices',
    ],
    specifications: [
      'Resolution: Up to 1440 DPI photographic micro-piezo drop-on-demand',
      'Substrates: Acrylic, Forex, Correx, ACM, Glass, Cast Vinyl',
      'Durability: 3 to 5 years outdoor UV rating with overlaminate',
      'Vehicle wrap film: Premium cast vinyl with bubble-free air channels',
    ],
    turnaround: '24 to 48 hours from artwork sign-off',
    badge: 'PrintD Pigh Facility',
  },
];

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'ecobank-wayfinding',
    title: 'Head Office & Nationwide Branch Wayfinding Totems',
    client: 'Ecobank Ghana PLC',
    category: 'wayfinding',
    categoryLabel: 'Wayfinding & Signage',
    location: 'Accra, Ridge & Nationwide (14 Branches)',
    year: 2025,
    summary: 'Custom architectural totems and directional pylons installed across the Ridge Head Office and 14 flagship branches in Ghana.',
    challenge: 'Ecobank required an architectural wayfinding system across their 2 Morocco Lane Head Office and nationwide branches. The installations needed to withstand extreme coastal salt humidity in Accra, resist high UV exposure, and maintain exact fidelity to Ecobank pan-African brand standards.',
    solution: 'Engineered modular brushed composite aluminium totems featuring internal galvanized steel frames, cast concrete footings, and laser-routed satin acrylic lettering. Applied marine-grade polyurethane UV sealants to guarantee long-term resistance to coastal corrosion.',
    specs: [
      'Brushed anodized aluminium pylons (2.4m height x 0.9m width)',
      'Internal galvanized steel subframe with concrete anchor anchors',
      'Laser-cut 10mm satin finish acrylic 3D lettering and crest',
      'Marine-grade anti-corrosive coastal polyurethane coating',
      'Modular panel design allowing rapid directional updates',
    ],
    results: [
      '14 nationwide branches completely retrofitted within 18 business days',
      'Zero structural deflection or surface oxidation across 12-month audit',
      '100% compliance certified by Ecobank Corporate Brand & Facilities team',
      'Visitors and branch staff report 64% reduction in directional inquiries',
    ],
    testimonial: {
      quote: 'Collage engineered a wayfinding system that seamlessly reflects our institutional stature while withstanding the Accra coastal climate. Their speed and precision across 14 branches was exemplary.',
      author: 'Nana Ama Mensah',
      position: 'Head of Brand & Facilities, Ecobank Ghana PLC',
    },
    metrics: [
      { label: 'Branches Deployed', value: '14' },
      { label: 'Turnaround Window', value: '18 Days' },
      { label: 'Durability Rating', value: '5 Years' },
    ],
    tag: 'Flagship Corporate',
  },
  {
    id: 'mtn-billboard-skins',
    title: 'Yellow Summer 550gsm Highway Billboard Skins',
    client: 'Scancom PLC (MTN Ghana)',
    category: 'billboards',
    categoryLabel: 'Billboard Skins',
    location: 'Accra-Tema Motorway, Ring Road Central & George Bush Highway',
    year: 2025,
    summary: 'Heavy-gauge 550gsm blackout PVC skins deployed across high-traffic motorway unipoles and arterial gantries.',
    challenge: 'MTN Ghana required high-impact promotional billboard skins across key highway gantries and unipoles for their nationwide summer campaign. Skins had to survive intense tropical sunshine, rapid temperature swings, and severe squalls without tearing, seam separation, or yellow fade.',
    solution: 'Printed on heavy 550gsm blackout multi-layer PVC substrate using industrial UV-cured pigments with ISO 105-B02 Grade 7 lightfastness. Thermo-welded heavy-frequency hem pockets and reinforced perimeter eyelets every 30cm, paired with elasticated tension lanyards.',
    specs: [
      '550gsm heavy blackout PVC substrate with opaque black barrier layer',
      'High-frequency thermal welded perimeter pockets with internal nylon strap',
      'Solid brass eyelets installed at 30cm pitch under 5-ton hydraulic pressure',
      'UV pigment cure rated to ISO 105-B02 Grade 7 (zero noticeable fade)',
      'Night-time installation protocol with traffic diversion clearance',
    ],
    results: [
      '12 massive highway unipoles and gantries installed within 72 hours',
      'Zero tear-outs or pocket seam failures during seasonal rainstorms',
      'Exact MTN corporate yellow color match maintained across all daylight angles',
      'Estimated 4.8 million weekly impressions generated along Accra-Tema corridor',
    ],
    testimonial: {
      quote: 'The print sharpness and tensioning on our motorway gantries were flawless. The Collage crew worked through the night to meet our launch embargo with zero compromise on safety.',
      author: 'Kwame Osei-Bonsu',
      position: 'Senior Brand Specialist, Scancom PLC (MTN Ghana)',
    },
    metrics: [
      { label: 'Skins Installed', value: '12' },
      { label: 'Deployment Time', value: '72 Hours' },
      { label: 'PVC Specification', value: '550gsm UV' },
    ],
    tag: 'High Visibility',
  },
  {
    id: 'ghana-energy-summit',
    title: 'Grand Arena Stage Rigging & Event Branding',
    client: 'Ghana Energy Summit 2026',
    category: 'event_branding',
    categoryLabel: 'Event Branding',
    location: 'Accra International Conference Centre (AICC)',
    year: 2026,
    summary: 'Turnkey stage backdrop, structural box-truss rigging, executive plinths, and sponsor media walls for 1,200 international delegates.',
    challenge: 'Deliver an international ministerial summit stage featuring an 18-meter panoramic stage backdrop, high-contrast lectern branding, sponsor photo media walls, and lighting trussing. Media backdrops had to be completely glare-free for live international 4K television cameras.',
    solution: 'Designed and deployed an 18m x 4.5m seamless tension fabric media wall using 240gsm matte blackout stretch textile. Integrated structural aluminium 290mm box-truss rigging and custom CNC-routed acrylic plinths with integrated warm LED edge illumination.',
    specs: [
      '18m x 4.5m seamless tension fabric media wall with zero seam distortion',
      'Matte blackout fabric finish with zero flash or camera glare reflection',
      'Structural aluminium 290mm box truss grid rated for 1,000kg distributed load',
      'Precision laser-cut acrylic VIP stage plinths and branded speaker podiums',
      'Step-and-repeat VIP media walls with sponsors logo layout',
    ],
    results: [
      'Rapid 48-hour overnight setup ahead of state protocol security lockdown',
      'Flawless 4K broadcast video recordings with zero moire pattern interference',
      'Hosted over 1,200 delegates including 18 international ministers without issue',
      'Dismantled and packed within 4 hours following closing gala dinner',
    ],
    testimonial: {
      quote: 'The stage presence was immaculate. International delegations and television networks remarked on the flawless finish of our main auditorium backdrop.',
      author: 'Dr. Michael Addison',
      position: 'Summit Director, Ghana Energy Forum',
    },
    metrics: [
      { label: 'Stage Backdrop Width', value: '18m' },
      { label: 'Delegates Hosted', value: '1,200+' },
      { label: 'Setup Duration', value: '48 Hours' },
    ],
    tag: 'International Summit',
  },
  {
    id: 'african-protocol-flags',
    title: 'Telescopic Anodized Flagpole Deployment',
    client: 'African Protocol Summit',
    category: 'telescopic_flags',
    categoryLabel: 'Telescopic Flag Poles',
    location: 'Ridge Presidential Corridor & Kempinski Hotel Gold Coast City',
    year: 2026,
    summary: 'Ceremonial deployment of 48 telescopic flagpoles with 360-degree rotating arms along the Ridge diplomatic corridor.',
    challenge: 'Display flags of 32 participating African nations along outdoor ceremonial avenues and VIP arrival pavilions. Strong sea breezes and sudden wind shifts threatened to furl flags or tip lightweight temporary poles, which would violate diplomatic protocol.',
    solution: 'Mobilized 48 units of Collage heavy-duty 5.0m anodized aluminium telescopic poles equipped with 35L high-density water/sand ballast bases. Fabricated double-sided dye-sublimated satin knit flags with 360-degree free-spinning top arms.',
    specs: [
      '5.0m adjustable anodized aluminium telescopic poles (6063-T5 alloy)',
      '35L high-density polyethylene water and sand ballast bases (38kg loaded)',
      'Dye-sublimation 120gsm knitted polyester fabric with mirror penetration',
      '360-degree free-spinning flag arm ensuring permanent flutter visibility',
      'Rapid-deployment locking collars with height leveling indicators',
    ],
    results: [
      '48 flag systems aligned and deployed within 6 hours across two venues',
      'Endured 45 km/h afternoon coastal wind gusts with zero tip-overs',
      'Diplomatic protocol confirmed 100% compliance for all 32 head-of-state flags',
      'Flags remained crisp, tangle-free, and visible throughout the 4-day summit',
    ],
    testimonial: {
      quote: 'The ceremonial flags remained immaculate and unfurled throughout the entire summit regardless of wind conditions. Collage delivered with true diplomatic precision.',
      author: 'Ambassador Kofi Mensah',
      position: 'Head of State Protocol Logistics',
    },
    metrics: [
      { label: 'Poles Deployed', value: '48 Units' },
      { label: 'Nations Represented', value: '32' },
      { label: 'Wind Resistance', value: '50 km/h' },
    ],
    tag: 'Diplomatic Protocol',
  },
  {
    id: 'stanchart-pavilion',
    title: 'Sustainable Banking Pavilion Field Production',
    client: 'Standard Chartered Bank Ghana',
    category: 'field_production',
    categoryLabel: 'Field Production',
    location: 'Independence Square, Accra',
    year: 2025,
    summary: '300 sqm raised-cassette corporate activation pavilion with modular structural portal frames and weather-sealed membranes.',
    challenge: 'Fabricate an open-air corporate pavilion in Independence Square for financial literacy month. The structure required climate control, raised level flooring over uneven pavement, certified structural wind ratings, and complete teardown within 12 hours after the event.',
    solution: 'Turnkey field production including a 300 sqm raised cassette flooring system, heavy aluminium portal frame, 650gsm fire-retardant architectural membrane canopy, internal partition walls, certified power distribution runs, and accessibility ramps.',
    specs: [
      '300 sqm raised leveling cassette flooring with heavy-duty carpet finish',
      'Heavy structural aluminium portal frame with wind engineering sign-off',
      'Weather-sealed 650gsm fire-retardant architectural membrane canopy',
      'Integrated electrical sub-distribution with cable management channels',
      'Modular wheelchair accessibility ramps compliant with accessibility codes',
    ],
    results: [
      'Engineered, safety-certified, and erected in 5 calendar days',
      'Zero safety incidents recorded across 14 days of continuous public visitors',
      'Welcomed more than 8,500 visitors during the two-week activation',
      'Complete site teardown and pavement handover in under 12 hours',
    ],
    testimonial: {
      quote: 'Collage turned an open expanse into an institutional banking environment in less than a week with remarkable engineering discipline and zero safety compromises.',
      author: 'Abena Osei-Poku',
      position: 'Executive Director, Client Experience',
    },
    metrics: [
      { label: 'Pavilion Footprint', value: '300 sqm' },
      { label: 'Visitors Handled', value: '8,500+' },
      { label: 'Teardown Window', value: '12 Hours' },
    ],
    tag: 'Field Production',
  },
  {
    id: 'enterprise-fleet-branding',
    title: 'Regional Fleet Wrap & UV Window Manifestations',
    client: 'Enterprise Insurance PLC',
    category: 'large_format_print',
    categoryLabel: 'Large-Format Print',
    location: 'Accra, Tema, Kumasi & Takoradi',
    year: 2025,
    summary: 'Comprehensive vehicle wraps across 24 corporate fleet pickups and architectural window films across 6 regional branches.',
    challenge: 'Rebrand 24 corporate fleet pickup trucks and 6 regional sales branches before an impending national brand campaign. Vehicle wraps had to resist sun fading, gravel road chips, and frequent high-pressure pressure washing in mining and agricultural corridors.',
    solution: 'Produced via sister facility PrintD Pigh using industrial Roland wide-format presses. Applied premium cast vinyl with micro air-release channels and high-gloss UV overlaminates. Installed micro-perforated one-way architectural vision films on branch storefront windows.',
    specs: [
      'Premium cast vinyl with air-release channel technology for zero bubbles',
      'UV-cured pigment with 3-year outdoor gloss overlaminate protection',
      'Micro-perforated 60/40 one-way optical vision glass film for branches',
      'Installed by certified wrap technicians in climate-controlled bay',
      'Computer-cut decals for secondary emergency contact markers',
    ],
    results: [
      '24 fleet vehicles wrapped with zero bubble or edge-peel defects',
      '6 branch storefront window manifestations installed across 3 regions',
      'Full project delivered 4 business days ahead of marketing launch deadline',
      'Vehicle graphics audited after 12 months in field with zero color degradation',
    ],
    testimonial: {
      quote: 'The fleet graphics have transformed our on-road visibility. Even after a year of heavy fieldwork across the country, the colors remain as striking as day one.',
      author: 'Kweku Amponsah',
      position: 'Head of Marketing & Communications, Enterprise Insurance',
    },
    metrics: [
      { label: 'Vehicles Wrapped', value: '24 Pickups' },
      { label: 'Branches Branded', value: '6 Offices' },
      { label: 'Film Longevity', value: '3+ Years' },
    ],
    tag: 'PrintD Pigh Facility',
  },
];

export const COMPANY_PROFILE: CompanyProfile = {
  name: 'Collage',
  legalName: 'Collage Ghana Limited',
  tagline: 'Creating Results',
  headline: 'Ghanaian Precision in Out-of-Home Advertising, Structural Field Production & Event Signage',
  about: 'Collage is an Accra-based corporate marketing, event production, and advertising agency specializing in outdoor billboard skins, high-wind telescopic flag rentals, structural arena staging, architectural wayfinding, and large-format printing. Founded on principles of Swiss engineering minimalism and Ghanaian commercial rigor, Collage delivers turnkey brand installations for multinational institutions, financial leaders, and state summits.',
  history: 'Operating in close partnership with our sister manufacturing facility PrintD Pigh, Collage bridges strategic creative branding with industrial-scale digital fabrication. From high-frequency welded 550gsm highway skins to diplomatic flagpole fleets, our work defines Ghana urban skylines and national event arenas.',
  sisterCompany: {
    name: 'PrintD Pigh',
    description: 'Our dedicated high-volume digital printing facility in Accra, housing industrial UV flatbed presses, dye-sublimation textile printers, and digital contour routing tables.',
  },
  headquarters: {
    address: '2 Morocco Lane, Off Independence Avenue, Ridge, Accra, Ghana',
    street: '2 Morocco Lane, Off Independence Avenue',
    area: 'Ridge Corporate Corridor',
    city: 'Accra',
    country: 'Ghana',
  },
  phoneNumbers: ['+233 24 736 1133', '+233 24 431 8902'],
  emails: ['collagenmosaic@gmail.com', 'sendit@collagenmosaic.com'],
  website: 'www.collagenmosaic.com',
  businessHours: {
    weekdays: '08:00 - 18:00 GMT (Monday to Friday)',
    saturday: '09:00 - 14:00 GMT (Field & Emergency Operations)',
    sunday: 'Closed (Field Crews on Dedicated Event Standby)',
  },
  taxCompliance: {
    tin: 'C0028102601',
    getfund: '2.5%',
    nhil: '2.5%',
    vat: '15.0%',
    authority: 'Ghana Revenue Authority (GRA) Fully Registered & Withholding Tax Compliant',
  },
  values: [
    {
      title: 'Engineering Rigor',
      description: 'Every billboard pocket, stage truss span, and flag base is calculated for structural safety, weather resistance, and long-term durability under Ghanaian climate conditions.',
    },
    {
      title: 'Speed & Mobilization',
      description: 'Dedicated night-rigging teams and rapid-mobilization field crews ensure launch embargoes and presidential summit deadlines are met without fail.',
    },
    {
      title: 'Institutional Integrity',
      description: 'Strict adherence to pan-African brand manuals, exact Pantone color management, and 100% transparent Ghanaian statutory tax compliance.',
    },
    {
      title: 'Collaborative Synergy',
      description: 'Direct vertical integration with sister facility PrintD Pigh enables seamless control from raw fabric and substrate to final on-site installation.',
    },
  ],
  pillars: [
    {
      number: '01',
      title: 'Structural Safety & Wind Engineering',
      description: 'We treat outdoor branding as structural engineering. All billboard skins and field stages undergo wind-load analysis and tension testing.',
    },
    {
      number: '02',
      title: 'PrintD Pigh Sister Facility',
      description: 'Direct in-house industrial printing with Roland and EFI wide-format presses ensures rapid turnarounds, verified color accuracy, and strict quality control.',
    },
    {
      number: '03',
      title: 'Rapid Deployment Fleet',
      description: 'Over 150 telescopic flag poles, 500 sqm of modular trussing, and mobile cherry-picker trucks ready for emergency event mobilization in Accra and beyond.',
    },
    {
      number: '04',
      title: 'Complete Tax & Legal Compliance',
      description: 'Full GRA tax registration covering GETFund (2.5%), NHIL (2.5%), and standard VAT (15.0%) with automated electronic invoice reconciliation.',
    },
  ],
  statistics: [
    {
      label: 'Years in Operation',
      value: '15+',
      detail: 'Delivering results across Ghana and West Africa since 2011',
    },
    {
      label: 'Corporate Projects',
      value: '500+',
      detail: 'Completed for leading financial, telco, and public sector institutions',
    },
    {
      label: 'Flag Pole Fleet',
      value: '150+',
      detail: 'Units in our corporate rental inventory for rapid event deployment',
    },
    {
      label: 'Tax & Regulatory Status',
      value: '100%',
      detail: 'Compliant with GRA statutory levies and municipal building permits',
    },
  ],
};

export function getServiceByCategory(category: ServiceCategory): PortfolioService | undefined {
  return PORTFOLIO_SERVICES.find((s) => s.category === category);
}

export function getProjectById(id: string): PortfolioProject | undefined {
  return PORTFOLIO_PROJECTS.find((p) => p.id === id);
}

export function getProjectsByCategory(category: ServiceCategory | 'all'): PortfolioProject[] {
  if (category === 'all') return PORTFOLIO_PROJECTS;
  return PORTFOLIO_PROJECTS.filter((p) => p.category === category);
}
