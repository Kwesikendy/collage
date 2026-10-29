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
    title: 'Outdoor Billboard Skins',
    shortTitle: 'Billboard Skins',
    summary: 'Printing and mounting of outdoor billboard skins and banners.',
    description: 'Large-scale outdoor billboard skin production, perimeter eyelet finishing, and on-site installation across Accra and major corridors in Ghana.',
    capabilities: [
      'Heavy-duty outdoor PVC banner printing',
      'Reinforced welded hem pockets and perimeter eyelets',
      'On-site installation and tension rigging',
      'Billboard replacement and maintenance services',
    ],
    specifications: [
      'Material: Outdoor weather-resistant PVC banner substrate',
      'Finishing: Perimeter hem with reinforced eyelets',
      'Installation: Rigging crew on site',
    ],
    turnaround: 'Contact for scheduling and turnaround',
    badge: 'Outdoor Advertising',
  },
  {
    id: 'srv-field-production',
    category: 'field_production',
    title: 'Field Production & Event Setup',
    shortTitle: 'Field Production',
    summary: 'Event staging, aluminum trussing, and on-site event infrastructure.',
    description: 'Turnkey event setups including stage platforms, overhead lighting trussing, event tents, and on-site technical support for corporate and private events.',
    capabilities: [
      'Aluminum box trussing and overhead structures',
      'Modular event stage platforms and stairs',
      'On-site event setup, monitoring, and dismantling',
      'Temporary event flooring and structures',
    ],
    specifications: [
      'Structure: Modular aluminum truss system',
      'Staging: Height-adjustable stage platforms',
      'Support: Dedicated on-site crew',
    ],
    turnaround: 'Scheduled per event requirements',
    badge: 'Event Production',
  },
  {
    id: 'srv-telescopic-flags',
    category: 'telescopic_flags',
    title: 'Telescopic Flag Poles & Rentals',
    shortTitle: 'Telescopic Flags',
    summary: 'Telescopic flagpoles with weighted bases and custom flag printing.',
    description: 'Rental and sales of telescopic flagpoles suitable for corporate entrances, diplomatic events, exhibitions, and promotional brand activations.',
    capabilities: [
      'Adjustable telescopic aluminum flagpoles',
      'Weighted water and sand base ballast kits',
      'Custom dye-sublimated fabric flag printing',
      'Delivery, setup, and retrieval services across Accra',
    ],
    specifications: [
      'Poles: Aluminum telescopic poles (adjustable height)',
      'Bases: Fillable water/sand weighted ballast bases',
      'Flags: High-durability polyester fabric',
    ],
    turnaround: 'Available for immediate rental and dispatch',
    badge: 'Equipment Rental',
  },
  {
    id: 'srv-event-branding',
    category: 'event_branding',
    title: 'Event Branding & Media Backdrops',
    shortTitle: 'Event Branding',
    summary: 'Custom photo backdrops, media walls, plinths, and branded signage.',
    description: 'Indoor and outdoor event branding including step-and-repeat sponsor media backdrops, branded lecterns, roll-up banner stands, and entrance arches.',
    capabilities: [
      'Tension fabric and banner media backdrops',
      'Step-and-repeat sponsor photo walls',
      'Branded lecterns, podiums, and stage plinths',
      'Roll-up banner stands and pop-up displays',
    ],
    specifications: [
      'Finish: Non-reflective matte fabric or vinyl',
      'Mounting: Freestanding frames or truss mounting',
      'Printing: Full-color high-resolution branding',
    ],
    turnaround: 'Available per project brief',
    badge: 'Brand Activations',
  },
  {
    id: 'srv-wayfinding',
    category: 'wayfinding',
    title: 'Wayfinding & Directional Signage',
    shortTitle: 'Wayfinding',
    summary: 'Permanent and temporary directional signage, pylons, and office markers.',
    description: 'Design, fabrication, and mounting of architectural directional signs, entrance pylons, office wall branding, and campus wayfinding systems.',
    capabilities: [
      'Freestanding entrance totems and pylons',
      'Directional wall and post signage',
      '3D acrylic and aluminum lettering',
      'Site survey, layout planning, and installation',
    ],
    specifications: [
      'Materials: Aluminum composite panel, acrylic, and steel',
      'Mounting: Ground-anchored or wall-mounted',
      'Durability: Weather-resistant exterior finishes',
    ],
    turnaround: 'Fabricated per project specifications',
    badge: 'Signage & Wayfinding',
  },
  {
    id: 'srv-large-format-print',
    category: 'large_format_print',
    title: 'Large-Format Printing',
    shortTitle: 'Large-Format Print',
    summary: 'High-volume banner, sticker, vehicle wrap, and window graphics printing.',
    description: 'Comprehensive large-format printing services operated in collaboration with our sister facility PrintD Pigh, covering banners, vinyl stickers, vehicle branding, and window graphics.',
    capabilities: [
      'Vinyl stickers and vehicle branding',
      'Window graphics and perforated vinyl films',
      'Mesh banners and building wraps',
      'Custom cut decals and promotional displays',
    ],
    specifications: [
      'Facility: Produced with sister facility PrintD Pigh',
      'Media: Self-adhesive vinyl, one-way vision, and banner media',
      'Printing: Wide-format digital print presses',
    ],
    turnaround: 'Fast turnaround upon artwork confirmation',
    badge: 'Print Services',
  },
];

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'ecobank-wayfinding',
    title: 'Directional Pylons & Wayfinding Signage',
    client: 'Ecobank Ghana PLC',
    category: 'wayfinding',
    categoryLabel: 'Wayfinding & Signage',
    location: 'Ridge Head Office & Branches, Accra',
    year: 2025,
    summary: 'Architectural directional totems and entrance signage for the Ridge head office and branch premises.',
    challenge: 'Provide clear, durable directional signage for visitors and staff across office entrances and parking areas.',
    solution: 'Fabricated weather-resistant aluminum composite pylons with clean acrylic branding and installed them at designated vehicular and pedestrian access points.',
    specs: [
      'Aluminum composite pylon structures',
      'Concrete anchor foundation mounts',
      'Directional panels with brand lettering',
    ],
    results: [
      'Signage deployed across key entrance points',
      'Durable, weather-resistant finish',
      'Positive feedback from facilities management',
    ],
    testimonial: {
      quote: 'The directional signage provided clear navigation across our premises and was delivered cleanly on schedule.',
      author: 'Facilities Team',
      position: 'Ecobank Ghana',
    },
    metrics: [
      { label: 'Scope', value: 'Complete Signage' },
      { label: 'Location', value: 'Ridge, Accra' },
    ],
    tag: 'Wayfinding',
  },
  {
    id: 'mtn-billboard-skins',
    title: 'Highway Billboard Skins & Mounting',
    client: 'Scancom PLC (MTN Ghana)',
    category: 'billboards',
    categoryLabel: 'Billboard Skins',
    location: 'Major Arterial Corridors, Accra',
    year: 2025,
    summary: 'Printing and tension-rigging of promotional billboard skins across key highway locations.',
    challenge: 'Print large-scale outdoor skins with vibrant color consistency and mount them securely on highway billboard structures.',
    solution: 'Produced heavy-duty outdoor PVC skins with reinforced perimeter pockets and eyelets, installed by experienced rigging personnel.',
    specs: [
      'Weather-resistant outdoor PVC banner media',
      'Perimeter hem pockets with heavy-duty eyelets',
      'On-site installation and tension rigging',
    ],
    results: [
      'Skins mounted securely across highway structures',
      'Vibrant color reproduction',
      'Completed within the requested campaign timeline',
    ],
    testimonial: {
      quote: 'Collage ensured our campaign billboard skins were printed cleanly and installed on time.',
      author: 'Brand Marketing Team',
      position: 'MTN Ghana',
    },
    metrics: [
      { label: 'Service', value: 'Billboard Rigging' },
      { label: 'Coverage', value: 'Accra Corridors' },
    ],
    tag: 'Billboard Skins',
  },
  {
    id: 'ghana-energy-summit',
    title: 'Stage Setup & Event Media Backdrop',
    client: 'Ghana Energy Summit 2026',
    category: 'event_branding',
    categoryLabel: 'Event Branding',
    location: 'Accra International Conference Centre (AICC)',
    year: 2026,
    summary: 'Main stage backdrop, lighting truss support, and sponsor photo backdrops for conference delegates.',
    challenge: 'Create a professional conference stage setup with non-reflective backdrops suitable for live presentations and photography.',
    solution: 'Installed a wide matte fabric stage backdrop, aluminum truss support, and sponsor step-and-repeat media walls for delegate arrivals.',
    specs: [
      'Wide-format matte event backdrop',
      'Aluminum box truss support structure',
      'Sponsor photo media walls and lectern branding',
    ],
    results: [
      'Stage and media backdrops ready ahead of event opening',
      'Clear visibility for presentations and photography',
      'Clean teardown after the closing ceremony',
    ],
    testimonial: {
      quote: 'The stage setup looked professional and met all our conference requirements smoothly.',
      author: 'Event Coordinator',
      position: 'Ghana Energy Forum',
    },
    metrics: [
      { label: 'Venue', value: 'AICC Grand Arena' },
      { label: 'Service', value: 'Turnkey Branding' },
    ],
    tag: 'Event Setup',
  },
  {
    id: 'african-protocol-flags',
    title: 'Telescopic Flagpole Fleet Deployment',
    client: 'African Protocol Summit',
    category: 'telescopic_flags',
    categoryLabel: 'Telescopic Flag Poles',
    location: 'Ridge Diplomatic Corridor, Accra',
    year: 2026,
    summary: 'Rental and installation of telescopic flagpoles and national flags for a multilateral summit.',
    challenge: 'Provide secure, upright outdoor flag displays along event perimeters that remain stable in outdoor conditions.',
    solution: 'Supplied adjustable telescopic poles with fillable weighted bases and printed high-visibility national flags.',
    specs: [
      'Adjustable telescopic aluminum poles',
      'Water and sand weighted base ballast units',
      'Double-sided printed polyester flags',
    ],
    results: [
      'Poles positioned securely along designated corridors',
      'Stable performance throughout the multi-day event',
      'Prompt retrieval upon event conclusion',
    ],
    testimonial: {
      quote: 'The flagpoles were installed promptly and provided a dignified display throughout the summit.',
      author: 'Protocol Logistics Team',
      position: 'Organizing Committee',
    },
    metrics: [
      { label: 'Service', value: 'Flagpole Rental' },
      { label: 'Type', value: 'Weighted Bases' },
    ],
    tag: 'Flagpoles',
  },
  {
    id: 'stanchart-pavilion',
    title: 'Temporary Event Pavilion Setup',
    client: 'Standard Chartered Bank Ghana',
    category: 'field_production',
    categoryLabel: 'Field Production',
    location: 'Independence Square, Accra',
    year: 2025,
    summary: 'Outdoor event pavilion structure with flooring and canopy cover for corporate outreach.',
    challenge: 'Construct a secure temporary outdoor pavilion structure on open ground for corporate outreach activities.',
    solution: 'Assembled a temporary modular pavilion with leveled flooring, weather canopy, and branded interior panels.',
    specs: [
      'Modular structural frame and canopy covering',
      'Level platform flooring',
      'Internal partition walls and signage',
    ],
    results: [
      'Pavilion completed on schedule for opening day',
      'Safe and comfortable environment for visitors',
      'Clean disassembly and site restoration',
    ],
    testimonial: {
      quote: 'The outdoor pavilion was built on time and served our outreach programme effectively.',
      author: 'Corporate Affairs',
      position: 'Standard Chartered Bank Ghana',
    },
    metrics: [
      { label: 'Structure', value: 'Outdoor Pavilion' },
      { label: 'Location', value: 'Accra' },
    ],
    tag: 'Field Production',
  },
  {
    id: 'enterprise-fleet-branding',
    title: 'Corporate Fleet Vehicle Branding',
    client: 'Enterprise Insurance PLC',
    category: 'large_format_print',
    categoryLabel: 'Large-Format Print',
    location: 'Accra & Regional Offices',
    year: 2025,
    summary: 'Vinyl vehicle branding and office window graphics for corporate branding consistency.',
    challenge: 'Apply clean, durable brand decals and window graphics across fleet vehicles and office locations.',
    solution: 'Printed and laminated self-adhesive vinyl graphics at sister facility PrintD Pigh and applied them to client vehicles and office windows.',
    specs: [
      'Self-adhesive vinyl with protective laminate',
      'Window graphics and door decals',
      'Installed on site by applicator team',
    ],
    results: [
      'Consistent vehicle appearance across fleet',
      'Clean bubble-free vinyl application',
      'Durable finish for daily operational use',
    ],
    testimonial: {
      quote: 'The vehicle decals and office graphics were printed sharply and installed with care.',
      author: 'Marketing Unit',
      position: 'Enterprise Insurance',
    },
    metrics: [
      { label: 'Application', value: 'Fleet & Signage' },
      { label: 'Print Partner', value: 'PrintD Pigh' },
    ],
    tag: 'Vehicle Branding',
  },
];

export const COMPANY_PROFILE: CompanyProfile = {
  name: 'Collage',
  legalName: 'Collage Ghana Limited',
  tagline: 'Creating Results',
  headline: 'Advertising, Event Staging & Large-Format Printing in Accra, Ghana',
  about: 'Collage is an advertising, marketing, and event production company based in Accra, Ghana. We provide outdoor billboard skins, telescopic flagpole rentals, event branding, field production setups, and large-format printing.',
  history: 'Working alongside our sister manufacturing facility PrintD Pigh, Collage provides end-to-end event and branding support for corporate institutions, event organizers, and public sector organizations across Ghana.',
  sisterCompany: {
    name: 'PrintD Pigh',
    description: 'Our sister digital printing facility in Accra, supporting large-format printing, banner production, and specialty graphics.',
  },
  headquarters: {
    address: '2 Morocco Lane, Off Independence Avenue, Ridge, Accra, Ghana',
    street: '2 Morocco Lane, Off Independence Avenue',
    area: 'Ridge',
    city: 'Accra',
    country: 'Ghana',
  },
  phoneNumbers: ['+233 24 736 1133', '+233 24 431 8902'],
  emails: ['collagenmosaic@gmail.com'],
  website: 'www.collagenmosaic.com',
  businessHours: {
    weekdays: '08:00 - 18:00 GMT (Monday to Friday)',
    saturday: '09:00 - 14:00 GMT',
    sunday: 'Closed',
  },
  taxCompliance: {
    tin: 'C0028102601',
    getfund: '2.5%',
    nhil: '2.5%',
    vat: '15.0%',
    authority: 'Ghana Revenue Authority (GRA) Registered',
  },
  values: [
    {
      title: 'Reliability',
      description: 'Delivering event setups, rentals, and print jobs on schedule.',
    },
    {
      title: 'Quality',
      description: 'Using durable materials and careful on-site installation.',
    },
  ],
  pillars: [
    {
      number: '01',
      title: 'Outdoor Advertising',
      description: 'Billboard skins, banners, and high-visibility outdoor displays.',
    },
    {
      number: '02',
      title: 'Equipment Rental',
      description: 'Telescopic flagpoles with weighted bases and event staging fixtures.',
    },
    {
      number: '03',
      title: 'Print Production',
      description: 'Large-format digital printing in partnership with PrintD Pigh.',
    },
  ],
  statistics: [],
};

export function getProjectById(id: string): PortfolioProject | undefined {
  if (!id || typeof id !== 'string') return undefined;
  const cleanId = id.trim().toLowerCase().replace(/^prj-/, '');
  return PORTFOLIO_PROJECTS.find(
    (p) =>
      p.id.toLowerCase() === cleanId ||
      p.id.toLowerCase() === id.trim().toLowerCase() ||
      p.id.toLowerCase() === `prj-${cleanId}`,
  );
}

export function getProjectsByCategory(
  category: ServiceCategory | 'all',
): PortfolioProject[] {
  if (category === 'all') {
    return PORTFOLIO_PROJECTS;
  }
  return PORTFOLIO_PROJECTS.filter((p) => p.category === category);
}

export function getAllCategories(): { id: ServiceCategory; title: string }[] {
  return PORTFOLIO_SERVICES.map((s) => ({
    id: s.category,
    title: s.title,
  }));
}
