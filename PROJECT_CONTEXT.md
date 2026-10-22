# Project Context — Collage ERP

> **Notice for Any AI Agent / Developer Resuming This Project**:  
> Read this document first before writing code or running commands. It summarizes the business domain, architecture, design system, active configurations, and security practices so you can make progress immediately without burning tokens.

---

## 1. Executive Summary & Business Profile

- **Company Name**: **Collage** (Sub-brand / Sister company to **PrintD Pigh**)
- **Tagline**: *Creating Results*
- **Headquarters**: Accra, Ghana
- **Contact Details**: 
  - Phone: `+233 24 736 1133`
  - Emails: `collagenmosaic@gmail.com` / `sendit@collagenmosaic.com`
  - Website: `www.collagenmosaic.com`
  - Default Currency: **GHS** (Ghanaian Cedi)
- **Core Operations**:
  1. Corporate marketing and client acquisition.
  2. Event branding, wayfinding, and large-format advertising.
  3. Equipment rentals (telescopic flag poles, exhibition fixtures, lighting). Multi-day rentals calculate pricing via `quantity * days * unitPrice`.
  4. Sister-company dispatch: Collage acts as the client-facing acquisition and rental arm; print jobs are dispatched to sister company **PrintD Pigh**.

---

## 2. Technical Stack & Repository Structure

This repository is a **pnpm monorepo**:

```
Collat-Invoice-System/
├── artifacts/
│   ├── collat-erp/             # Main Frontend Web Application (Vite + React)
│   │   ├── src/
│   │   │   ├── assets/         # Bundled static assets (collage-logo.png)
│   │   │   ├── App.tsx         # Main application routes, shell, and views
│   │   │   ├── index.css       # Tailwind 4 design system tokens and micro-animations
│   │   │   └── vite-env.d.ts   # Vite client declaration types
│   │   ├── public/             # Static files (favicon.svg, collage-logo.png)
│   │   ├── vite.config.ts      # Vite configuration (runs on port 3009)
│   │   └── tsconfig.json       # Project TypeScript configuration
│   └── api-server/             # Backend REST API Server (Express 5 + Drizzle)
│       └── src/
│           ├── app.ts          # Express app with Helmet, Rate Limiting, and CORS
│           ├── middlewares/    # requireCollatAdmin, clerkProxyMiddleware
│           └── routes/         # clients, quotations, invoices, dashboard
├── attached_assets/            # Original source assets and reference invoice
│   ├── Collage_Logo_1792679183598.png
│   └── Invoice_No._00211026.01_TELESCOPIC_FLAG_PRINT_AND_POLE_RENTALS_1792679183599.pdf
├── lib/                        # Shared libraries
│   ├── api-client-react/       # Generated TanStack React Query hooks
│   ├── api-zod/                # Shared Zod validation schemas
│   └── db/                     # Drizzle ORM schema and database client
├── .agents/skills/             # Custom agent skills
│   └── security-audit-and-hardening/  # OWASP Top 10 & API hardening skill
└── PROJECT_CONTEXT.md          # This file (Must be updated after each major change)
```

---

## 3. Active Server Ports & Execution

- **Frontend Port**: **`3009`** (Strict host: `0.0.0.0`)
  - Command: `npx --yes pnpm --filter @workspace/collat-erp run dev`
  - Access URL: `http://localhost:3009/`
- **Backend API Server**: Runs on Express 5 with Clerk middleware and database connection.

---

## 4. UI/UX Rules & Design System

1. **Typography**:
   - Primary Sans: **`Plus Jakarta Sans`** (Google Fonts weights 400, 500, 600, 700, 800) for all headings, labels, and text.
   - Monospace: **`JetBrains Mono`** / **`IBM Plex Mono`** for financial figures, invoice numbers, and tabular data.
   - **Crucial Rule**: **No serif fonts** (like Times New Roman or Playfair) for application text.
2. **Color Palette**:
   - Primary Brand Accent: **Collage Crimson** (`#c61c2e` / `hsl(354 83% 43%)`).
   - Dark Surfaces: **Charcoal / Ink** (`#1a1b1f`, `#232227`).
   - Light Surfaces: Warm off-white (`#faf8f5`), clean white panels (`#ffffff`).
   - Borders: Subtle warm borders (`#e6dfd6`, `#eee8e0`).
3. **Logo Assets**:
   - Official Collage Logo is at `artifacts/collat-erp/src/assets/collage-logo.png` and `artifacts/collat-erp/public/collage-logo.png`.
   - Favicon vector reproduction is in `artifacts/collat-erp/public/favicon.svg`.
   - **Important**: In React components, always import the logo:
     ```tsx
     import collageLogo from './assets/collage-logo.png';
     <img src={collageLogo} alt="Collage · Creating Results" />
     ```
4. **Punctuation & Copy Rules**:
   - **No em dashes (`—`)**: Use middle dots (`·`), commas, or hyphens (`-`).
   - **No robotic AI filler**: Use clear, concise human language (e.g. "Create quote", "Issue invoice", "Record payment").
5. **Cognitive Laws Implemented**:
   - **Jakob's Law**: Clean 42px boxed form fields with vertical label alignment, familiar Lucide icons, and clear buttons. Never minimalist bottom-only underlines.
   - **Hick's Law**: Instant filter toggle tokens (chips) for quick 1-tap list filtering without nested dropdowns.
   - **Miller's Law**: Information chunked into 3-4 distinct cards (Clients, Proposals, Ghanaian Invoicing).
   - **Von Restorff Effect**: Highlighting the primary action button (`btn-primary` in `#c61c2e`).
   - **Proximity Law**: Tightly grouping related fields (client info, contact person, city) with distinct group margins.

---

## 5. Ghanaian Tax Calculation Standard

All quotation and invoice calculations strictly follow the statutory Ghanaian billing structure:

| Line Item | Formula / Rate | Description |
|-----------|----------------|-------------|
| **Line Total** | `quantity * days * unitPrice` | Supports multi-day rentals |
| **Subtotal** | `sum(Line Total)` | Total before discounts |
| **Discount** | `Subtotal * (discountPercent / 100)` | Optional discount |
| **Subtotal Before Tax** | `Subtotal - Discount` | Taxable baseline |
| **GETFund** | `2.5%` of Subtotal Before Tax | Ghana Education Trust Fund |
| **NHIL** | `2.5%` of Subtotal Before Tax | National Health Insurance Levy |
| **VAT** | `15.0%` of Subtotal Before Tax | Value Added Tax |
| **Total Amount Due** | `Subtotal Before Tax + GETFund + NHIL + VAT` | Displayed with solid black highlight |

---

## 6. Security & Hardening Checklist

- **Secrets in Git**: `.gitignore` strictly protects `.env`, `.env.*`, `*.pem`, `*.key`, `*.cert`.
- **Security Headers**: `helmet` is installed and active on the API server, protecting against clickjacking, MIME-sniffing, and XSS.
- **Rate Limiting**: `express-rate-limit` is active on `/api` routes (500 requests per 15-minute window per IP).
- **Authentication**: Managed via Clerk with session token validation.
- **Authorization**: `requireCollatAdmin` middleware checks user role in the `staff_members` table.
- **Database Safety**: Drizzle ORM ensures all database queries are fully parameterized (OWASP A03 SQL Injection defense).
- **Payload Limits**: `express.json({ limit: "1mb" })` protects against memory exhaustion attacks.
- **Security Skill Reference**: `.agents/skills/security-audit-and-hardening/SKILL.md`.

---

## 7. Change Log & History

- **2026-10-22**:
  - Resolved `vite/client` TypeScript compilation error.
  - Set host port to **`3009`** across `vite.config.ts` and `package.json`.
  - Copied official Collage Logo from `attached_assets` to `src/assets/collage-logo.png` and `public/collage-logo.png`.
  - Replaced placeholder favicon with vector SVG matching Collage's circular "C" target mark.
  - Aligned invoice document template with authentic sample (`Invoice No. 00211026.01`).
  - Switched font system from serif fallback to modern **`Plus Jakarta Sans`** and **`JetBrains Mono`**.
  - Redesigned landing page with micro-interactions, float animations, and 3-pillar breakdown.
  - Removed all em dashes (`—`) across the codebase.
  - Added toggle tokens for quick status filtering on documents and clients.
  - Hardened API server with Helmet headers, rate limiting, and CORS whitelist.
  - Created `.agents/skills/security-audit-and-hardening/SKILL.md` and `PROJECT_CONTEXT.md`.
  - Configured `.vscode/settings.json` to resolve Tailwind CSS v4 `@plugin`, `@custom-variant`, `@theme`, `@apply` lint warnings.
  - Added `.env.example` template with `DATABASE_URL` instructions for live database connection.
  - Auth flow fixed: when `VITE_CLERK_PUBLISHABLE_KEY` is absent, landing page and sign-in screen show a "Dev mode active" banner; all CTAs bypass Clerk and go directly to `/dashboard`.
  - Fixed `<Show>` missing `when` prop Clerk type error -- removed the redundant wrapper, `<SignIn>` now renders directly inside the `hasClerk` branch.

- **2026-10-22 (Landing page UI/UX refinement)**:
  - **Header**: Converted to `sticky` with `backdrop-blur-md` translucent treatment. Cleaner nav: "Sign in" (quiet), "Create account" (primary) when Clerk is active; "Open desk" (secondary) in dev mode.
  - **Hero copy**: Updated supporting copy to "Manage clients, branding projects, equipment rentals and payments from one connected workspace. Built for the way Collat operates in Ghana." Preserved headline "From first brief to paid in full."
  - **Headline**: Responsive sizing (`40px` mobile, `50px` tablet, `58px` desktop). Controlled line break with `<br className="hidden sm:block"/>` to prevent orphaned words.
  - **Staggered entrance**: Hero left column animates with `fadeIn` on eyebrow, `slideInUp delay-75` on h1, `slideInUp delay-150` on copy, `slideInUp delay-200` on CTAs, `fadeIn delay-300` on trust line.
  - **Operations preview card**: Upgraded from 3 generic rows to 4 realistic, semantically distinct activities with individual Lucide icons:
    1. Branding project (BriefcaseBusiness) -- "PENDING" amber chip
    2. Equipment rental booking (CalendarDays) -- "RENTAL" warm chip
    3. Production work order dispatched to sister company (Wrench) -- "IN PROD" blue chip
    4. Outstanding invoice (CircleDollarSign) -- "PART PAID" gold chip
  - **Pipeline widget**: Added `TrendingUp` indicator, split progress bar labels ("GHS 10,610 collected / GHS 4,126 outstanding"), gradient progress bar.
  - **Scroll-reveal features section**: `useScrollReveal()` hook uses `IntersectionObserver` to trigger opacity/translateY transition on each feature card when it enters viewport. Staggered per-card `transitionDelay`.
  - **CSS**: Added `delay-400`, `delay-500` utilities; slowed `floatSubtle` to 5s; added `.reveal` / `.reveal.is-visible` CSS pair.
  - **`PREVIEW_ITEMS` constant**: Extracted to module-level `as const` array for type safety and maintainability.
  - **Footer**: Tightened padding and colour.
  - **TypeScript**: All checks pass (`tsc --noEmit` exit code 0). No regressions in routing, shell, invoice, client, or quotation views.
  - **Git**: Committed and pushed to `https://github.com/Kwesikendy/collage.git` (`main` branch, commit `b74e148`).
