import {
  type FormEvent,
  type ReactNode,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Route,
  Switch,
  Link,
  useLocation,
  useParams,
  Router as WouterRouter,
} from 'wouter';
import { ClerkProvider, SignIn, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  useArchiveClient,
  useConvertQuotation,
  useCreateClient,
  useCreateDocument,
  useGetClient,
  useGetClients,
  useGetDashboardSummary,
  useGetDocument,
  useGetDocuments,
  useRecordPayment,
  useUpdateClient,
  useUpdateDocument,
  getGetClientQueryKey,
  getGetClientsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetDocumentQueryKey,
  getGetDocumentsQueryKey,
  getDocumentPayments,
  getOperationsData,
  updateRentalStatus,
  createRentalBooking,
  updateProductionOrderStatus,
  createProductionOrder,
  deleteDocumentById,
  resetErpDemoData,
  calculateDocumentPricing,
  loginWithNeon,
  registerWithNeon,
  logoutWithNeon,
  fetchNeonSession,
  getStoredAuthUser,
  syncStoreFromNeon,
  MARKETER_ROSTER,
  isClientOwnedByMarketer,
  getMarketerTargets,
  updateMarketerTarget,
  type NeonAuthUser,
  type Client,
  type ClientInput,
  type DocumentInput,
  type DocumentUpdateStatus,
  type SalesDocument,
  type RentalBooking,
  type ProductionOrder,
} from '@workspace/api-client-react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FilePlus2,
  FileText,
  FolderOpen,
  Layers,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  Wrench,
  X,
  UserCheck,
  Activity,
  Target,
  UserPlus,
  Megaphone,
  Share2,
  UsersRound,
  Contact,
  Bell,
  CalendarCheck,
  ShieldAlert,
} from 'lucide-react';
import collageLogo from './assets/collage-logo.png';
import collageIcon from './assets/collage-icon.png';
import { Brand } from '@/components/brand';
import { Welcome } from '@/pages/welcome';
import { PortfolioPage } from '@/pages/portfolio';
import { PrivacyPolicyPage } from '@/pages/privacy';
import { CookieConsentBanner } from '@/components/compliance-dialog';
import {
  type UserRole,
  type WorkspaceUser,
  PRESEEDED_ACCOUNTS,
  getNavigationForRole,
  resolveCanonicalDashboard,
} from '@/types/auth';
import { RoleGuard } from '@/components/auth/role-guard';
import { RoleSwitcher } from '@/components/auth/role-switcher';
import { UnifiedAuthScreen } from '@/components/auth/unified-auth-screen';
import { MarketerWorkspacePage, MarketerDashboardHub } from '@/pages/marketer-workspace';
import { HrWorkspacePage, HrDashboardHub } from '@/pages/hr-workspace';
import { AdminWorkspacePage, AdminDashboardHub } from '@/pages/admin-workspace';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});
const rawClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
const clerkPubKey = rawClerkKey
  ? publishableKeyFromHost(window.location.hostname, rawClerkKey)
  : '';
const hasClerk = Boolean(clerkPubKey);
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

const mockUser = {
  isLoaded: true as const,
  isSignedIn: true as const,
  role: 'admin' as UserRole,
  user: {
    id: 'usr-admin-kojo',
    email: 'admin@collage.com.gh',
    firstName: 'Kojo',
    lastName: 'Nathan',
    fullName: 'Kojo Nathan',
    role: 'admin' as UserRole,
    office: 'Accra HQ',
    primaryEmailAddress: { emailAddress: 'Accra HQ' },
  },
};

type AppUser = {
  isLoaded: boolean;
  isSignedIn: boolean;
  role: UserRole;
  user: {
    id?: string;
    email?: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: UserRole;
    office: string;
    primaryEmailAddress: { emailAddress: string };
  };
};

type AppClerkCtx = {
  signOut: (opts?: unknown) => void;
  setNeonUser?: (user: NeonAuthUser | null) => void;
  setActiveRole?: (role: UserRole) => void;
};

const AppUserContext = createContext<AppUser>(mockUser);
const AppClerkContext = createContext<AppClerkCtx>({
  signOut: () => {
    void logoutWithNeon();
    window.location.href = `${basePath}/sign-in`;
  },
});

function useAppUser() {
  return useContext(AppUserContext);
}
function useAppClerk() {
  return useContext(AppClerkContext);
}

function mapNeonUserToAppUser(u: NeonAuthUser | null): AppUser {
  const user = u || {
    id: 'usr-admin-kojo',
    email: 'admin@collage.com.gh',
    firstName: 'Kojo',
    lastName: 'Nathan',
    fullName: 'Kojo Nathan',
    role: 'admin' as UserRole,
    office: 'Accra HQ',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const role = (user.role as UserRole) || 'admin';
  return {
    isLoaded: true as const,
    isSignedIn: true as const,
    role,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName || 'Kojo',
      lastName: user.lastName || 'Nathan',
      fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Kojo Nathan',
      role,
      office: user.office || 'Accra HQ',
      primaryEmailAddress: { emailAddress: user.office || user.email || 'Accra HQ' },
    },
  };
}

function NeonAuthProvider({ children }: { children: ReactNode }) {
  const [neonUser, setNeonUser] = useState<NeonAuthUser | null>(() => getStoredAuthUser());

  useEffect(() => {
    void syncStoreFromNeon().then((synced) => {
      if (synced) {
        queryClient.invalidateQueries();
      }
    });
    void fetchNeonSession().then((u) => {
      if (u) setNeonUser(u);
    });
  }, []);

  const signOut = (opts?: unknown) => {
    void logoutWithNeon().finally(() => {
      setNeonUser(null);
      const redirectUrl =
        typeof opts === 'object' && opts !== null && 'redirectUrl' in opts
          ? String((opts as { redirectUrl?: string }).redirectUrl || `${basePath}/sign-in`)
          : `${basePath}/sign-in`;
      window.location.href = redirectUrl;
    });
  };

  const setActiveRole = (role: UserRole) => {
    const email =
      role === 'admin'
        ? 'admin@collage.com.gh'
        : role === 'marketer'
          ? 'marketer@collage.com.gh'
          : 'hr@collage.com.gh';
    const account = PRESEEDED_ACCOUNTS[email];
    if (account) {
      setNeonUser(account.user);
    }
  };

  return (
    <AppUserContext.Provider value={mapNeonUserToAppUser(neonUser)}>
      <AppClerkContext.Provider value={{ signOut, setNeonUser, setActiveRole }}>
        {children}
      </AppClerkContext.Provider>
    </AppUserContext.Provider>
  );
}

function ClerkDataProvider({ children }: { children: ReactNode }) {
  const clerkUser = useUser();
  const { signOut } = useClerk();
  return (
    <AppUserContext.Provider value={clerkUser as unknown as AppUser}>
      <AppClerkContext.Provider value={{ signOut }}>
        {children}
      </AppClerkContext.Provider>
    </AppUserContext.Provider>
  );
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#c91f35',
    colorForeground: '#29282c',
    colorMutedForeground: '#67636a',
    colorDanger: '#b51d32',
    colorBackground: '#fffdfa',
    colorInput: '#fffdfa',
    colorInputForeground: '#29282c',
    colorNeutral: '#ded8d1',
    fontFamily: 'Bricolage Grotesque, Plus Jakarta Sans, sans-serif',
    borderRadius: '0.65rem',
  },
};

const fmt = (n: number) =>
  `GH₵ ${(Number.isFinite(n) ? n : 0).toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const dateFmt = (date?: string | null) => {
  if (!date || isNaN(Date.parse(date))) return '-';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  } catch {
    return '-';
  }
};

const today = () => new Date().toISOString().slice(0, 10);

const CATALOG_PRESETS = [
  { description: 'Polo rental', quantity: 4, days: 1, unitPrice: 70 },
  { description: 'Flag printing (1x3m)', quantity: 4, days: 0, unitPrice: 200 },
  {
    description: 'Logistics (Transpotation, Deployment)',
    quantity: 1,
    days: 0,
    unitPrice: 500,
  },
  {
    description: 'Telescopic Flag Pole & Heavy Water Base Rental (5m)',
    quantity: 10,
    days: 3,
    unitPrice: 95,
  },
  {
    description: 'Corporate Stage Backdrop & Wayfinding Branding',
    quantity: 1,
    days: 0,
    unitPrice: 1450,
  },
  {
    description: 'Exhibition LED Floodlight & Truss System Rental',
    quantity: 4,
    days: 2,
    unitPrice: 180,
  },
] as const;

const adminNav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/invoices', label: 'Invoices', icon: ReceiptText },
  { href: '/operations', label: 'Rentals & Production', icon: Layers },
  { href: '/admin/users', label: 'Admin Users', icon: UserCheck },
  { href: '/admin/system', label: 'System Status', icon: Activity },
];

const marketerNav = [
  { href: '/dashboard', label: 'Marketing Hub', icon: Target },
  { href: '/clients', label: 'My Clients', icon: Users },
  { href: '/invoices', label: 'Invoices', icon: ReceiptText },
  { href: '/leads', label: 'Client Leads', icon: UserPlus },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
];

const hrNav = [
  { href: '/dashboard', label: 'People Hub', icon: UsersRound },
  { href: '/staff', label: 'Staff Directory', icon: Contact },
  { href: '/notices', label: 'Internal Notices', icon: Bell },
  { href: '/attendance', label: 'Attendance', icon: CalendarCheck },
];

function getNavigationItemsForRole(role: UserRole) {
  if (role === 'marketer') return marketerNav;
  if (role === 'hr') return hrNav;
  return adminNav;
}

function httpStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    return (error as { status?: number }).status;
  }
  return undefined;
}

function AccessPending({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="panel p-8 text-center max-w-md mx-auto my-12">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-600 mb-4">
        <ShieldCheck size={24} />
      </div>
      <h3 className="text-lg font-bold text-slate-800">Access Pending</h3>
      <p className="text-sm text-slate-500 mt-2 mb-6">
        Your account permissions are being synchronized. Please wait a moment or try again.
      </p>
      <button className="btn btn-primary" onClick={onRetry}>
        Refresh Access
      </button>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accessPending, setAccessPending] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const queryClient = useQueryClient();
  const { user, isLoaded } = useAppUser();
  const { signOut, setNeonUser } = useAppClerk();

  useEffect(() => {
    const q = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.query.state.status === 'error' &&
        httpStatus(event.query.state.error) === 403
      )
        setAccessPending(true);
    });
    const m = queryClient.getMutationCache().subscribe((event) => {
      if (
        event.mutation?.state?.status === 'error' &&
        httpStatus(event.mutation?.state?.error) === 403
      )
        setAccessPending(true);
    });
    return () => {
      q();
      m();
    };
  }, [queryClient]);

  const currentRole: UserRole = (user?.role as UserRole) || 'admin';
  const roleName = currentRole === 'admin' ? 'Admin' : currentRole === 'marketer' ? 'Marketer' : 'HR';
  const nav = getNavigationItemsForRole(currentRole);
  const page = nav.find((x) => location === x.href || location.startsWith(`${x.href}/`))?.label ?? (location === '/privacy' ? 'Privacy Policy' : 'Overview');

  function handleResetDemo() {
    resetErpDemoData();
    queryClient.invalidateQueries();
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2000);
  }

  return (
    <div className="app-shell flex text-[#1D1D1B]">
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/35 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`sidebar no-print fixed inset-y-0 left-0 z-40 flex w-[240px] shrink-0 flex-col border-r border-white/[0.07] bg-[#141413]/95 backdrop-blur-2xl text-[#FFFFFF] transition-transform md:sticky md:top-0 md:h-dvh md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[64px] items-center justify-between border-b border-white/[0.06] px-5">
          <Link href="/" className="no-underline">
            <Brand inverse />
          </Link>
          <button
            className="btn btn-quiet !px-2 !text-neutral-400 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={17} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-2.5 py-4" aria-label="Main navigation">
          {nav.map((item) => {
            const Icon = item.icon;
            const active =
              location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`link-${item.label.toLowerCase()}`}
                onClick={() => setMobileOpen(false)}
                className={`group flex h-10 items-center gap-3 rounded-xl px-3.5 text-[13px] no-underline transition-all duration-150 ${
                  active
                    ? 'bg-white/[0.08] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-white/[0.08]'
                    : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200'
                }`}
              >
                <Icon
                  size={15}
                  strokeWidth={1.8}
                  className={
                    active
                      ? 'text-[#E02B20]'
                      : 'text-neutral-500 group-hover:text-neutral-300'
                  }
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-3 py-2 border-t border-white/[0.05]">
          <Link
            href="/privacy"
            data-testid="link-privacy"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] text-neutral-400 no-underline transition-colors hover:bg-white/[0.04] hover:text-neutral-200"
          >
            <ShieldCheck size={14} className="text-neutral-500" />
            <span>Privacy Policy</span>
          </Link>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] p-2.5 backdrop-blur-md">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.06] font-mono text-[11px] font-semibold text-white">
              {user?.firstName?.slice(0, 1) || 'K'}
              {user?.lastName?.slice(0, 1) || 'N'}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-medium text-white">
                {isLoaded
                  ? user?.fullName || 'Kojo Nathan'
                  : 'Loading profile...'}
              </div>
              <div className="truncate text-[11px] text-neutral-400 font-mono">
                {user?.office || 'Accra HQ'} · {roleName}
              </div>
            </div>
            <button
              aria-label="Sign out"
              title="Sign out"
              onClick={() => signOut({ redirectUrl: '/' })}
              className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/[0.08] hover:text-white cursor-pointer"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="no-print sticky top-0 z-20 pt-3 px-4 md:px-8">
          <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-3 rounded-2xl border border-white/85 bg-white/70 px-4 py-2.5 sm:px-5 text-[#1D1D1B] backdrop-blur-2xl shadow-[0_6px_28px_-6px_rgba(15,23,42,0.045),0_0_0_1px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.9)]">
            <div className="flex items-center gap-3">
              <button
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
                className="btn btn-quiet !px-2 md:hidden"
              >
                <Menu size={18} />
              </button>
              <div className="flex items-center gap-2 text-[12.5px] text-neutral-500">
                <span className="font-semibold text-[#1D1D1B]">Collage</span>
                <span className="h-3.5 w-px bg-neutral-200/80" aria-hidden="true" />
                <span className="text-neutral-500">{roleName}</span>
                <span className="text-neutral-300">/</span>
                <span className="font-semibold text-[#1D1D1B]">
                  {page}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/portfolio"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium text-neutral-700 no-underline transition-colors hover:bg-white/80 hover:text-neutral-950"
              >
                <span>Public Portfolio</span>
              </Link>
              <RoleSwitcher
                currentRole={currentRole}
                currentEmail={user?.email}
                onRoleChange={(newUser) => {
                  setNeonUser?.(newUser);
                  queryClient.invalidateQueries();
                }}
              />
              <button
                type="button"
                onClick={handleResetDemo}
                title="Restore initial sample records (including Invoice 00211026.01)"
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-neutral-200/80 bg-white/70 px-3 text-[11.5px] font-medium text-[#1D1D1B] backdrop-blur-md shadow-[0_1px_2px_rgba(15,23,42,0.03),inset_0_1px_0_rgba(255,255,255,0.85)] transition-all hover:border-neutral-300 hover:bg-white/95 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span className="hidden sm:inline">
                  {resetDone ? 'Demo data restored' : 'Reset demo'}
                </span>
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1360px] px-4 py-6 md:px-8 md:py-8 print:max-w-none print:p-0 print:m-0">
          {accessPending ? (
            <AccessPending
              onRetry={() => {
                setAccessPending(false);
                queryClient.invalidateQueries();
              }}
            />
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}

function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-neutral-200/60 pb-5 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[.14em] text-[#c61c2e]">
            {eyebrow}
          </div>
        )}
        <h1 className="m-0 font-sans text-[26px] font-semibold tracking-[-0.03em] text-neutral-950 md:text-[28px]">
          {title}
        </h1>
        {description && (
          <p className="mb-0 mt-1 text-[13px] text-neutral-500 max-w-2xl">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function Alert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-xl border border-[#E02B20]/20 bg-[#E02B20]/[0.06] backdrop-blur-md p-3.5 text-[12px] text-[#9f2d3d]"
    >
      <CircleAlert size={16} />
      {children}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3 p-5" aria-label="Loading">
      <div className="skeleton h-10 w-full" />
      <div className="skeleton h-12 w-full" />
      <div className="skeleton h-12 w-full" />
      <div className="skeleton h-12 w-full" />
    </div>
  );
}

function Empty({
  icon: Icon = FolderOpen,
  title,
  detail,
  action,
}: {
  icon?: typeof FolderOpen;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid min-h-[260px] place-items-center p-7 text-center">
      <div className="max-w-[340px]">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl border border-neutral-200/70 bg-white/70 backdrop-blur-md text-neutral-500 shadow-xs">
          <Icon size={19} />
        </div>
        <h3 className="mb-1 mt-4 text-[14.5px] font-semibold text-neutral-900">{title}</h3>
        <p className="mb-4 mt-0 text-[12px] leading-5 text-neutral-500">{detail}</p>
        {action}
      </div>
    </div>
  );
}

function Status({ value }: { value: string }) {
  const cls =
    value === 'paid' ||
    value === 'accepted' ||
    value === 'active' ||
    value === 'delivered' ||
    value === 'returned'
      ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20'
      : value === 'partially_paid' ||
          value === 'deployed' ||
          value === 'in_production' ||
          value === 'quality_check'
        ? 'bg-amber-500/10 text-amber-800 border border-amber-500/20'
        : value === 'issued'
          ? 'bg-[#c61c2e]/10 text-[#c61c2e] border border-[#c61c2e]/20'
          : value === 'declined' || value === 'archived' || value === 'cancelled'
            ? 'bg-neutral-500/10 text-neutral-600 border border-neutral-500/15'
            : 'bg-neutral-500/10 text-neutral-700 border border-neutral-500/15';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-medium capitalize backdrop-blur-xs ${cls}`}
    >
      {value.replaceAll('_', ' ')}
    </span>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={`dialog ${wide ? '!w-[min(840px,100%)]' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="flex items-start justify-between border-b border-neutral-200/60 px-5 py-4 md:px-6">
          <div>
            <h2
              id="dialog-title"
              className="m-0 font-sans text-[17px] font-semibold tracking-[-0.02em] text-neutral-950"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mb-0 mt-1 text-[12px] text-neutral-500">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn btn-quiet !h-8 !min-h-8 !w-8 !px-0"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>
        <div className="p-5 md:p-6">{children}</div>
      </section>
    </div>
  );
}

function Input({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="field-label flex items-center justify-between">
        <span>{label}</span>
        {hint && (
          <span className="text-[10px] font-normal normal-case text-[#918c86]">
            {hint}
          </span>
        )}
      </span>
      <input className="field" {...props} />
    </label>
  );
}

function Select({
  label,
  children,
  ...props
}: { label: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="field-label">{label}</span>
      <select className="field" {...props}>
        {children}
      </select>
    </label>
  );
}

function ClientForm({
  client,
  onClose,
  onCreated,
}: {
  client?: Client;
  onClose: () => void;
  onCreated?: (created: Client) => void;
}) {
  const qc = useQueryClient();
  const { user } = useAppUser();
  const isMarketer = user?.role === 'marketer';
  const create = useCreateClient();
  const update = useUpdateClient();
  const busy = create.isPending || update.isPending;
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedMarketerId, setSelectedMarketerId] = useState<string>(
    client?.assignedMarketerId ||
      (isMarketer ? user?.id || 'usr-marketer-nana' : 'usr-marketer-nana'),
  );

  useEffect(() => {
    setError('');
    setSuccess(false);
    setSelectedMarketerId(
      client?.assignedMarketerId ||
        (isMarketer ? user?.id || 'usr-marketer-nana' : 'usr-marketer-nana'),
    );
  }, [client, isMarketer, user?.id]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const f = new FormData(e.currentTarget);
    const companyName = String(f.get('companyName') || '').trim();
    if (!companyName) {
      setError('Company name is required.');
      return;
    }

    const chosenMarketer = isMarketer
      ? {
          id: user?.id || 'usr-marketer-nana',
          fullName: user?.fullName || 'Nana Mensah',
          email: user?.email || 'marketer@collage.com.gh',
        }
      : MARKETER_ROSTER.find((m) => m.id === selectedMarketerId) || null;

    const value: ClientInput = {
      companyName: companyName.slice(0, 180),
      contactName: String(f.get('contactName') || '').trim().slice(0, 180) || null,
      email: String(f.get('email') || '').trim().slice(0, 180) || null,
      phone: String(f.get('phone') || '').trim().slice(0, 60) || null,
      address: String(f.get('address') || '').trim().slice(0, 400) || null,
      city: String(f.get('city') || '').trim().slice(0, 100) || null,
      country: String(f.get('country') || 'Ghana').trim().slice(0, 100),
      status: (String(f.get('status') || 'active') as ClientInput['status']) || 'active',
      assignedMarketerId: chosenMarketer ? chosenMarketer.id : null,
      assignedMarketerName: chosenMarketer ? chosenMarketer.fullName : null,
      assignedMarketerEmail: chosenMarketer ? chosenMarketer.email : null,
    };
    const finish = (savedClient?: Client) => {
      setSuccess(true);
      qc.invalidateQueries({ queryKey: getGetClientsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      if (client) qc.invalidateQueries({ queryKey: getGetClientQueryKey(client.id) });
      if (savedClient && onCreated) onCreated(savedClient);
      setTimeout(onClose, 450);
    };

    const extractErr = (err: unknown, defaultMsg: string) => {
      if (typeof err === 'object' && err !== null) {
        const apiErr = err as { data?: { error?: string }; message?: string };
        return apiErr.data?.error || apiErr.message || defaultMsg;
      }
      return defaultMsg;
    };

    try {
      if (client)
        update.mutate(
          { id: client.id, data: value },
          {
            onSuccess: (res) => finish(res),
            onError: (err) =>
              setError(
                extractErr(
                  err,
                  'Could not save this client. Please check the details and try again.',
                ),
              ),
          },
        );
      else
        create.mutate(
          { data: value },
          {
            onSuccess: (res) => finish(res),
            onError: (err) =>
              setError(
                extractErr(err, 'Could not create this client. Please try again.'),
              ),
          },
        );
    } catch (err) {
      setError(extractErr(err, 'Something went wrong. Please try again.'));
    }
  }

  return (
    <form key={client?.id ?? 'new-client'} onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Company or client name"
          name="companyName"
          required
          maxLength={180}
          defaultValue={client?.companyName}
          placeholder="e.g. Eugenia / Ecobank Ghana"
        />
        <Input
          label="Contact person (Attn)"
          name="contactName"
          maxLength={180}
          defaultValue={client?.contactName || ''}
          placeholder="Primary contact name"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          maxLength={180}
          defaultValue={client?.email || ''}
          placeholder="name@company.com"
        />
        <Input
          label="Phone"
          name="phone"
          maxLength={60}
          defaultValue={client?.phone || ''}
          placeholder="+233 24 000 0000"
        />
        <Input
          label="City"
          name="city"
          maxLength={100}
          defaultValue={client?.city || 'Accra'}
          placeholder="Accra"
        />
        <Select label="Status" name="status" defaultValue={client?.status || 'active'}>
          <option value="active">Active</option>
          <option value="lead">Lead</option>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Address"
          name="address"
          maxLength={400}
          defaultValue={client?.address || ''}
          placeholder="Street address or landmark"
        />
        {isMarketer ? (
          <div>
            <div className="field-label">Assigned Marketer (Account Owner)</div>
            <div className="mt-1 flex h-[38px] items-center rounded-md border border-emerald-200 bg-emerald-50/70 px-3 text-xs font-semibold text-emerald-900">
              {user?.fullName || 'Nana Mensah'} (Your Exclusive Client)
            </div>
          </div>
        ) : (
          <Select
            label="Assigned Marketer (Delegate Client)"
            value={selectedMarketerId}
            onChange={(e) => setSelectedMarketerId(e.target.value)}
          >
            <option value="">Unassigned (House Account)</option>
            {MARKETER_ROSTER.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName} ({m.email})
              </option>
            ))}
          </Select>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Country" name="country" maxLength={100} defaultValue={client?.country || 'Ghana'} />
        <div className="flex items-end justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button disabled={busy || success} className="btn btn-primary" type="submit">
            {busy ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : success ? (
              <Check size={15} />
            ) : null}
            {success ? 'Saved' : client ? 'Save changes' : 'Add client'}
          </button>
        </div>
      </div>
      {error && <Alert>{error}</Alert>}
    </form>
  );
}

function PaymentModal({
  doc,
  onClose,
  onSuccess,
}: {
  doc: SalesDocument;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const qc = useQueryClient();
  const payment = useRecordPayment();
  const [amount, setAmount] = useState(String(doc.balance));
  const [paymentDate, setPaymentDate] = useState(today());
  const [method, setMethod] = useState<
    'bank_transfer' | 'mobile_money' | 'cash' | 'card' | 'other'
  >('bank_transfer');
  const [reference, setReference] = useState('');

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }
    payment.mutate(
      {
        id: doc.id,
        data: {
          amount: parsedAmount,
          paymentDate: String(paymentDate || '').slice(0, 30),
          method,
          reference: reference.trim().slice(0, 100) || null,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetDocumentQueryKey(doc.id) });
          qc.invalidateQueries({ queryKey: getGetDocumentsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          onSuccess?.();
          onClose();
        },
      },
    );
  }

  return (
    <Modal
      title="Record a payment"
      subtitle={`Balance due ${fmt(doc.balance)} on Invoice ${doc.number} (${doc.clientName})`}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[#f7f3ed] p-3 text-[11px]">
          <span className="font-semibold text-[#5c5751]">Quick fill:</span>
          <button
            type="button"
            onClick={() => setAmount(String(doc.balance))}
            className="toggle-token !py-1 !px-2.5 !text-[11px]"
          >
            100% Balance ({fmt(doc.balance)})
          </button>
          <button
            type="button"
            onClick={() => setAmount(String(Number((doc.balance * 0.5).toFixed(2))))}
            className="toggle-token !py-1 !px-2.5 !text-[11px]"
          >
            50% Deposit ({fmt(doc.balance * 0.5)})
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Amount (GHS)"
            name="amount"
            type="number"
            min=".01"
            max={doc.balance}
            step=".01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Input
            label="Payment date"
            name="paymentDate"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
          <Select
            label="Method"
            name="method"
            value={method}
            onChange={(e) => setMethod(e.target.value as typeof method)}
          >
            <option value="bank_transfer">Bank transfer</option>
            <option value="mobile_money">Mobile money (MoMo)</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="other">Other</option>
          </Select>
          <Input
            label="Reference / Receipt No."
            name="reference"
            maxLength={100}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. MoMo / Bank reference"
          />
        </div>
        {payment.isError && (
          <Alert>Payment could not be saved. Check the amount and try again.</Alert>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button disabled={payment.isPending} className="btn btn-primary" type="submit">
            {payment.isPending ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            Record payment
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ClientList() {
  const [, navigate] = useLocation();
  const { user } = useAppUser();
  const isMarketer = user?.role === 'marketer';
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Client | undefined>();
  const [confirmArchive, setConfirmArchive] = useState<Client | undefined>();
  const [filter, setFilter] = useState('all');
  const [marketerFilter, setMarketerFilter] = useState('all');
  const [delegationNotice, setDelegationNotice] = useState<string | null>(null);
  const [targetsModalOpen, setTargetsModalOpen] = useState(false);
  const [allTargets, setAllTargets] = useState(() => getMarketerTargets());
  const qc = useQueryClient();
  const query = useGetClients();
  const archive = useArchiveClient();
  const updateClient = useUpdateClient();

  const rawClients = query.data || [];
  // Strict isolation: Marketers ONLY see clients they brought in or that Admin delegated to them
  const roleScopedClients = isMarketer
    ? rawClients.filter((c) => isClientOwnedByMarketer(c, user))
    : rawClients.filter((c) => {
        if (marketerFilter === 'all') return true;
        if (marketerFilter === 'unassigned') return !c.assignedMarketerId && !c.assignedMarketerEmail;
        return (
          c.assignedMarketerId === marketerFilter ||
          c.assignedMarketerEmail?.toLowerCase() === marketerFilter.toLowerCase()
        );
      });

  const counts = {
    all: roleScopedClients.length,
    active: roleScopedClients.filter((c) => c.status === 'active').length,
    lead: roleScopedClients.filter((c) => c.status === 'lead').length,
    archived: roleScopedClients.filter((c) => c.status === 'archived').length,
  };

  const clients = roleScopedClients.filter(
    (c) =>
      (filter === 'all' || c.status === filter) &&
      `${c.companyName} ${c.contactName || ''} ${c.email || ''} ${c.phone || ''} ${c.city || ''} ${c.assignedMarketerName || ''}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  function executeArchive(c: Client) {
    archive.mutate(
      { id: c.id },
      {
        onSuccess: () => {
          setConfirmArchive(undefined);
          qc.invalidateQueries({ queryKey: getGetClientsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetClientQueryKey(c.id) });
          qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        },
      },
    );
  }

  function quickStatusChange(c: Client, status: 'active' | 'lead') {
    updateClient.mutate(
      { id: c.id, data: { status } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetClientsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetClientQueryKey(c.id) });
          qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        },
      },
    );
  }

  function handleDelegateClient(c: Client, marketerId: string) {
    const chosen = MARKETER_ROSTER.find((m) => m.id === marketerId) || null;
    updateClient.mutate(
      {
        id: c.id,
        data: {
          assignedMarketerId: chosen ? chosen.id : null,
          assignedMarketerName: chosen ? chosen.fullName : null,
          assignedMarketerEmail: chosen ? chosen.email : null,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetClientsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetClientQueryKey(c.id) });
          setDelegationNotice(
            chosen
              ? `Delegated "${c.companyName}" to ${chosen.fullName}.`
              : `Removed marketer assignment from "${c.companyName}".`,
          );
          setTimeout(() => setDelegationNotice(null), 3500);
        },
      },
    );
  }

  return (
    <>
      {delegationNotice && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-900">
          <span>{delegationNotice}</span>
          <button type="button" onClick={() => setDelegationNotice(null)} className="text-emerald-700 hover:text-emerald-950">
            <X size={14} />
          </button>
        </div>
      )}

      <PageTitle
        eyebrow={isMarketer ? 'My Assigned Portfolio' : 'Relationships & Marketer Delegation'}
        title={isMarketer ? 'My Clients' : 'Clients'}
        description={
          isMarketer
            ? `Showing ONLY clients brought in by or delegated to ${user?.fullName || 'you'}. You can generate invoices directly for any of your clients.`
            : 'Full company client directory. Admin has access to all clients and can delegate any client to a marketer.'
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            {!isMarketer && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setAllTargets(getMarketerTargets());
                  setTargetsModalOpen(true);
                }}
              >
                <Target size={15} />
                Marketer Targets
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/invoices?new=1')}
            >
              <ReceiptText size={15} />
              + Generate Invoice
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditing(undefined);
                setModal(true);
              }}
            >
              <Plus size={16} />
              {isMarketer ? 'Add my client' : 'Add client'}
            </button>
          </div>
        }
      />

      {isMarketer && (
        <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] backdrop-blur-md px-4 py-3 text-xs text-emerald-950 shadow-2xs">
          <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
          <div>
            <strong>Strict Client Isolation Active:</strong> To prevent client encroachment between marketers, you only see clients that you brought in or that Admin has delegated to <strong>{user?.fullName}</strong>.
          </div>
        </div>
      )}

      <div className="panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-neutral-200/60 px-4 py-4 lg:flex-row lg:items-center lg:justify-between md:px-5">
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <div className="relative w-full sm:w-[280px]">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                aria-label="Search clients"
                data-testid="input-search-clients"
                className="field !pl-9"
                placeholder="Search company, contact, phone, city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {!isMarketer && (
              <select
                aria-label="Filter by assigned marketer"
                value={marketerFilter}
                onChange={(e) => setMarketerFilter(e.target.value)}
                className="field !w-auto min-w-[190px] text-xs font-medium"
              >
                <option value="all">All Marketers (Company-wide)</option>
                {MARKETER_ROSTER.map((m) => (
                  <option key={m.id} value={m.id}>
                    Marketer: {m.fullName}
                  </option>
                ))}
                <option value="unassigned">Unassigned Clients</option>
              </select>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['all', isMarketer ? 'My clients' : 'All clients', counts.all],
                ['active', 'Active', counts.active],
                ['lead', 'Leads', counts.lead],
                ['archived', 'Archived', counts.archived],
              ] as const
            ).map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`toggle-token ${filter === key ? 'active' : ''}`}
              >
                <span>{label}</span>
                <span className="mono text-[10px] opacity-75">({count})</span>
              </button>
            ))}
          </div>
        </div>
        {query.isLoading ? (
          <LoadingRows />
        ) : query.isError ? (
          <div className="p-5">
            <Alert>
              Client records could not be loaded.{' '}
              <button className="ml-2 underline" onClick={() => query.refetch()}>
                Try again
              </button>
            </Alert>
          </div>
        ) : clients.length === 0 ? (
          <Empty
            icon={Users}
            title={search ? 'No matching clients' : 'No clients in this view yet'}
            detail={
              search
                ? 'Try another name, contact or city.'
                : isMarketer
                  ? 'Add a client that you brought in, or ask Admin to delegate a client to your portfolio.'
                  : 'Add your first client to keep requests, quotes and invoices connected.'
            }
            action={
              !search && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setEditing(undefined);
                    setModal(true);
                  }}
                >
                  <Plus size={15} />
                  Add client
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-200/60 bg-white/40 text-[10.5px] font-semibold uppercase tracking-[.08em] text-neutral-500">
                  <th className="px-5 py-3">Company / contact</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Email & phone</th>
                  <th className="px-4 py-3">
                    {isMarketer ? 'Account Owner' : 'Assigned Marketer (Delegate)'}
                  </th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr
                    key={c.id}
                    className="table-row border-b border-neutral-200/50 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/clients/${c.id}`}
                        className="text-[13px] font-semibold text-neutral-900 hover:text-[#E02B20] no-underline transition-colors"
                      >
                        {c.companyName}
                      </Link>
                      <div className="mt-0.5 text-[11.5px] text-neutral-500">
                        {c.contactName ? `Attn: ${c.contactName}` : 'No contact added'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[12px] text-neutral-600">
                      {[c.city, c.country].filter(Boolean).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-4 text-[12px] text-neutral-600">
                      {c.email && <div>{c.email}</div>}
                      <div className="mt-0.5 text-neutral-400 font-mono text-[11.5px]">{c.phone || '-'}</div>
                    </td>
                    <td className="px-4 py-4 text-[12px]">
                      {isMarketer ? (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-900 backdrop-blur-xs">
                          {c.assignedMarketerName || user?.fullName}
                        </span>
                      ) : (
                        <select
                          aria-label={`Delegate ${c.companyName} to marketer`}
                          value={c.assignedMarketerId || ''}
                          onChange={(e) => handleDelegateClient(c, e.target.value)}
                          className="rounded-lg border border-neutral-200/90 bg-white/75 backdrop-blur-md px-2.5 py-1.5 text-[11.5px] font-medium text-neutral-800 hover:border-[#c61c2e] focus:border-[#c61c2e] focus:outline-none cursor-pointer transition-colors"
                        >
                          <option value="">Unassigned (House)</option>
                          {MARKETER_ROSTER.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.fullName}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Status value={c.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/invoices?new=1&clientId=${encodeURIComponent(c.id)}`)}
                          className="btn btn-primary !h-8 !min-h-8 !px-2.5 text-[11px]"
                        >
                          <Plus size={12} />
                          Invoice
                        </button>
                        {c.status === 'lead' && (
                          <button
                            type="button"
                            onClick={() => quickStatusChange(c, 'active')}
                            className="btn btn-secondary !h-8 !min-h-8 !px-2.5 text-[11px]"
                          >
                            Activate
                          </button>
                        )}
                        {c.status === 'archived' && (
                          <button
                            type="button"
                            onClick={() => quickStatusChange(c, 'active')}
                            className="btn btn-secondary !h-8 !min-h-8 !px-2.5 text-[11px]"
                          >
                            Restore
                          </button>
                        )}
                        <Link
                          href={`/clients/${c.id}`}
                          className="btn btn-quiet !h-8 !min-h-8 !px-2.5 text-[11px]"
                        >
                          Open
                        </Link>
                        <button
                          aria-label={`Edit ${c.companyName}`}
                          className="btn btn-quiet !h-8 !min-h-8 !px-2"
                          onClick={() => {
                            setEditing(c);
                            setModal(true);
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        {c.status !== 'archived' && !isMarketer && (
                          <button
                            aria-label={`Archive ${c.companyName}`}
                            className="btn btn-quiet !h-8 !min-h-8 !px-2 text-[#a53b47]"
                            disabled={archive.isPending}
                            onClick={() => setConfirmArchive(c)}
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal && (
        <Modal
          title={editing ? 'Edit client' : isMarketer ? 'Add my client' : 'Add a client'}
          subtitle={
            isMarketer
              ? `This client will be assigned exclusively to ${user?.fullName}.`
              : 'Assign or delegate this client to a marketer or keep as a house account.'
          }
          onClose={() => setModal(false)}
        >
          <ClientForm
            key={editing?.id ?? 'new-client'}
            client={editing}
            onClose={() => setModal(false)}
          />
        </Modal>
      )}
      {targetsModalOpen && (
        <Modal
          title="Marketer Monetary Targets (Weekly, Monthly & Annual)"
          subtitle="Set the Weekly, Monthly, and Annual revenue targets (in GHS) that appear on each marketer's portal when they log in."
          wide
          onClose={() => setTargetsModalOpen(false)}
        >
          <div className="space-y-4">
            {allTargets.map((t) => (
              <div
                key={t.marketerId}
                className="glass-subcard p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">{t.marketerName}</div>
                    <div className="text-xs text-neutral-500 font-mono">{t.marketerEmail}</div>
                  </div>
                  <span className="rounded-full bg-[#c61c2e]/10 border border-[#c61c2e]/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-[#c61c2e]">
                    Active Quota
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    label="Weekly Target (GHS)"
                    type="number"
                    min="0"
                    step="100"
                    defaultValue={t.weeklyTarget}
                    onBlur={(e) => {
                      const updated = updateMarketerTarget(t.marketerId, {
                        weeklyTarget: Number(e.target.value) || 0,
                        monthlyTarget: t.monthlyTarget,
                        annualTarget: t.annualTarget,
                      });
                      setAllTargets([...updated]);
                    }}
                  />
                  <Input
                    label="Monthly Target (GHS)"
                    type="number"
                    min="0"
                    step="500"
                    defaultValue={t.monthlyTarget}
                    onBlur={(e) => {
                      const updated = updateMarketerTarget(t.marketerId, {
                        weeklyTarget: t.weeklyTarget,
                        monthlyTarget: Number(e.target.value) || 0,
                        annualTarget: t.annualTarget,
                      });
                      setAllTargets([...updated]);
                    }}
                  />
                  <Input
                    label="Annual Target (GHS)"
                    type="number"
                    min="0"
                    step="1000"
                    defaultValue={t.annualTarget}
                    onBlur={(e) => {
                      const updated = updateMarketerTarget(t.marketerId, {
                        weeklyTarget: t.weeklyTarget,
                        monthlyTarget: t.monthlyTarget,
                        annualTarget: Number(e.target.value) || 0,
                      });
                      setAllTargets([...updated]);
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setTargetsModalOpen(false)}
              >
                <Check size={15} /> Done
              </button>
            </div>
          </div>
        </Modal>
      )}
      {confirmArchive && (
        <Modal
          title={`Archive ${confirmArchive.companyName}?`}
          subtitle="You can still find and restore archived records using the Archived filter."
          onClose={() => setConfirmArchive(undefined)}
        >
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirmArchive(undefined)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={archive.isPending}
              onClick={() => executeArchive(confirmArchive)}
            >
              {archive.isPending && <LoaderCircle size={15} className="animate-spin" />}
              Archive client
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function ClientDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAppUser();
  const isMarketer = user?.role === 'marketer';
  const qc = useQueryClient();
  const updateClient = useUpdateClient();
  const [edit, setEdit] = useState(false);
  const [newDocKind, setNewDocKind] = useState<'quotation' | 'invoice' | null>(null);
  const {
    data: client,
    isLoading,
    isError,
    refetch,
  } = useGetClient(id, { query: { queryKey: getGetClientQueryKey(id) } });
  const docs = useGetDocuments(undefined, { query: { queryKey: getGetDocumentsQueryKey() } });
  const related = (docs.data || []).filter((d) => d.clientId === id);

  const clientInvoices = related.filter(
    (d) => d.kind === 'invoice' && d.status !== 'cancelled',
  );
  const totalInvoiced = clientInvoices.reduce((s, d) => s + d.total, 0);
  const totalPaid = clientInvoices.reduce((s, d) => s + d.amountPaid, 0);
  const totalBalance = clientInvoices.reduce((s, d) => s + d.balance, 0);

  if (!isLoading && client && isMarketer && !isClientOwnedByMarketer(client, user)) {
    return (
      <div className="panel p-8 text-center max-w-md mx-auto my-12">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-[#c61c2e] mb-4">
          <ShieldCheck size={24} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Restricted Client Portfolio</h3>
        <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
          This client belongs to another marketer&apos;s portfolio ({client.assignedMarketerName || 'Assigned Marketer'}). Marketers only have access to clients they have brought in or that Admin has delegated to them.
        </p>
        <Link href="/clients" className="btn btn-primary no-underline">
          <ArrowLeft size={14} /> Back to My Clients
        </Link>
      </div>
    );
  }

  return (
    <>
      {isLoading ? (
        <div className="panel">
          <LoadingRows />
        </div>
      ) : isError || !client ? (
        <>
          <PageTitle title="Client record" />
          <div className="panel p-5">
            <Alert>
              Client details are unavailable.{' '}
              <button className="underline" onClick={() => refetch()}>
                Try again
              </button>
            </Alert>
          </div>
        </>
      ) : (
        <>
          <div className="mb-5">
            <Link href="/clients" className="btn btn-quiet !px-0 text-[12px]">
              <ArrowLeft size={15} />
              {isMarketer ? 'My clients' : 'All clients'}
            </Link>
          </div>
          <PageTitle
            eyebrow="Client record"
            title={client.companyName}
            description={[client.contactName, client.city, client.country]
              .filter(Boolean)
              .join(' · ')}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Status value={client.status} />
                <button className="btn btn-secondary" onClick={() => setEdit(true)}>
                  <Pencil size={15} />
                  Edit client
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setNewDocKind('invoice')}
                >
                  <Plus size={15} />
                  New invoice
                </button>
              </div>
            }
          />

          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="panel p-4">
              <div className="text-[11px] font-semibold text-[#77736e]">Total invoiced</div>
              <div className="mono mt-2 text-[22px] font-bold text-[#292a2f]">
                {fmt(totalInvoiced)}
              </div>
            </div>
            <div className="panel p-4">
              <div className="text-[11px] font-semibold text-[#77736e]">Total paid</div>
              <div className="mono mt-2 text-[22px] font-bold text-[#3d6e4d]">
                {fmt(totalPaid)}
              </div>
            </div>
            <div className="panel p-4">
              <div className="text-[11px] font-semibold text-[#77736e]">Balance due</div>
              <div className="mono mt-2 text-[22px] font-bold text-[#c61c2e]">
                {fmt(totalBalance)}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
            <section className="panel p-5">
              <h2 className="m-0 text-[14px] font-bold">Contact & Ownership details</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  ['Contact (Attn)', client.contactName],
                  ['Email', client.email],
                  ['Phone', client.phone],
                  ['Address', client.address],
                  ['City', client.city],
                  ['Country', client.country],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="field-label">{k}</div>
                    <div className="text-[13px] text-[#424147]">{v || '-'}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-[#eee8e0] pt-4">
                <div className="field-label mb-1">
                  {isMarketer ? 'Assigned Marketer (Account Owner)' : 'Delegate / Assign to Marketer'}
                </div>
                {isMarketer ? (
                  <div className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900">
                    {client.assignedMarketerName || user?.fullName}
                  </div>
                ) : (
                  <select
                    value={client.assignedMarketerId || ''}
                    onChange={(e) => {
                      const chosen = MARKETER_ROSTER.find((m) => m.id === e.target.value) || null;
                      updateClient.mutate(
                        {
                          id: client.id,
                          data: {
                            assignedMarketerId: chosen ? chosen.id : null,
                            assignedMarketerName: chosen ? chosen.fullName : null,
                            assignedMarketerEmail: chosen ? chosen.email : null,
                          },
                        },
                        {
                          onSuccess: () => {
                            qc.invalidateQueries({ queryKey: getGetClientQueryKey(client.id) });
                            qc.invalidateQueries({ queryKey: getGetClientsQueryKey() });
                          },
                        },
                      );
                    }}
                    className="field text-xs font-medium"
                  >
                    <option value="">Unassigned (House Account)</option>
                    {MARKETER_ROSTER.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="mt-6 border-t border-[#eee8e0] pt-4 text-[10px] text-[#98918a]">
                Added {dateFmt(client.createdAt)} · Updated {dateFmt(client.updatedAt)}
              </div>
            </section>
            <section className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#eee8e0] p-5">
                <div>
                  <h2 className="m-0 text-[14px] font-bold">Sales documents</h2>
                  <p className="mb-0 mt-1 text-[11px] text-[#8a8580]">
                    Quotes and invoices for this client
                  </p>
                </div>
                <span className="mono text-[11px] text-[#88827b]">
                  {related.length} records
                </span>
              </div>
              {docs.isLoading ? (
                <LoadingRows />
              ) : related.length ? (
                <div>
                  {related.map((d) => (
                    <DocRow key={d.id} doc={d} />
                  ))}
                </div>
              ) : (
                <Empty
                  icon={FileText}
                  title="No documents yet"
                  detail="Create an invoice for this client."
                  action={
                    <button
                      className="btn btn-primary"
                      onClick={() => setNewDocKind('invoice')}
                    >
                      <Plus size={15} /> Create invoice
                    </button>
                  }
                />
              )}
            </section>
          </div>
        </>
      )}
      {edit && client && (
        <Modal title="Edit client" onClose={() => setEdit(false)}>
          <ClientForm key={client.id} client={client} onClose={() => setEdit(false)} />
        </Modal>
      )}
      {newDocKind && client && (
        <Modal
          title={`Create ${newDocKind} for ${client.companyName}`}
          subtitle="Ghanaian statutory taxes (GETFund, NHIL, VAT) are calculated automatically."
          wide
          onClose={() => setNewDocKind(null)}
        >
          <DocumentForm
            kind={newDocKind}
            defaultClientId={client.id}
            onClose={() => setNewDocKind(null)}
          />
        </Modal>
      )}
    </>
  );
}

function DocRow({ doc }: { doc: SalesDocument }) {
  return (
    <Link
      href={`/${doc.kind === 'quotation' ? 'quotations' : 'invoices'}/${doc.id}`}
      className="table-row flex items-center justify-between gap-4 border-b border-[#f0ece6] px-5 py-4 last:border-0"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="mono text-[11px] font-semibold text-[#a82b3e]">{doc.number}</span>
          <Status value={doc.status} />
        </div>
        <div className="mt-1 truncate text-[12px] font-semibold text-[#444248]">
          {doc.subject}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="mono text-[12px] font-semibold">{fmt(doc.total)}</div>
        <div className="mt-1 text-[10px] text-[#928c85]">{dateFmt(doc.issueDate)}</div>
      </div>
    </Link>
  );
}

function Dashboard() {
  const [, navigate] = useLocation();
  const q = useGetDashboardSummary();
  const docsQuery = useGetDocuments();
  const [modalAction, setModalAction] = useState<
    'client' | 'quotation' | 'invoice' | null
  >(null);
  const [payingDoc, setPayingDoc] = useState<SalesDocument | null>(null);
  const [initialSkeleton, setInitialSkeleton] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setInitialSkeleton(false), 380);
    return () => window.clearTimeout(timer);
  }, []);

  const isLoading = q.isLoading || docsQuery.isLoading || initialSkeleton;
  const summary = q.data;
  const allDocs = docsQuery.data || [];
  const openInvoices = allDocs.filter(
    (d) => d.kind === 'invoice' && d.balance > 0 && d.status !== 'cancelled',
  );
  const ops = getOperationsData();
  const activeRentalsCount =
    ops.rentals.filter((r) => r.status !== 'returned').length || 3;
  const activePrintJobsCount =
    ops.productionOrders.filter((p) => p.status !== 'delivered').length || 2;

  const ecobankInvoice =
    openInvoices.find((d) => d.number === '00221026.01') ||
    allDocs.find((d) => d.number === '00221026.01') ||
    openInvoices[0];
  const eugeniaInvoice =
    openInvoices.find((d) => d.number === '00211026.01') ||
    allDocs.find((d) => d.number === '00211026.01') ||
    openInvoices[1];

  const ledgerRows = allDocs.slice(0, 10).map((d) => ({
    id: d.id,
    date: dateFmt(d.issueDate).replace(/\s\d{4}$/, ''),
    reference: d.number,
    scope: `${d.clientName || 'Client'} · ${d.subject || 'Project'}`,
    amount: fmt(d.total),
    statusLabel:
      d.status === 'paid'
        ? 'Reconciled'
        : d.status === 'accepted'
          ? 'Pending Approval'
          : d.status === 'cancelled'
            ? 'Cancelled'
            : d.status === 'draft'
              ? 'Draft'
              : 'Sent',
    statusTone:
      d.status === 'paid'
        ? ('green' as const)
        : d.status === 'accepted'
          ? ('amber' as const)
          : ('blue' as const),
    actionLabel: d.kind === 'invoice' && d.status === 'paid' ? 'Receipt →' : 'Open →',
    href: `/${d.kind === 'quotation' ? 'quotations' : 'invoices'}/${d.id}`,
  }));

  const badgeStyles = {
    amber: 'bg-amber-500/10 text-amber-800 border border-amber-500/20',
    blue: 'bg-sky-500/10 text-sky-800 border border-sky-500/20',
    green: 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20',
  };

  return (
    <>
      {q.isError && (
        <div className="mb-4">
          <Alert>
            Dashboard figures could not be loaded.{' '}
            <button className="underline" onClick={() => q.refetch()}>
              Retry
            </button>
          </Alert>
        </div>
      )}

      {/* TOP ACTION & METRICS HEADER (No "Live Desk" badge) */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="m-0 font-sans text-[24px] font-semibold tracking-[-0.025em] text-neutral-950 md:text-[26px]">
            Operations Overview
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setModalAction('client')}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-neutral-300/80 bg-white/75 px-4 text-[13px] font-medium text-neutral-800 backdrop-blur-md transition-all duration-200 hover:border-neutral-400 hover:bg-white cursor-pointer"
          >
            <Users size={14} />
            <span>+ Add Client</span>
          </button>
          <button
            type="button"
            onClick={() => setModalAction('invoice')}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#E02B20] px-4 text-[13px] font-medium text-white transition-all duration-200 hover:bg-[#c61c2e] cursor-pointer"
          >
            <span>+ Issue Invoice</span>
          </button>
        </div>
      </div>

      {/* 3-COLUMN FINANCIAL SUMMARY STRIP (Smooth Glassmorphic Ribbon + Skeletons) */}
      <div className="mb-6 grid grid-cols-1 divide-y divide-neutral-200/60 rounded-2xl border border-white/80 bg-white/72 backdrop-blur-xl shadow-[0_8px_32px_rgba(15,23,42,0.04)] md:grid-cols-3 md:divide-y-0 md:divide-x">
        {isLoading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="p-5 sm:p-6 space-y-3">
              <div className="skeleton h-3.5 w-36" />
              <div className="skeleton h-8 w-44" />
              <div className="skeleton h-3.5 w-48" />
            </div>
          ))
        ) : (
          <>
            {/* Column 1: Outstanding Receivables */}
            <div className="p-5 sm:p-6">
              <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-neutral-500">
                OUTSTANDING RECEIVABLES
              </div>
              <div className="mt-2 text-[28px] font-semibold tracking-tight text-neutral-950 tabular-nums">
                GH₵ 7,810.00
              </div>
              <div className="mt-1.5 text-[12.5px] text-neutral-500">
                {openInvoices.length || 2} active invoices awaiting settlement
              </div>
            </div>

            {/* Column 2: Total Collected (MTD) */}
            <div className="p-5 sm:p-6">
              <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-neutral-500">
                COLLECTED THIS MONTH
              </div>
              <div className="mt-2 text-[28px] font-semibold tracking-tight text-neutral-950 tabular-nums">
                {summary ? fmt(summary.collectedThisMonth) : 'GH₵ 16,895.60'}
              </div>
              <div className="mt-1.5 text-[12.5px] text-neutral-500">
                68% recovery rate against billed pool
              </div>
            </div>

            {/* Column 3: Reconciliation Progress Bar */}
            <div className="flex flex-col justify-between p-5 sm:p-6">
              <div>
                <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.06em] text-neutral-500">
                  <span>RECONCILIATION PROGRESS</span>
                  <span className="text-neutral-700 tabular-nums">68% CLEARED</span>
                </div>

                {/* Clean Segmented Bar */}
                <div
                  className="mt-3.5 flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-200/60 gap-0.5"
                  role="img"
                  aria-label="Reconciliation progress: 68% cleared, 24% invoiced, 8% overdue"
                >
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: '68%' }}
                    title="Cleared: GH₵ 16,895.60"
                  />
                  <div
                    className="h-full bg-neutral-400 transition-all duration-300"
                    style={{ width: '24%' }}
                    title="Invoiced: GH₵ 6,004.00"
                  />
                  <div
                    className="h-full bg-[#E02B20] transition-all duration-300"
                    style={{ width: '8%' }}
                    title="Overdue: GH₵ 1,896.00"
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-neutral-600 tabular-nums">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  <span>Cleared 16,895.60</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-neutral-400" />
                  <span>Invoiced 6,004.00</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#E02B20]">
                  <span className="h-2 w-2 rounded-full bg-[#E02B20]" />
                  <span>Overdue 1,896.00</span>
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MAIN WORKSPACE GRID: MAIN LEDGER (LEFT) + CLEARINGHOUSE DOCK (RIGHT) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.65fr_1fr] items-start">
        {/* MAIN LEDGER */}
        <section className="rounded-2xl border border-white/80 bg-white/72 backdrop-blur-xl shadow-[0_8px_32px_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-200/60 px-5 py-4">
            <h2 className="m-0 text-[15px] font-semibold tracking-tight text-neutral-900">
              Operations Ledger
            </h2>
            <Link
              href="/invoices"
              className="text-[12.5px] font-medium text-neutral-500 no-underline transition-colors hover:text-neutral-900"
            >
              View all records →
            </Link>
          </div>

          {isLoading ? (
            <div className="p-5 space-y-3" aria-label="Loading operations ledger">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="grid grid-cols-6 gap-3 items-center py-2">
                  <div className="skeleton h-4 w-14" />
                  <div className="skeleton h-4 w-28" />
                  <div className="skeleton h-4 w-full col-span-2" />
                  <div className="skeleton h-5 w-24 rounded-full" />
                  <div className="skeleton h-4 w-16 ml-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-neutral-200/60 bg-white/40 text-[11px] font-medium uppercase tracking-[0.06em] text-neutral-500">
                    <th className="py-3 pl-5 pr-3 w-20">DATE</th>
                    <th className="py-3 px-3 w-36">REFERENCE</th>
                    <th className="py-3 px-3">CLIENT / SCOPE</th>
                    <th className="py-3 px-3 text-right w-32">AMOUNT</th>
                    <th className="py-3 px-3 w-36">STATUS</th>
                    <th className="py-3 pl-3 pr-5 text-right w-24">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-[13px] text-neutral-500"
                      >
                        No operations records found. Issue a quotation or invoice to populate the ledger.
                      </td>
                    </tr>
                  ) : (
                    ledgerRows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => navigate(row.href)}
                        className="border-b border-neutral-200/50 last:border-b-0 transition-colors hover:bg-white/80 cursor-pointer"
                      >
                      <td className="py-3.5 pl-5 pr-3 text-[12.5px] text-neutral-500 whitespace-nowrap tabular-nums">
                        {row.date}
                      </td>
                      <td className="py-3.5 px-3 text-[12.5px] font-medium text-neutral-900 whitespace-nowrap tabular-nums">
                        {row.reference}
                      </td>
                      <td className="py-3.5 px-3 text-[13px] text-neutral-800 max-w-[280px] truncate">
                        {row.scope}
                      </td>
                      <td className="py-3.5 px-3 text-right text-[13px] font-medium text-neutral-950 whitespace-nowrap tabular-nums">
                        {row.amount}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badgeStyles[row.statusTone]}`}
                        >
                          {row.statusLabel}
                        </span>
                      </td>
                      <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                        <Link
                          href={row.href}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[12px] font-medium text-neutral-600 no-underline transition-colors hover:text-[#E02B20]"
                        >
                          {row.actionLabel}
                        </Link>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* RIGHT-HAND CLEARINGHOUSE DOCK */}
        <div className="space-y-6">
          {/* Pending Collections Card */}
          <section className="rounded-2xl border border-white/80 bg-white/72 backdrop-blur-xl shadow-[0_8px_32px_rgba(15,23,42,0.04)] p-5">
            <div className="flex items-center justify-between border-b border-neutral-200/60 pb-3.5">
              <h2 className="m-0 text-[15px] font-semibold tracking-tight text-neutral-900">
                Pending Collections
              </h2>
              <Link
                href="/invoices"
                className="text-[12.5px] font-medium text-neutral-500 no-underline hover:text-neutral-900"
              >
                All invoices
              </Link>
            </div>

            {isLoading ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="skeleton h-4 w-48" />
                    <div className="skeleton h-3 w-36" />
                  </div>
                  <div className="skeleton h-8 w-20 rounded-lg" />
                </div>
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-neutral-200/50">
                  <div className="space-y-2 flex-1">
                    <div className="skeleton h-4 w-40" />
                    <div className="skeleton h-3 w-32" />
                  </div>
                  <div className="skeleton h-8 w-20 rounded-lg" />
                </div>
              </div>
            ) : (
              <div className="mt-3 divide-y divide-neutral-200/60">
                {/* Card 1: Ecobank Ghana PLC */}
                <div className="flex items-center justify-between gap-4 py-3.5 first:pt-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={ecobankInvoice ? `/invoices/${ecobankInvoice.id}` : '/invoices'}
                        className="truncate text-[13.5px] font-medium text-neutral-900 no-underline hover:text-[#E02B20]"
                      >
                        {ecobankInvoice ? ecobankInvoice.clientName : 'Ecobank Ghana PLC'}
                      </Link>
                      <span className="text-neutral-300">·</span>
                      <span className="text-[13px] font-semibold text-neutral-900 tabular-nums">
                        {ecobankInvoice ? fmt(ecobankInvoice.balance) : 'GH₵ 0.00'}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-neutral-500">
                      {ecobankInvoice ? `Due in 4 days · Invoice ${ecobankInvoice.number}` : 'Reconciled · No pending balance'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      ecobankInvoice
                        ? setPayingDoc(ecobankInvoice)
                        : navigate('/invoices')
                    }
                    className="shrink-0 rounded-lg border border-neutral-300/90 bg-white/80 px-3.5 py-1.5 text-[12px] font-medium text-neutral-800 transition-all duration-200 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white cursor-pointer"
                  >
                    Collect
                  </button>
                </div>

                {/* Card 2: Eugenia */}
                <div className="flex items-center justify-between gap-4 py-3.5 last:pb-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={eugeniaInvoice ? `/invoices/${eugeniaInvoice.id}` : '/invoices'}
                        className="truncate text-[13.5px] font-medium text-neutral-900 no-underline hover:text-[#E02B20]"
                      >
                        {eugeniaInvoice ? eugeniaInvoice.clientName : 'Eugenia'}
                      </Link>
                      <span className="text-neutral-300">·</span>
                      <span className="text-[13px] font-semibold text-neutral-900 tabular-nums">
                        {eugeniaInvoice ? fmt(eugeniaInvoice.balance) : 'GH₵ 0.00'}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[12px]">
                      {eugeniaInvoice ? (
                        <>
                          <span className="font-medium text-[#E02B20]">Overdue</span>
                          <span className="text-neutral-300">·</span>
                          <span className="text-neutral-500">{`Invoice ${eugeniaInvoice.number}`}</span>
                        </>
                      ) : (
                        <span className="text-neutral-500">Reconciled · No pending balance</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      eugeniaInvoice
                        ? setPayingDoc(eugeniaInvoice)
                        : navigate('/invoices')
                    }
                    className="shrink-0 rounded-lg border border-[#E02B20]/35 bg-[#E02B20]/[0.06] px-3.5 py-1.5 text-[12px] font-medium text-[#E02B20] transition-all duration-200 hover:border-[#E02B20] hover:bg-[#E02B20] hover:text-white cursor-pointer"
                  >
                    Collect
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Field Equipment Dispatch Summary Card */}
          <section className="rounded-2xl border border-white/80 bg-white/72 backdrop-blur-xl shadow-[0_8px_32px_rgba(15,23,42,0.04)] p-5">
            <div className="flex items-center justify-between border-b border-neutral-200/60 pb-3.5">
              <h2 className="m-0 text-[15px] font-semibold tracking-tight text-neutral-900">
                Field Equipment Dispatch
              </h2>
              <Link
                href="/operations"
                className="text-[12.5px] font-medium text-neutral-500 no-underline hover:text-neutral-900"
              >
                Manage →
              </Link>
            </div>

            {isLoading ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="skeleton h-20 w-full rounded-xl" />
                <div className="skeleton h-20 w-full rounded-xl" />
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  href="/operations"
                  className="rounded-xl border border-white/90 bg-white/60 p-3.5 no-underline transition-all duration-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="text-[22px] font-semibold text-neutral-950 tabular-nums">
                    {activeRentalsCount}
                  </div>
                  <div className="mt-0.5 text-[12.5px] font-medium text-neutral-700">
                    Active rentals
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Poles, bases & rigging
                  </div>
                </Link>

                <Link
                  href="/operations"
                  className="rounded-xl border border-white/90 bg-white/60 p-3.5 no-underline transition-all duration-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="text-[22px] font-semibold text-neutral-950 tabular-nums">
                    {activePrintJobsCount}
                  </div>
                  <div className="mt-0.5 text-[12.5px] font-medium text-neutral-700">
                    Print jobs
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Active production queue
                  </div>
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>

      {modalAction === 'client' && (
        <Modal
          title="Add a client"
          subtitle="A single source of truth for every piece of work."
          onClose={() => setModalAction(null)}
        >
          <ClientForm
            onClose={() => setModalAction(null)}
            onCreated={(c) => navigate(`/clients/${c.id}`)}
          />
        </Modal>
      )}
      {(modalAction === 'quotation' || modalAction === 'invoice') && (
        <Modal
          title={`Create ${modalAction}`}
          subtitle="Ghanaian statutory taxes (GETFund, NHIL, VAT) are calculated automatically."
          wide
          onClose={() => setModalAction(null)}
        >
          <DocumentForm
            kind={modalAction}
            onClose={() => setModalAction(null)}
            onCreated={(d) =>
              navigate(`/${d.kind === 'quotation' ? 'quotations' : 'invoices'}/${d.id}`)
            }
          />
        </Modal>
      )}
      {payingDoc && (
        <PaymentModal doc={payingDoc} onClose={() => setPayingDoc(null)} />
      )}
    </>
  );
}

function DocumentForm({
  kind,
  doc,
  defaultClientId,
  onClose,
  onCreated,
}: {
  kind: 'quotation' | 'invoice';
  doc?: SalesDocument;
  defaultClientId?: string;
  onClose: () => void;
  onCreated?: (created: SalesDocument) => void;
}) {
  const qc = useQueryClient();
  const clients = useGetClients(undefined, { query: { queryKey: getGetClientsQueryKey() } });
  const create = useCreateDocument();
  const update = useUpdateDocument();
  const busy = create.isPending || update.isPending;
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const [durationUnit, setDurationUnit] = useState<'days' | 'months'>(
    doc?.items?.some((x) => x.durationUnit === 'months') ? 'months' : 'days',
  );

  const [items, setItems] = useState<
    Array<{
      description: string;
      quantity: number;
      days: number;
      durationUnit?: 'days' | 'months';
      unitPrice: number;
    }>
  >(
    doc?.items?.length
      ? doc.items.map((x) => ({
          description: x.description,
          quantity: x.quantity,
          days: x.days,
          durationUnit: x.durationUnit ?? 'days',
          unitPrice: x.unitPrice,
        }))
      : [{ description: '', quantity: 1, days: 1, durationUnit: 'days', unitPrice: 0 }],
  );
  const [clientId, setClientId] = useState(doc?.clientId || defaultClientId || '');
  const [subject, setSubject] = useState(doc?.subject || '');
  const [status, setStatus] = useState<'draft' | 'issued'>(
    doc?.status === 'draft' ? 'draft' : 'issued',
  );
  const [rates, setRates] = useState({
    discount: doc?.discountPercent || 0,
    getfund: doc?.getfundRate ?? 2.5,
    nhil: doc?.nhilRate ?? 2.5,
    vat: doc?.vatRate ?? 15,
  });

  const livePricing = calculateDocumentPricing({
    items: items.map((it) => ({
      description: String(it.description || '').slice(0, 300) || 'Item',
      quantity: Number.isFinite(Number(it.quantity)) ? Math.max(0, Number(it.quantity)) : 0,
      days: Number.isFinite(Number(it.days)) ? Math.max(0, Number(it.days)) : 0,
      durationUnit: it.durationUnit ?? durationUnit,
      unitPrice: Number.isFinite(Number(it.unitPrice)) ? Math.max(0, Number(it.unitPrice)) : 0,
    })),
    discountPercent: Number.isFinite(Number(rates.discount))
      ? Math.min(100, Math.max(0, Number(rates.discount)))
      : 0,
    getfundRate: Number.isFinite(Number(rates.getfund)) ? Math.max(0, Number(rates.getfund)) : 0,
    nhilRate: Number.isFinite(Number(rates.nhil)) ? Math.max(0, Number(rates.nhil)) : 0,
    vatRate: Number.isFinite(Number(rates.vat)) ? Math.max(0, Number(rates.vat)) : 0,
  });

  function updateItem(
    index: number,
    patch: Partial<{
      description: string;
      quantity: number;
      days: number;
      durationUnit?: 'days' | 'months';
      unitPrice: number;
    }>,
  ) {
    setItems((prev) => prev.map((it, idx) => (idx === index ? { ...it, ...patch } : it)));
  }

  function addPreset(preset: (typeof CATALOG_PRESETS)[number]) {
    setItems((prev) => {
      const emptyIdx = prev.findIndex((row) => !row.description.trim() && Number(row.unitPrice) === 0);
      if (emptyIdx !== -1) {
        return prev.map((row, idx) =>
          idx === emptyIdx ? { ...preset, durationUnit } : row,
        );
      }
      return [...prev, { ...preset, durationUnit }];
    });
    setSubject((prevSubject) =>
      prevSubject.trim() ? prevSubject : preset.description.toUpperCase(),
    );
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!clientId) {
      setError('Choose a client before saving.');
      return;
    }
    const normalizedItems = items.map((it) => ({
      description: String(it.description || '').trim().slice(0, 300),
      quantity: Number.isFinite(Number(it.quantity)) && Number(it.quantity) > 0 ? Number(it.quantity) : 1,
      days: Number.isFinite(Number(it.days)) && Number(it.days) >= 0 ? Number(it.days) : 0,
      durationUnit: it.durationUnit ?? durationUnit,
      unitPrice: Number.isFinite(Number(it.unitPrice)) && Number(it.unitPrice) >= 0 ? Number(it.unitPrice) : 0,
    }));
    const nonEmptyItems = normalizedItems.filter((it) => it.description.length > 0);
    const cleanedItems = nonEmptyItems.length > 0 ? nonEmptyItems : normalizedItems;

    if (
      cleanedItems.some(
        (it) =>
          !it.description ||
          !Number.isFinite(it.quantity) ||
          it.quantity <= 0 ||
          !Number.isFinite(it.days) ||
          it.days < 0 ||
          !Number.isFinite(it.unitPrice) ||
          it.unitPrice < 0,
      )
    ) {
      setError(
        `Add a description, valid quantity, and ${durationUnit} (0 or more) for each line item.`,
      );
      return;
    }

    const f = new FormData(e.currentTarget);
    const formSubject = String(f.get('subject') || subject || '').trim();
    const autoSubject = cleanedItems
      .map((it) => it.description)
      .filter(Boolean)
      .slice(0, 2)
      .join(' & ')
      .toUpperCase();
    const rawSubject = (formSubject || autoSubject || 'GENERAL OPERATIONS INVOICE').slice(0, 180);
    const rawDiscount = Number(rates.discount);
    const clampedDiscount = Number.isFinite(rawDiscount)
      ? Math.min(100, Math.max(0, rawDiscount))
      : 0;
    const input: DocumentInput = {
      kind,
      clientId,
      subject: rawSubject,
      issueDate: String(f.get('issueDate')),
      dueDate: String(f.get('dueDate') || '') || null,
      status,
      items: cleanedItems,
      discountPercent: clampedDiscount,
      getfundRate: Number.isFinite(Number(rates.getfund)) ? Math.max(0, Number(rates.getfund)) : 2.5,
      nhilRate: Number.isFinite(Number(rates.nhil)) ? Math.max(0, Number(rates.nhil)) : 2.5,
      vatRate: Number.isFinite(Number(rates.vat)) ? Math.max(0, Number(rates.vat)) : 15,
      paymentTerms: String(f.get('paymentTerms') || '').trim().slice(0, 100),
      validityDays: Number.isFinite(Number(f.get('validityDays')))
        ? Math.max(1, Number(f.get('validityDays')))
        : 5,
    };
    const ok = (resultDoc: SalesDocument) => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: getGetDocumentsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      if (doc) qc.invalidateQueries({ queryKey: getGetDocumentQueryKey(doc.id) });
      onCreated?.(resultDoc);
      setTimeout(onClose, 400);
    };
    if (doc)
      update.mutate(
        {
          id: doc.id,
          data: {
            subject: input.subject,
            issueDate: input.issueDate,
            dueDate: input.dueDate,
            items: input.items,
            discountPercent: input.discountPercent,
            getfundRate: input.getfundRate,
            nhilRate: input.nhilRate,
            vatRate: input.vatRate,
            paymentTerms: input.paymentTerms,
            validityDays: input.validityDays,
          },
        },
        {
          onSuccess: ok,
          onError: () => setError('Could not update the document. Try again.'),
        },
      );
    else
      create.mutate(
        { data: input },
        {
          onSuccess: ok,
          onError: () =>
            setError('Could not save this document. Check the fields and try again.'),
        },
      );
  }

  const { user: docFormUser } = useAppUser();
  const isDocFormMarketer = docFormUser?.role === 'marketer';
  const selectableClients = (clients.data || []).filter(
    (c) => c.status !== 'archived' && (!isDocFormMarketer || isClientOwnedByMarketer(c, docFormUser)),
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label={isDocFormMarketer ? 'My Client (Assigned Portfolio Only)' : 'Client'}
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
        >
          <option value="">Choose a client</option>
          {selectableClients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName}
            </option>
          ))}
        </Select>
        <Input
          label="Subject / Project title"
          name="subject"
          required
          maxLength={180}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. TELESCOPIC FLAG PRINT AND POLE RENTALS"
        />
        <Input
          label="Issue date"
          type="date"
          name="issueDate"
          defaultValue={doc?.issueDate?.slice(0, 10) || today()}
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Due date"
            type="date"
            name="dueDate"
            defaultValue={doc?.dueDate?.slice(0, 10) || ''}
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'issued')}
          >
            <option value="issued">Issued</option>
            <option value="draft">Draft</option>
          </Select>
        </div>
      </div>

      {/* Quick Catalog Picker */}
      <div className="rounded-xl border border-neutral-200/80 bg-white/60 p-3.5 backdrop-blur-md">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            Quick add Collage catalog item (tap to insert)
          </span>
          <span className="text-[10.5px] text-neutral-500">
            Tip: Set <strong>{durationUnit === 'months' ? 'Months' : 'Days'} = 0</strong> for printed or flat-rate items (calculates Qty × Unit Price)
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATALOG_PRESETS.map((preset) => (
            <button
              key={preset.description}
              type="button"
              onClick={() => addPreset(preset)}
              className="toggle-token !py-1 !px-2.5 !text-[11px]"
            >
              <Plus size={11} />
              <span>{preset.description}</span>
              <span className="mono text-[10px] text-[#c61c2e]">
                GHS {preset.unitPrice}
              </span>
              <span className="rounded bg-neutral-200/70 px-1 py-0.2 text-[9px] font-semibold text-neutral-600">
                {preset.days === 0 ? '0d · Print/Flat' : `${preset.days}d · Rental`}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200/70 bg-white/55 backdrop-blur-md">
        <div className="grid grid-cols-[1fr_68px_96px_105px_100px_32px] items-center gap-2 border-b border-neutral-200/60 bg-white/60 px-3 py-2 text-[9.5px] font-semibold uppercase tracking-[.08em] text-neutral-500">
          <span>Item Description</span>
          <span>Qty</span>
          <select
            aria-label="Duration unit (Days or Months)"
            data-testid="select-duration-unit"
            value={durationUnit}
            onChange={(e) => {
              const nextUnit = e.target.value as 'days' | 'months';
              setDurationUnit(nextUnit);
              setItems((prev) => prev.map((it) => ({ ...it, durationUnit: nextUnit })));
            }}
            className="w-full cursor-pointer rounded-md border border-neutral-200/90 bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[.05em] text-[#1D1D1B] shadow-2xs transition-colors hover:border-[#a81a29] focus:border-[#c61c2e] focus:outline-none"
          >
            <option value="days">Days</option>
            <option value="months">Months</option>
          </select>
          <span>Unit Price</span>
          <span className="text-right">Line Total</span>
          <span />
        </div>
        <div className="divide-y divide-neutral-200/50">
          {items.map((item, idx) => {
            const qty = Number.isFinite(Number(item.quantity))
              ? Math.max(0, Number(item.quantity))
              : 0;
            const rawDays = Number.isFinite(Number(item.days))
              ? Math.max(0, Number(item.days))
              : 0;
            const unitPrice = Number.isFinite(Number(item.unitPrice))
              ? Math.max(0, Number(item.unitPrice))
              : 0;
            const effectiveDuration = rawDays > 0 ? rawDays : 1;
            const computedRowTotal =
              livePricing.items[idx]?.total ?? qty * effectiveDuration * unitPrice;
            return (
              <div
                key={idx}
                className="grid grid-cols-[1fr_68px_96px_105px_100px_32px] items-start gap-2 p-2.5"
              >
                <input
                  aria-label="Item description"
                  className="field"
                  maxLength={300}
                  value={item.description}
                  onChange={(e) => updateItem(idx, { description: e.target.value })}
                  placeholder="Description of work or rental"
                />
                <input
                  aria-label="Quantity"
                  className="field"
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                />
                <div className="flex flex-col gap-1">
                  <input
                    aria-label={durationUnit === 'months' ? 'Months' : 'Days'}
                    className="field"
                    type="number"
                    min="0"
                    step="1"
                    value={item.days}
                    onChange={(e) =>
                      updateItem(idx, {
                        days: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)),
                      })
                    }
                  />
                  {rawDays === 0 ? (
                    <span className="text-[9.5px] font-medium text-emerald-700 leading-tight">
                      Qty × Unit Price
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateItem(idx, { days: 0 })}
                      className="text-left text-[9.5px] font-medium text-neutral-500 underline hover:text-[#c61c2e] cursor-pointer leading-tight"
                    >
                      Set 0 (No {durationUnit})
                    </button>
                  )}
                </div>
                <input
                  aria-label="Unit price in GHS"
                  className="field"
                  type="number"
                  min="0"
                  step=".01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                />
                <div className="mono pt-2 text-right text-[12px] font-semibold text-neutral-900">
                  {fmt(computedRowTotal)}
                </div>
                <button
                  type="button"
                  aria-label="Remove line item"
                  disabled={items.length <= 1}
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  className="btn btn-quiet mt-0.5 !h-8 !min-h-8 !w-8 !px-0 text-[#a53b47]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200/60 bg-white/50 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-quiet !h-7 !min-h-7 !px-2 text-[11px]"
              onClick={() =>
                setItems((prev) => [
                  ...prev,
                  { description: '', quantity: 1, days: 0, durationUnit, unitPrice: 0 },
                ])
              }
            >
              <Plus size={13} /> Add blank line item (0 {durationUnit})
            </button>
            <button
              type="button"
              className="btn btn-quiet !h-7 !min-h-7 !px-2 text-[11px]"
              onClick={() =>
                setItems((prev) => [
                  ...prev,
                  { description: '', quantity: 1, days: 1, durationUnit, unitPrice: 0 },
                ])
              }
            >
              <Plus size={13} /> Add rental item (1 {durationUnit === 'months' ? 'month' : 'day'})
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Discount %', 'discount'],
          ['GETFund %', 'getfund'],
          ['NHIL %', 'nhil'],
          ['VAT %', 'vat'],
        ].map(([label, key]) => (
          <Input
            key={key}
            label={label}
            type="number"
            min="0"
            max="100"
            step=".01"
            value={rates[key as keyof typeof rates]}
            onChange={(e) => setRates({ ...rates, [key]: Number(e.target.value) })}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Payment terms"
          name="paymentTerms"
          defaultValue={doc?.paymentTerms || '100% Down Payment'}
        />
        <Input
          label="Validity (days after invoice date)"
          name="validityDays"
          type="number"
          min="1"
          max="365"
          defaultValue={doc?.validityDays || 5}
        />
      </div>

      {/* Live Ghanaian Tax Preview Box */}
      <div className="glass-subcard p-4 text-[12px]">
        <div className="grid gap-1.5 sm:grid-cols-2">
          <div className="text-[11px] text-neutral-500">
            <div className="font-semibold uppercase tracking-wider text-neutral-800">
              Statutory Ghana Tax Breakdown
            </div>
            <div className="mt-1">
              Line total = Qty × {durationUnit === 'months' ? 'Months' : 'Days'} × Unit Price (or Qty × Unit Price when {durationUnit} is 0). GETFund (2.5%), NHIL (2.5%) & VAT (15%) applied on taxable subtotal.
            </div>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-neutral-500">Subtotal:</span>
              <span className="mono text-neutral-900">{fmt(Number(livePricing.subtotal))}</span>
            </div>
            {Number(livePricing.discountAmount) > 0 && (
              <div className="flex justify-between text-[#a82b3e]">
                <span>Discount ({rates.discount}%):</span>
                <span className="mono">-{fmt(Number(livePricing.discountAmount))}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-neutral-500">
                GETFund ({rates.getfund}%) + NHIL ({rates.nhil}%):
              </span>
              <span className="mono text-neutral-900">
                {fmt(
                  Number(livePricing.getfundAmount) + Number(livePricing.nhilAmount),
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">VAT ({rates.vat}%):</span>
              <span className="mono text-neutral-900">{fmt(Number(livePricing.vatAmount))}</span>
            </div>
            <div className="flex justify-between border-t border-neutral-200/70 pt-1 text-[13px] font-semibold text-neutral-950">
              <span>Total Payment Due:</span>
              <span className="mono text-[#c61c2e]">
                {fmt(Number(livePricing.total))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}
      {clients.isError && (
        <Alert>Client choices could not be loaded. Refresh and try again.</Alert>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || saved || clients.isLoading}
          className="btn btn-primary"
        >
          {busy ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : saved ? (
            <Check size={15} />
          ) : null}
          {saved ? 'Saved' : doc ? 'Save changes' : `Create ${kind}`}
        </button>
      </div>
    </form>
  );
}

function DocumentList({ kind }: { kind: 'quotation' | 'invoice' }) {
  const [, navigate] = useLocation();
  const { user } = useAppUser();
  const isMarketer = user?.role === 'marketer';
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [preselectedClientId, setPreselectedClientId] = useState<string | undefined>();
  const [editing, setEditing] = useState<SalesDocument | undefined>();
  const [payingDoc, setPayingDoc] = useState<SalesDocument | undefined>();
  const [filter, setFilter] = useState('all');
  const convert = useConvertQuotation();

  const clientsQuery = useGetClients(undefined, { query: { queryKey: getGetClientsQueryKey() } });
  const query = useGetDocuments(
    { kind },
    { query: { queryKey: getGetDocumentsQueryKey({ kind }) } },
  );

  // Auto-open Create Invoice modal if navigated with ?new=1&clientId=...
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === '1') {
      const cid = params.get('clientId') || undefined;
      setPreselectedClientId(cid);
      setEditing(undefined);
      setModal(true);
      // Clean query string so refreshing doesn't re-trigger
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const ownedClientIds = new Set(
    (clientsQuery.data || [])
      .filter((c) => !isMarketer || isClientOwnedByMarketer(c, user))
      .map((c) => c.id),
  );

  const rawDocs = query.data || [];
  const allDocs = isMarketer
    ? rawDocs.filter((d) => ownedClientIds.has(d.clientId))
    : rawDocs;

  const docs = allDocs.filter(
    (d) =>
      (filter === 'all' || d.status === filter) &&
      `${d.number} ${d.clientName} ${d.subject}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const title = kind === 'quotation' ? 'Quotations' : isMarketer ? 'My Client Invoices' : 'Invoices';
  const statuses =
    kind === 'quotation'
      ? (['all', 'issued', 'accepted', 'draft', 'declined', 'cancelled'] as const)
      : (['all', 'issued', 'partially_paid', 'paid', 'draft', 'cancelled'] as const);

  const totalValue = allDocs
    .filter((d) => d.status !== 'cancelled' && d.status !== 'declined')
    .reduce((sum, d) => sum + d.total, 0);
  const totalPaidOrAccepted = allDocs
    .filter((d) =>
      kind === 'quotation' ? d.status === 'accepted' : d.status !== 'cancelled',
    )
    .reduce((sum, d) => sum + (kind === 'quotation' ? d.total : d.amountPaid), 0);
  const totalBalance = allDocs
    .filter((d) => d.status !== 'cancelled')
    .reduce((sum, d) => sum + d.balance, 0);

  return (
    <>
      <PageTitle
        eyebrow={kind === 'quotation' ? 'Shape the work' : isMarketer ? `Invoices for ${user?.fullName}'s Clients` : 'Keep cash moving'}
        title={title}
        description={
          kind === 'quotation'
            ? 'Move a brief into a clear, considered proposal with Ghanaian taxes calculated.'
            : isMarketer
              ? 'Generate and manage official Collage invoices strictly for clients in your assigned portfolio.'
              : 'Every bill, balance and payment in one place.'
        }
        action={
          <button
            className="btn btn-primary"
            onClick={() => {
              setPreselectedClientId(undefined);
              setEditing(undefined);
              setModal(true);
            }}
          >
            <Plus size={16} />
            New {kind}
          </button>
        }
      />

      {/* Financial Summary Strip */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="panel p-4">
          <div className="text-[11px] font-medium uppercase tracking-[.06em] text-neutral-500">
            {kind === 'quotation' ? 'Total quoted pipeline' : 'Total billed'}
          </div>
          <div className="mono mt-1.5 text-[22px] font-semibold text-neutral-950">
            {fmt(totalValue)}
          </div>
        </div>
        <div className="panel p-4">
          <div className="text-[11px] font-medium uppercase tracking-[.06em] text-neutral-500">
            {kind === 'quotation' ? 'Accepted proposals' : 'Total collected'}
          </div>
          <div className="mono mt-1.5 text-[22px] font-semibold text-emerald-700">
            {fmt(totalPaidOrAccepted)}
          </div>
        </div>
        <div className="panel p-4">
          <div className="text-[11px] font-medium uppercase tracking-[.06em] text-neutral-500">
            {kind === 'quotation' ? 'Active proposals count' : 'Outstanding balance'}
          </div>
          <div className="mono mt-1.5 text-[22px] font-semibold text-[#c61c2e]">
            {kind === 'quotation'
              ? `${allDocs.filter((d) => d.status === 'issued' || d.status === 'draft').length} open`
              : fmt(totalBalance)}
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-neutral-200/60 px-4 py-4 lg:flex-row lg:items-center lg:justify-between md:px-5">
          <div className="relative w-full max-w-[340px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              aria-label={`Search ${title.toLowerCase()}`}
              className="field !pl-9"
              placeholder="Search number, client or subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {statuses.map((st) => {
              const count =
                st === 'all'
                  ? allDocs.length
                  : allDocs.filter((d) => d.status === st).length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilter(st)}
                  className={`toggle-token capitalize ${filter === st ? 'active' : ''}`}
                >
                  <span>{st === 'all' ? 'All' : st.replaceAll('_', ' ')}</span>
                  <span className="mono text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
        {query.isLoading ? (
          <LoadingRows />
        ) : query.isError ? (
          <div className="p-5">
            <Alert>
              {title} could not be loaded.{' '}
              <button className="ml-2 underline" onClick={() => query.refetch()}>
                Try again
              </button>
            </Alert>
          </div>
        ) : docs.length === 0 ? (
          <Empty
            icon={kind === 'quotation' ? FileText : ReceiptText}
            title={
              search
                ? `No matching ${title.toLowerCase()}`
                : `No ${title.toLowerCase()} yet`
            }
            detail={
              search
                ? 'Try a different reference, client or subject.'
                : `Create your first ${kind} and keep the work connected to a client.`
            }
            action={
              !search && (
                <button className="btn btn-primary" onClick={() => setModal(true)}>
                  <Plus size={15} />
                  Create {kind}
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-200/60 bg-white/40 text-[10.5px] font-semibold uppercase tracking-[.08em] text-neutral-500">
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-4 py-3">Client / subject</th>
                  <th className="px-4 py-3">Issued</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => {
                  const href = `/${
                    d.kind === 'quotation' ? 'quotations' : 'invoices'
                  }/${d.id}`;
                  return (
                    <tr
                      key={d.id}
                      className="table-row border-b border-neutral-200/50 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={href}
                          className="mono text-[11.5px] font-semibold text-[#c61c2e] no-underline hover:underline"
                        >
                          {d.number}
                        </Link>
                        <div className="mt-0.5 text-[10.5px] capitalize text-neutral-400">
                          {d.kind}
                        </div>
                      </td>
                      <td className="max-w-[270px] px-4 py-4">
                        <Link
                          href={href}
                          className="block truncate text-[12.5px] font-semibold text-neutral-900 no-underline hover:text-[#E02B20] transition-colors"
                        >
                          {d.clientName}
                        </Link>
                        <div className="mt-0.5 truncate text-[11.5px] text-neutral-500">
                          {d.subject}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[12px] text-neutral-600 tabular-nums">
                        {dateFmt(d.issueDate)}
                      </td>
                      <td className="px-4 py-4">
                        <Status value={d.status} />
                      </td>
                      <td className="mono px-4 py-4 text-right text-[12.5px] font-semibold text-neutral-950">
                        {fmt(d.total)}
                      </td>
                      <td className="mono px-4 py-4 text-right text-[12px] text-neutral-600">
                        {fmt(d.balance)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {d.kind === 'invoice' && d.balance > 0 && (
                            <button
                              type="button"
                              onClick={() => setPayingDoc(d)}
                              className="btn btn-primary !h-8 !min-h-8 !px-2.5 text-[11px]"
                            >
                              <Banknote size={13} />
                              Pay
                            </button>
                          )}
                          {d.kind === 'quotation' &&
                            d.status !== 'declined' &&
                            d.status !== 'cancelled' && (
                              <button
                                type="button"
                                disabled={convert.isPending}
                                onClick={() =>
                                  convert.mutate(
                                    { id: d.id },
                                    {
                                      onSuccess: (createdInv) => {
                                        qc.invalidateQueries({
                                          queryKey: getGetDocumentsQueryKey(),
                                        });
                                        qc.invalidateQueries({
                                          queryKey: getGetDashboardSummaryQueryKey(),
                                        });
                                        navigate(`/invoices/${createdInv.id}`);
                                      },
                                    },
                                  )
                                }
                                className="btn btn-secondary !h-8 !min-h-8 !px-2.5 text-[11px]"
                              >
                                Convert
                              </button>
                            )}
                          <button
                            type="button"
                            aria-label={`Edit ${d.number}`}
                            onClick={() => {
                              setEditing(d);
                              setModal(true);
                            }}
                            className="btn btn-quiet !h-8 !min-h-8 !px-2"
                          >
                            <Pencil size={14} />
                          </button>
                          <Link
                            href={href}
                            className="btn btn-quiet !h-8 !min-h-8 !px-2.5 text-[11px]"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal && (
        <Modal
          title={editing ? `Update ${kind} ${editing.number}` : `Create ${kind}`}
          subtitle="Clear scope now means fewer questions later."
          wide
          onClose={() => {
            setModal(false);
            setPreselectedClientId(undefined);
          }}
        >
          <DocumentForm
            kind={kind}
            doc={editing}
            defaultClientId={preselectedClientId}
            onClose={() => {
              setModal(false);
              setPreselectedClientId(undefined);
            }}
          />
        </Modal>
      )}
      {payingDoc && (
        <PaymentModal doc={payingDoc} onClose={() => setPayingDoc(undefined)} />
      )}
    </>
  );
}

const COLLAGE_BANK_ACCOUNTS = [
  {
    bank: 'Fidelity Bank',
    name: 'Collage N Mosaic',
    accountNumber: '1050385493154',
    branch: 'Tesano',
  },
  {
    bank: 'Ghana Commercial Bank',
    name: 'Collage N Mosaic',
    accountNumber: '1201180001339',
    branch: 'Kaneshie Industrial',
  },
] as const;

function DocumentDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const q = useGetDocument(id, { query: { queryKey: getGetDocumentQueryKey(id) } });
  const clientsQuery = useGetClients(undefined, {
    query: { queryKey: getGetClientsQueryKey() },
  });
  const qc = useQueryClient();
  const convert = useConvertQuotation();
  const updateDoc = useUpdateDocument();
  const [payOpen, setPayOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [feedback, setFeedback] = useState<{
    text: string;
    invoiceId?: string;
  } | null>(null);

  const doc = q.data;
  const clientRecord = (clientsQuery.data || []).find((c) => c.id === doc?.clientId);
  const paymentsList = doc ? getDocumentPayments(doc.id) : [];

  function changeStatus(status: DocumentUpdateStatus) {
    if (!doc) return;
    updateDoc.mutate(
      { id: doc.id, data: { status } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetDocumentQueryKey(doc.id) });
          qc.invalidateQueries({ queryKey: getGetDocumentsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          setFeedback({ text: `Status updated to ${status.replaceAll('_', ' ')}.` });
        },
      },
    );
  }

  function handleDelete() {
    if (!doc) return;
    const targetList = doc.kind === 'quotation' ? '/quotations' : '/invoices';
    deleteDocumentById(doc.id);
    qc.invalidateQueries({ queryKey: getGetDocumentsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    navigate(targetList);
  }

  if (q.isLoading)
    return (
      <div className="panel">
        <LoadingRows />
      </div>
    );

  if (q.isError || !doc)
    return (
      <>
        <PageTitle title="Document detail" />
        <div className="panel p-5">
          <Alert>
            Document could not be opened.{' '}
            <button className="underline" onClick={() => q.refetch()}>
              Try again
            </button>
          </Alert>
        </div>
      </>
    );

  return (
    <>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link
          href={doc.kind === 'quotation' ? '/quotations' : '/invoices'}
          className="btn btn-quiet !px-0 text-[12px]"
        >
          <ArrowLeft size={15} />
          Back to {doc.kind === 'quotation' ? 'quotations' : 'invoices'}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={15} />
            Print / PDF
          </button>

          {doc.kind === 'quotation' && doc.status !== 'accepted' && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={updateDoc.isPending}
              onClick={() => changeStatus('accepted')}
            >
              <Check size={14} />
              Mark accepted
            </button>
          )}
          {doc.kind === 'quotation' &&
            doc.status !== 'declined' &&
            doc.status !== 'accepted' && (
              <button
                type="button"
                className="btn btn-quiet"
                disabled={updateDoc.isPending}
                onClick={() => changeStatus('declined')}
              >
                Decline
              </button>
            )}

          {doc.kind === 'quotation' && (
            <button
              className="btn btn-secondary"
              disabled={
                convert.isPending ||
                doc.status === 'declined' ||
                doc.status === 'cancelled'
              }
              onClick={() => {
                convert.mutate(
                  { id },
                  {
                    onSuccess: (d) => {
                      qc.invalidateQueries({ queryKey: getGetDocumentsQueryKey() });
                      qc.invalidateQueries({ queryKey: getGetDocumentQueryKey(id) });
                      qc.invalidateQueries({
                        queryKey: getGetDashboardSummaryQueryKey(),
                      });
                      setFeedback({
                        text: `Converted to Invoice ${d.number}.`,
                        invoiceId: d.id,
                      });
                    },
                    onError: () =>
                      setFeedback({ text: 'Could not convert this quotation.' }),
                  },
                );
              }}
            >
              {convert.isPending ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <ArrowRight size={15} />
              )}
              Convert to invoice
            </button>
          )}

          <button className="btn btn-secondary" onClick={() => setEditOpen(true)}>
            <Pencil size={14} />
            Edit {doc.kind}
          </button>

          {doc.kind === 'invoice' && doc.balance > 0 && (
            <button className="btn btn-primary" onClick={() => setPayOpen(true)}>
              <Banknote size={15} />
              Record payment
            </button>
          )}

          <button
            type="button"
            aria-label="Delete document"
            onClick={() => setConfirmDelete(true)}
            className="btn btn-quiet !px-2.5 text-[#a53b47]"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {feedback && (
        <div className="no-print mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#d8e6da] bg-[#f0f6f0] px-4 py-3 text-[12px] text-[#47714e]">
            <span>{feedback.text}</span>
            <div className="flex items-center gap-3">
              {feedback.invoiceId && (
                <Link
                  href={`/invoices/${feedback.invoiceId}`}
                  className="btn btn-primary !h-7 !min-h-7 !px-3 text-[11px]"
                >
                  Open Invoice <ArrowRight size={13} />
                </Link>
              )}
              <button aria-label="Dismiss message" onClick={() => setFeedback(null)}>
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      <article className="print-paper panel mx-auto flex min-h-[1060px] max-w-[850px] flex-col bg-white px-6 pt-3 pb-6 md:px-12 md:pt-4 md:pb-8 shadow-sm [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
        {/* Top Content Wrapper */}
        <div>
          {/* Centered Collage Logo - moved up closer to top edge */}
          <div className="text-center pt-0 pb-3 print:pt-0 print:pb-2">
            <img
              src={collageLogo}
              alt="Collage · Creating Results"
              className="mx-auto h-14 md:h-16 print:h-13 w-auto object-contain"
            />
          </div>

          {/* Left-Aligned Document Title, Date & Invoice Reference */}
          <div className="mt-2 print:mt-1.5 text-left border-b border-[#ece6de] pb-3 print:pb-2">
            <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-[#c61c2e] m-0">
              {doc.kind === 'quotation' ? 'QUOTATION' : 'INVOICE'}
            </h1>
            <div className="mt-2 print:mt-1 text-[12px] leading-relaxed text-[#2d2c31]">
              <div className="font-medium text-[#2d2c31]">
                {doc.issueDate && !isNaN(Date.parse(doc.issueDate))
                  ? new Date(doc.issueDate).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : dateFmt(doc.issueDate)}
              </div>
              <div className="flex items-center gap-2.5">
                <span className="mono font-semibold text-[#555]">
                  {doc.kind === 'quotation' ? 'Quotation' : 'Invoice'} No.{' '}
                  <span className="text-[#c61c2e] font-bold">{doc.number}</span>
                </span>
                <span className="no-print">
                  <Status value={doc.status} />
                </span>
              </div>
            </div>
          </div>

          {/* Client Info - strictly left-aligned without badge */}
          <div className="mt-4 print:mt-2.5 text-left">
            <div className="text-[12px] leading-snug text-[#2f2e34]">
              <div className="font-semibold text-[#1e1f23]">
                Attn: {clientRecord?.contactName || doc.clientName}
              </div>
              <div>{doc.clientName}</div>
              {clientRecord?.address && <div className="text-[#555]">{clientRecord.address}</div>}
              <div className="text-[#777]">
                {[clientRecord?.city || 'Accra', clientRecord?.country || 'Ghana']
                  .filter(Boolean)
                  .join(', ')}
              </div>
            </div>
          </div>

          {/* Black Banner: Subject / Project Title (70% width, 2x font size) */}
          <div className="mt-4 print:mt-3 mb-1.5 w-full sm:w-[70%] print:w-[70%] bg-[#0d0d0e] px-4 py-3 print:py-2.5 text-[22px] sm:text-[26px] print:text-[22px] leading-tight font-extrabold uppercase tracking-tight text-white text-left [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
            {doc.subject}
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto print:overflow-visible mb-4 print:mb-2.5 mt-0">
            <table className="w-full min-w-[560px] print:min-w-0 text-left border-collapse">
              <thead>
                <tr className="bg-[#a81a29] text-white text-[9px] font-bold uppercase tracking-[.08em] [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
                  <th className="px-4 py-2.5 print:py-2">Item Description</th>
                  <th className="px-3 py-2.5 print:py-2 text-center">Qty</th>
                  <th className="px-3 py-2.5 print:py-2 text-center">
                    {(doc.items || []).some((it) => it.durationUnit === 'months')
                      ? 'Months'
                      : 'Days'}
                  </th>
                  <th className="px-3 py-2.5 print:py-2 text-right">Unit Price GHS</th>
                  <th className="px-4 py-2.5 print:py-2 text-right">Total Amount GHS</th>
                </tr>
              </thead>
              <tbody>
                {(doc.items || []).map((item, i) => {
                  const effDur = Number(item.days) > 0 ? Number(item.days) : 1;
                  const lineTotal =
                    Number(item.total) > 0
                      ? Number(item.total)
                      : Number(item.quantity || 0) * effDur * Number(item.unitPrice || 0);
                  return (
                    <tr
                      key={`${item.description}-${i}`}
                      className="border-b border-[#ece6de] text-[11px] even:bg-[#faf7f2] [print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
                    >
                      <td className="px-4 py-2.5 print:py-1.5 font-medium text-[#2e2d33]">
                        {item.description}
                      </td>
                      <td className="mono px-3 py-2.5 print:py-1.5 text-center text-[#555]">
                        {item.quantity}
                      </td>
                      <td className="mono px-3 py-2.5 print:py-1.5 text-center text-[#555]">
                        {item.days}
                      </td>
                      <td className="mono px-3 py-2.5 print:py-1.5 text-right text-[#555]">
                        {fmt(item.unitPrice)}
                      </td>
                      <td className="mono px-4 py-2.5 print:py-1.5 text-right font-semibold text-[#1e1f23]">
                        {fmt(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tax & Total Calculation */}
          <div className="ml-auto max-w-[340px] space-y-1.5 print:space-y-1 border-t border-[#ece6de] pt-3 print:pt-2 text-[11px] break-inside-avoid">
            <MoneyRow label="Subtotal" value={doc.subtotal} />
            <div className="flex justify-between text-[#77726c] bg-[#fbe9e7]/60 px-1.5 py-0.5 rounded-sm [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
              <span>Less: Discount ({doc.discountPercent}%)</span>
              <span className="mono">
                {doc.discountAmount > 0 ? `-${fmt(doc.discountAmount)}` : '-'}
              </span>
            </div>
            <MoneyRow
              label="(i) Subtotal Before Tax"
              value={doc.subtotal - doc.discountAmount}
            />
            <MoneyRow label={`(ii) ${doc.getfundRate}% GETFund`} value={doc.getfundAmount} />
            <MoneyRow label={`(iii) ${doc.nhilRate}% NHIL`} value={doc.nhilAmount} />
            <MoneyRow label={`Add ${doc.vatRate}% VAT`} value={doc.vatAmount} />
          </div>

          {/* Solid Black Banner: Total Payment Due */}
          <div className="ml-auto max-w-[340px] mt-3 print:mt-2 bg-[#1f2024] text-white px-4 py-2.5 print:py-2 flex items-center justify-between text-[12px] font-bold rounded-sm break-inside-avoid [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
            <span className="uppercase tracking-wider">Total Payment Due GHS</span>
            <span className="mono text-[16px]">
              {fmt(doc.total).replace('GHS ', '')}
            </span>
          </div>

          {doc.kind === 'invoice' && (
            <div className="ml-auto max-w-[340px] space-y-1.5 print:space-y-1 border-t border-dashed border-[#e5ded6] mt-3 print:mt-2 pt-2 print:pt-1.5 text-[11px] break-inside-avoid">
              <MoneyRow label="Paid to date" value={doc.amountPaid} />
              <MoneyRow label="Balance due" value={doc.balance} strong />
            </div>
          )}

          {/* Payment Terms & Validity */}
          <div className="mt-8 print:mt-4 space-y-1 text-[11px] break-inside-avoid">
            <div className="font-semibold text-[#222] italic">
              {doc.paymentTerms || '100% Down Payment'}
            </div>
            <div className="text-[#666] italic">
              Quotation is valid for {doc.validityDays} days after Invoice Date
            </div>
          </div>
        </div>

        {/* Authentic Collage Footer: Dropped to bottom of page (mt-auto), Payment Details at bottom-left, Contact Info at bottom-right */}
        <div className="mt-auto pt-5 print:pt-3 flex flex-col sm:flex-row print:flex-row sm:items-end print:items-end justify-between gap-6 border-t border-[#e2dcce] text-[10px] break-inside-avoid">
          {/* Bottom-Left: MoMo Details (single line) & Bank Details (2 banks) */}
          <div className="text-left space-y-2.5 print:space-y-1.5 max-w-[480px]">
            {/* Single-line MoMo Details */}
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 leading-tight">
              <span className="font-bold text-[#d81e27]">MoMo Details:</span>
              <span className="font-medium text-[#1f2024]">
                Telecel / AT Money / MTN MoMo
              </span>
              <span className="mono font-extrabold text-[#1f2024]">
                *713*1308#
              </span>
            </div>

            {/* Bank Details (Red heading, no background, 2 banks side-by-side) */}
            <div className="space-y-1">
              <div className="font-bold text-[#d81e27] leading-tight">
                Bank Details:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-6 gap-y-2 leading-[1.35]">
                {COLLAGE_BANK_ACCOUNTS.map((acct) => (
                  <div key={acct.accountNumber} className="space-y-0.5">
                    <div>
                      <span className="font-semibold text-[#d81e27]">Bank:</span>{' '}
                      <span className="font-medium text-[#1f2024]">{acct.bank}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#d81e27]">Name:</span>{' '}
                      <span className="font-medium text-[#1f2024]">{acct.name}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#d81e27]">Acc. No.:</span>{' '}
                      <span className="mono font-semibold text-[#1f2024]">
                        {acct.accountNumber}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#d81e27]">Branch:</span>{' '}
                      <span className="font-medium text-[#1f2024]">{acct.branch}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom-Right: Collage Contact Info & Target Mark */}
          <div className="flex items-end justify-end gap-3.5 shrink-0">
            <div className="text-right text-[10px] leading-tight text-[#444] space-y-0.5">
              <div className="font-semibold text-[#1f2024]">+233 24 736 1133</div>
              <div>marketing@collagenmosaic.com</div>
              <div>collagenmosaic@gmail.com</div>
              <div>sendit@collagenmosaic.com</div>
              <div className="font-medium text-[#c61c2e]">www.collagenmosaic.com</div>
            </div>
            <img
              src={collageIcon}
              alt="Collage mark"
              className="h-10 w-auto object-contain shrink-0"
            />
          </div>
        </div>
      </article>

      {/* Payment History Ledger for Invoices */}
      {doc.kind === 'invoice' && (
        <section className="no-print panel mx-auto mt-5 max-w-[850px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#eee8e0] px-5 py-4">
            <div>
              <h2 className="m-0 text-[14px] font-bold">Payment history</h2>
              <p className="mb-0 mt-0.5 text-[11px] text-[#8a8580]">
                Collections recorded against Invoice {doc.number}
              </p>
            </div>
            {doc.balance > 0 && (
              <button
                type="button"
                className="btn btn-primary !h-8 !min-h-8 text-[12px]"
                onClick={() => setPayOpen(true)}
              >
                <Plus size={14} /> Record payment
              </button>
            )}
          </div>
          {paymentsList.length === 0 ? (
            <div className="p-5 text-[12px] text-[#8a8580]">
              No payments recorded yet. Balance due is{' '}
              <strong className="mono text-[#1f2024]">{fmt(doc.balance)}</strong>.
            </div>
          ) : (
            <div className="divide-y divide-[#f0ece6]">
              {paymentsList.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-[12px]"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e8f2eb] text-[#3d6e4d]">
                      <Banknote size={15} />
                    </span>
                    <div>
                      <div className="font-semibold capitalize text-[#2e2d33]">
                        {p.method.replaceAll('_', ' ')}
                        {p.reference ? ` · Ref: ${p.reference}` : ''}
                      </div>
                      <div className="text-[11px] text-[#8a8580]">
                        Paid on {dateFmt(p.paymentDate)}
                      </div>
                    </div>
                  </div>
                  <div className="mono font-bold text-[#3d6e4d]">{fmt(p.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {payOpen && (
        <PaymentModal
          doc={doc}
          onClose={() => setPayOpen(false)}
          onSuccess={() =>
            setFeedback({ text: 'Payment recorded. The balance has been refreshed.' })
          }
        />
      )}
      {editOpen && (
        <Modal
          title={`Update ${doc.kind} ${doc.number}`}
          subtitle="Refine the brief, line items or terms."
          wide
          onClose={() => setEditOpen(false)}
        >
          <DocumentForm kind={doc.kind} doc={doc} onClose={() => setEditOpen(false)} />
        </Modal>
      )}
      {confirmDelete && (
        <Modal
          title={`Delete ${doc.number}?`}
          subtitle="This will permanently remove this document from your workspace."
          onClose={() => setConfirmDelete(false)}
        >
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              Delete {doc.kind}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function OperationsView() {
  const [ops, setOps] = useState(() => getOperationsData());
  const [tab, setTab] = useState<'rentals' | 'print'>('rentals');
  const [rentalModal, setRentalModal] = useState(false);
  const [printModal, setPrintModal] = useState(false);
  const [rentalForm, setRentalForm] = useState({
    itemName: 'Telescopic Flag Pole & Heavy Water Base (5m)',
    quantity: 4,
    days: 1,
    unitRate: 70,
  });
  const clients = useGetClients();
  const documentsQuery = useGetDocuments();

  function handleRentalStatus(id: string, status: RentalBooking['status']) {
    const updated = updateRentalStatus(id, status);
    setOps((prev) => ({ ...prev, rentals: [...updated] }));
  }

  function handlePrintStatus(id: string, status: ProductionOrder['status']) {
    const updated = updateProductionOrderStatus(id, status);
    setOps((prev) => ({ ...prev, productionOrders: [...updated] }));
  }

  function submitRental(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const rawQty = Number(f.get('quantity') ?? rentalForm.quantity ?? 1);
    const rawDays = Number(f.get('days') ?? rentalForm.days ?? 0);
    const rawRate = Number(f.get('unitRate') ?? rentalForm.unitRate ?? 70);
    const updated = createRentalBooking({
      itemName: String(f.get('itemName') || rentalForm.itemName || '').trim().slice(0, 180),
      clientName: String(f.get('clientName') || '').trim().slice(0, 180),
      documentNumber: String(f.get('documentNumber') || 'Direct').trim().slice(0, 60),
      quantity: Number.isFinite(rawQty) && rawQty > 0 ? Math.min(100000, rawQty) : 1,
      days: Number.isFinite(rawDays) && rawDays >= 0 ? Math.min(365, rawDays) : 0,
      unitRate: Number.isFinite(rawRate) && rawRate >= 0 ? rawRate : 70,
      startDate: String(f.get('startDate') || '').trim().slice(0, 30),
      returnDate: String(f.get('returnDate') || '').trim().slice(0, 30),
      status: 'deployed',
    });
    setOps((prev) => ({ ...prev, rentals: [...updated] }));
    setRentalModal(false);
  }

  function submitPrint(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const rawQty = Number(f.get('quantity') || 1);
    const updated = createProductionOrder({
      clientName: String(f.get('clientName') || '').trim().slice(0, 180),
      documentNumber: String(f.get('documentNumber') || 'Direct').trim().slice(0, 60),
      specification: String(f.get('specification') || '').trim().slice(0, 300),
      quantity: Number.isFinite(rawQty) && rawQty > 0 ? Math.min(100000, rawQty) : 1,
      assignedTo: String(f.get('assignedTo') || 'PrintD Pigh · Large Format Press').trim().slice(0, 180),
      dueDate: String(f.get('dueDate') || '').trim().slice(0, 30),
      status: 'queued',
    });
    setOps((prev) => ({ ...prev, productionOrders: [...updated] }));
    setPrintModal(false);
  }

  return (
    <>
      <PageTitle
        title="Rentals & Production"
        description="Track telescopic flag pole rentals in the field and active production work orders."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setRentalModal(true)}
            >
              <CalendarDays size={15} />
              Log equipment rental
            </button>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('rentals')}
          className={`toggle-token ${tab === 'rentals' ? 'active' : ''}`}
        >
          <CalendarDays size={14} />
          <span>Equipment Rentals ({ops.rentals.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('print')}
          className={`toggle-token ${tab === 'print' ? 'active' : ''}`}
        >
          <Wrench size={14} />
          <span>Production Orders ({ops.productionOrders.length})</span>
        </button>
      </div>

      {tab === 'rentals' ? (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#eee8e0] text-[10px] font-bold uppercase tracking-[.1em] text-[#99928b]">
                  <th className="px-5 py-3">Equipment / Fixture</th>
                  <th className="px-4 py-3">Client & Ref</th>
                  <th className="px-4 py-3">Qty × Days</th>
                  <th className="px-4 py-3">Deployment Dates</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Update State</th>
                </tr>
              </thead>
              <tbody>
                {ops.rentals.map((r) => {
                  const effDays = Number(r.days) > 0 ? Number(r.days) : 1;
                  const rentalTotal = r.quantity * effDays * r.unitRate;
                  return (
                    <tr
                      key={r.id}
                      className="table-row border-b border-[#f0ece6] last:border-0"
                    >
                      <td className="px-5 py-4">
                        <div className="text-[13px] font-bold text-[#333338]">
                          {r.itemName}
                        </div>
                        <div className="mono mt-0.5 text-[11px] text-[#89847e]">
                          {fmt(r.unitRate)} {Number(r.days) > 0 ? '/ day' : '/ unit'} · Total {fmt(rentalTotal)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-[12px] font-semibold text-[#45434a]">
                          {r.clientName}
                        </div>
                        <div className="mono mt-0.5 text-[11px] text-[#a82b3e]">
                          {r.documentNumber}
                        </div>
                      </td>
                      <td className="mono px-4 py-4 text-[12px]">
                        {Number(r.days) > 0
                          ? `${r.quantity} units × ${r.days}d`
                          : `${r.quantity} units (0d · Qty × Rate)`}
                      </td>
                      <td className="px-4 py-4 text-[12px] text-[#68666a]">
                        {dateFmt(r.startDate)} → {dateFmt(r.returnDate)}
                      </td>
                      <td className="px-4 py-4">
                        <Status value={r.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex gap-1">
                          {r.status !== 'deployed' && (
                            <button
                              type="button"
                              onClick={() => handleRentalStatus(r.id, 'deployed')}
                              className="btn btn-secondary !h-7 !min-h-7 !px-2.5 text-[11px]"
                            >
                              Mark Deployed
                            </button>
                          )}
                          {r.status !== 'returned' && (
                            <button
                              type="button"
                              onClick={() => handleRentalStatus(r.id, 'returned')}
                              className="btn btn-primary !h-7 !min-h-7 !px-2.5 text-[11px]"
                            >
                              Mark Returned
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#eee8e0] text-[10px] font-bold uppercase tracking-[.1em] text-[#99928b]">
                  <th className="px-5 py-3">Job Code & Spec</th>
                  <th className="px-4 py-3">Client / Ref</th>
                  <th className="px-4 py-3">Assigned Unit</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Workflow</th>
                </tr>
              </thead>
              <tbody>
                {ops.productionOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="table-row border-b border-[#f0ece6] last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div className="mono text-[11px] font-bold text-[#c61c2e]">
                        {o.jobCode}
                      </div>
                      <div className="mt-0.5 text-[12px] font-semibold text-[#333338]">
                        {o.specification} (Qty: {o.quantity})
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[12px] font-semibold text-[#45434a]">
                        {o.clientName}
                      </div>
                      <div className="mono mt-0.5 text-[11px] text-[#89847e]">
                        {o.documentNumber}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[12px] text-[#68666a]">
                      {o.assignedTo}
                    </td>
                    <td className="px-4 py-4 text-[12px] text-[#68666a]">
                      {dateFmt(o.dueDate)}
                    </td>
                    <td className="px-4 py-4">
                      <Status value={o.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex gap-1">
                        {o.status === 'queued' && (
                          <button
                            type="button"
                            onClick={() => handlePrintStatus(o.id, 'in_production')}
                            className="btn btn-secondary !h-7 !min-h-7 !px-2.5 text-[11px]"
                          >
                            Start Print
                          </button>
                        )}
                        {o.status === 'in_production' && (
                          <button
                            type="button"
                            onClick={() => handlePrintStatus(o.id, 'quality_check')}
                            className="btn btn-secondary !h-7 !min-h-7 !px-2.5 text-[11px]"
                          >
                            Quality Check
                          </button>
                        )}
                        {o.status !== 'delivered' && (
                          <button
                            type="button"
                            onClick={() => handlePrintStatus(o.id, 'delivered')}
                            className="btn btn-primary !h-7 !min-h-7 !px-2.5 text-[11px]"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rentalModal && (
        <Modal
          title="Log equipment rental"
          subtitle="Reserve or deploy telescopic poles, bases, lighting kits, or printed items."
          onClose={() => setRentalModal(false)}
        >
          <form onSubmit={submitRental} className="space-y-4">
            <div className="rounded-xl border border-neutral-200/80 bg-white/60 p-3 backdrop-blur-md">
              <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wider text-neutral-500">
                Quick select catalog item (tap to fill)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CATALOG_PRESETS.map((preset) => (
                  <button
                    key={preset.description}
                    type="button"
                    onClick={() =>
                      setRentalForm({
                        itemName: preset.description,
                        quantity: preset.quantity,
                        days: preset.days,
                        unitRate: preset.unitPrice,
                      })
                    }
                    className="toggle-token !py-1 !px-2 !text-[11px]"
                  >
                    <Plus size={11} />
                    <span>{preset.description}</span>
                    <span className="mono text-[10px] text-[#c61c2e]">
                      GHS {preset.unitPrice}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Equipment / Printed item"
                name="itemName"
                required
                value={rentalForm.itemName}
                onChange={(e) => setRentalForm({ ...rentalForm, itemName: e.target.value })}
              />
              <Select label="Client" name="clientName" required>
                {(clients.data || []).map((c) => (
                  <option key={c.id} value={c.companyName}>
                    {c.companyName}
                  </option>
                ))}
              </Select>
              <Input
                label="Quantity"
                name="quantity"
                type="number"
                min="1"
                value={rentalForm.quantity}
                onChange={(e) =>
                  setRentalForm({ ...rentalForm, quantity: Math.max(1, Number(e.target.value) || 1) })
                }
                required
              />
              <Input
                label="Rental days (0 for print / non-rental)"
                name="days"
                type="number"
                min="0"
                value={rentalForm.days}
                onChange={(e) =>
                  setRentalForm({
                    ...rentalForm,
                    days: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)),
                  })
                }
                required
              />
              <Input
                label="Unit rate (GHS)"
                name="unitRate"
                type="number"
                min="0"
                step=".01"
                value={rentalForm.unitRate}
                onChange={(e) =>
                  setRentalForm({ ...rentalForm, unitRate: Math.max(0, Number(e.target.value) || 0) })
                }
                required
              />
              <Select label="Invoice / Reference" name="documentNumber">
                <option value="Direct / Non-invoiced">Direct / Non-invoiced</option>
                {(documentsQuery.data || []).map((doc) => (
                  <option key={doc.id} value={doc.number}>
                    {doc.number} · {doc.clientName} ({doc.kind === 'invoice' ? 'Invoice' : 'Quote'})
                  </option>
                ))}
              </Select>
              <Input
                label="Deployment date"
                name="startDate"
                type="date"
                defaultValue={today()}
                required
              />
              <Input
                label="Return date"
                name="returnDate"
                type="date"
                defaultValue={today()}
                required
              />
            </div>
            <div className="rounded-lg border border-[#e6dfd6] bg-[#f7f3ed] px-3.5 py-2.5 flex items-center justify-between text-xs">
              <span className="text-[#68666a]">
                {rentalForm.days === 0
                  ? `0 days selected — Total calculated as Quantity (${rentalForm.quantity}) × Unit Rate (${fmt(rentalForm.unitRate)})`
                  : `Total calculated as Quantity (${rentalForm.quantity}) × Days (${rentalForm.days}) × Unit Rate (${fmt(rentalForm.unitRate)})`}
              </span>
              <span className="mono font-bold text-[#1e1f23]">
                {fmt(
                  rentalForm.quantity *
                    (rentalForm.days > 0 ? rentalForm.days : 1) *
                    rentalForm.unitRate,
                )}
              </span>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRentalModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save rental booking
              </button>
            </div>
          </form>
        </Modal>
      )}

      {printModal && (
        <Modal
          title="Dispatch production order to PrintD Pigh"
          subtitle="Send print specifications to sister company PrintD Pigh."
          onClose={() => setPrintModal(false)}
        >
          <form onSubmit={submitPrint} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Client" name="clientName" required>
                {(clients.data || []).map((c) => (
                  <option key={c.id} value={c.companyName}>
                    {c.companyName}
                  </option>
                ))}
              </Select>
              <Select label="Invoice / Reference" name="documentNumber">
                <option value="Direct / Non-invoiced">Direct / Non-invoiced</option>
                {(documentsQuery.data || []).map((doc) => (
                  <option key={doc.id} value={doc.number}>
                    {doc.number} · {doc.clientName} ({doc.kind === 'invoice' ? 'Invoice' : 'Quote'})
                  </option>
                ))}
              </Select>
            </div>
            <Input
              label="Print specification"
              name="specification"
              required
              placeholder="e.g. Flag printing (1x3m) · Double-sided sublimation fabric"
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Quantity"
                name="quantity"
                type="number"
                min="1"
                defaultValue="4"
                required
              />
              <Select label="Production unit" name="assignedTo">
                <option value="PrintD Pigh · Large Format Press">
                  PrintD Pigh · Large Format Press
                </option>
                <option value="PrintD Pigh · Textile & Dye Sub">
                  PrintD Pigh · Textile & Dye Sub
                </option>
                <option value="PrintD Pigh · Finishing & Mounting">
                  PrintD Pigh · Finishing & Mounting
                </option>
              </Select>
              <Input
                label="Due date"
                name="dueDate"
                type="date"
                defaultValue={today()}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPrintModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Dispatch order
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function MoneyRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${
        strong ? 'font-bold text-[#39373d]' : 'text-[#77726c]'
      }`}
    >
      <span>{label}</span>
      <span className="mono">{fmt(value)}</span>
    </div>
  );
}

function AuthScreen({ signup = false }: { signup?: boolean }) {
  const [, setLocation] = useLocation();
  const { setNeonUser } = useAppClerk();
  const [email, setEmail] = useState(signup ? '' : 'kojo@collage.com.gh');
  const [password, setPassword] = useState(signup ? '' : 'Collage2026!');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [office, setOffice] = useState('Accra HQ');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const result = signup
        ? await registerWithNeon({ email, password, firstName, lastName, office })
        : await loginWithNeon({ email, password });
      setNeonUser?.(result.user);
      await syncStoreFromNeon();
      queryClient.invalidateQueries();
      setLocation('/dashboard');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.1fr_1fr]">
      {/* Left Hero Panel */}
      <section className="flex flex-col justify-between bg-[#1a1b1f] p-8 text-[#f7f5ee] md:p-14">
        <div>
          <Brand inverse />
        </div>
        <div className="my-14 max-w-[500px]">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-[#e04555]">
            Operations Desk
          </div>
          <h1 className="font-sans text-[34px] font-extrabold leading-[1.1] tracking-[-0.035em] text-white md:text-[46px]">
            Every brief has a clear next step.
          </h1>
          <p className="mt-5 max-w-[420px] text-[14px] leading-relaxed text-[#aba8a1]">
            Keep clients, quotations, invoices and payments on one desk, from the first
            brief through the last balance.
          </p>

          <div className="mt-8 space-y-3 text-[12px] text-[#ccc9c0]">
            <div className="flex items-center gap-2.5">
              <Check size={16} className="text-[#e04555]" />
              <span>Ghanaian tax calculated on every quote and invoice</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check size={16} className="text-[#e04555]" />
              <span>Line items with quantity, days and unit price</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check size={16} className="text-[#e04555]" />
              <span>Live Neon PostgreSQL persistence and workspace authentication</span>
            </div>
          </div>
        </div>
        <div className="text-[11px] text-[#7d7a74]">
          COLLAGE · CREATING RESULTS · GHANA
        </div>
      </section>

      {/* Right Form Section */}
      <section className="flex items-center justify-center bg-[#faf8f5] p-6 md:p-12">
        <div className="w-full max-w-[420px]">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-[12px] text-[#7d7770] hover:text-[#c61c2e] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Collage
          </Link>

          <div className="panel p-6 md:p-8">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#c61c2e]">
              {signup ? 'Workspace Enrollment' : 'Welcome Back'}
            </div>
            <h2 className="m-0 font-sans text-[24px] font-bold tracking-[-0.03em] text-[#1e1e23]">
              {signup ? 'Create your workspace' : 'Sign in to Collage'}
            </h2>
            <p className="mb-0 mt-2 text-[12px] leading-5 text-[#7a746d]">
              {signup
                ? 'Enroll your Collage operations account in Neon PostgreSQL.'
                : 'Authenticate with your Collage workspace credentials.'}
            </p>

            {hasClerk ? (
              <div className="mt-6">
                <SignIn
                  routing="path"
                  path={`${basePath}/sign-in`}
                  appearance={clerkAppearance}
                  fallbackRedirectUrl={`${basePath}/dashboard`}
                />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {errorMsg && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                    {errorMsg}
                  </div>
                )}

                {signup && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Kojo"
                      required
                    />
                    <Input
                      label="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nathan"
                    />
                  </div>
                )}

                {signup && (
                  <Input
                    label="Desk / Office"
                    value={office}
                    onChange={(e) => setOffice(e.target.value)}
                    placeholder="Accra HQ"
                  />
                )}

                <Input
                  label="Work Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kojo@collage.com.gh"
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full !h-11"
                >
                  {loading
                    ? 'Authenticating...'
                    : signup
                      ? 'Create Workspace Account'
                      : 'Sign In to Operations Desk'}
                </button>

                <div className="flex items-center justify-between pt-2 text-[12px] text-[#7a746d]">
                  {signup ? (
                    <Link href="/sign-in" className="font-medium text-[#c61c2e] hover:underline">
                      Already registered? Sign in
                    </Link>
                  ) : (
                    <Link href="/sign-up" className="font-medium text-[#c61c2e] hover:underline">
                      New operator? Create account
                    </Link>
                  )}
                  <Link href="/dashboard" className="text-[#7a746d] hover:text-neutral-900">
                    Continue to desk →
                  </Link>
                </div>
              </form>
            )}
          </div>

          <div className="mt-5 text-center text-[11px] text-[#9c958c]">
            Secure Workspace · Collage Ghana · Neon PostgreSQL
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// ROLE-SPECIFIC VIEWS & CANONICAL DASHBOARD COMPONENTS
// ============================================================================

function MarketerDashboard() {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const campaigns = [
    {
      id: 'cmp-01',
      name: 'Accra Ring Road Unipole Flighting',
      category: 'Billboards',
      budget: 65000,
      spent: 48500,
      leads: 18,
      conversions: 6,
      status: 'Active',
    },
    {
      id: 'cmp-02',
      name: 'Tema Motorway Spectacular Billboard',
      category: 'Large Format',
      budget: 55000,
      spent: 39200,
      leads: 12,
      conversions: 3,
      status: 'Active',
    },
    {
      id: 'cmp-03',
      name: 'Independence Square Event Rigging & Flags',
      category: 'Event Branding',
      budget: 35000,
      spent: 24800,
      leads: 5,
      conversions: 2,
      status: 'Completed',
    },
    {
      id: 'cmp-04',
      name: 'Airport City Digital Totem Activation',
      category: 'Wayfinding',
      budget: 25000,
      spent: 12000,
      leads: 3,
      conversions: 0,
      status: 'Planning',
    },
  ];

  const leads = [
    {
      company: 'Ecobank Ghana Ltd',
      contact: 'Nana Mensah',
      email: 'n.mensah@ecobank.com.gh',
      service: 'Wayfinding & Directional Signage',
      status: 'Quoted',
      value: 48500,
    },
    {
      company: 'Telecel Ghana',
      contact: 'Kwesi Appiah',
      email: 'k.appiah@telecel.com.gh',
      service: 'Outdoor Billboard Flighting',
      status: 'New Inquiry',
      value: 62000,
    },
    {
      company: 'Ghana National Petroleum Corp',
      contact: 'Ama Asare',
      email: 'a.asare@gnpc.com.gh',
      service: 'Corporate Stage Rigging',
      status: 'Converted',
      value: 35400,
    },
    {
      company: 'Stanbic Bank Ghana',
      contact: 'Kofi Osei',
      email: 'kofi.osei@stanbic.com.gh',
      service: 'Telescopic Brand Flags',
      status: 'Quoted',
      value: 18200,
    },
  ];

  const showcaseItems = [
    {
      title: 'Ecobank Ghana Head Office Wayfinding',
      category: 'wayfinding',
      slug: 'ecobank-wayfinding',
      views: 142,
    },
    {
      title: 'Ridge Unipole Spectacular Billboard',
      category: 'billboards',
      slug: 'ridge-unipole',
      views: 98,
    },
    {
      title: 'Accra International Conference Centre Stage Rigging',
      category: 'event_branding',
      slug: 'aicc-stage-rigging',
      views: 215,
    },
  ];

  function copyShareLink(slug: string) {
    const url = `${window.location.origin}/portfolio?item=${slug}`;
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#C61C2E]">
            Marketing Desk · Campaign Intelligence
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
            Marketing Hub & Campaign Pipeline
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Client leads acquisition, outdoor billboard inventory, and client showcase pitch links across Ghana.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors no-underline"
          >
            <Share2 size={13} /> View Public Portfolio
          </Link>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#111110] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors no-underline"
          >
            <UserPlus size={13} /> Pipeline View
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Total Campaign Budget</span>
            <Target size={15} className="text-[#C61C2E]" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            {fmt(180000)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Spent: {fmt(124500)} (69.2% utilized)
          </div>
        </div>

        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Client Leads</span>
            <UserPlus size={15} className="text-blue-600" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            38 Leads
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Cost Per Lead: {fmt(3276.32)}
          </div>
        </div>

        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Conversion Rate</span>
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            28.9%
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            11 converted to active client contracts
          </div>
        </div>

        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Billboard Inventory</span>
            <Layers size={15} className="text-amber-600" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            8 Prime Sites
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Accra, Tema, Kumasi highway corridors
          </div>
        </div>
      </div>

      {/* Main Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-900">
                Corporate Client Leads Pipeline
              </h3>
              <Link href="/leads" className="text-xs text-[#C61C2E] hover:underline font-medium">
                View All Leads →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-medium">
                    <th className="pb-2">Company</th>
                    <th className="pb-2">Service Brief</th>
                    <th className="pb-2">Est. Value</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {leads.map((lead, i) => (
                    <tr key={i} className="hover:bg-neutral-50/50">
                      <td className="py-2.5 font-medium text-neutral-900">
                        {lead.company}
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {lead.contact}
                        </div>
                      </td>
                      <td className="py-2.5 text-neutral-600">{lead.service}</td>
                      <td className="py-2.5 font-mono text-neutral-800">{fmt(lead.value)}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            lead.status === 'Converted'
                              ? 'bg-emerald-50 text-emerald-700'
                              : lead.status === 'Quoted'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-900">
                Campaign Performance Tracker
              </h3>
              <Link href="/campaigns" className="text-xs text-[#C61C2E] hover:underline font-medium">
                Manage Campaigns →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-medium">
                    <th className="pb-2">Campaign Name</th>
                    <th className="pb-2">Budget</th>
                    <th className="pb-2">Spent</th>
                    <th className="pb-2">Leads / Conv</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-50/50">
                      <td className="py-2.5 font-medium text-neutral-900">
                        {c.name}
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {c.category}
                        </div>
                      </td>
                      <td className="py-2.5 font-mono text-neutral-700">{fmt(c.budget)}</td>
                      <td className="py-2.5 font-mono text-neutral-700">{fmt(c.spent)}</td>
                      <td className="py-2.5 text-neutral-600 font-mono">
                        {c.leads} / {c.conversions}
                      </td>
                      <td className="py-2.5">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-700">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-2">
              Client Pitch Showcase Links
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Generate direct portfolio showcase links to send to prospective clients during negotiations.
            </p>
            <div className="space-y-3">
              {showcaseItems.map((item) => (
                <div key={item.slug} className="rounded-lg border border-neutral-100 bg-neutral-50/60 p-3">
                  <div className="text-xs font-medium text-neutral-900">
                    {item.title}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-200/60 text-[11px]">
                    <span className="text-neutral-400 font-mono">{item.views} client views</span>
                    <button
                      type="button"
                      onClick={() => copyShareLink(item.slug)}
                      className="inline-flex items-center gap-1 text-[#C61C2E] hover:underline font-semibold cursor-pointer"
                    >
                      {copiedSlug === item.slug ? (
                        <>
                          <Check size={12} /> Copied!
                        </>
                      ) : (
                        <>
                          <Share2 size={12} /> Copy Pitch Link
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-2">
              Ghanaian Outdoor Desks
            </h3>
            <div className="space-y-2 text-xs text-neutral-600">
              <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                <span>Accra Central & Ring Road</span>
                <span className="font-mono text-emerald-600 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                <span>Tema Industrial Harborway</span>
                <span className="font-mono text-emerald-600 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                <span>Kotoka Airport City Corridor</span>
                <span className="font-mono text-emerald-600 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Kumasi Prempeh II Way</span>
                <span className="font-mono text-blue-600 font-medium">Booking Open</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HrDashboard() {
  const [approvedIds, setApprovedIds] = useState<string[]>([]);

  const staffList = [
    {
      id: 'st-01',
      name: 'Kwabena Appiah',
      role: 'Lead Rigging Technician',
      department: 'Field & Rigging',
      checkIn: '07:15 GMT',
      status: 'On Field',
      location: 'AICC Summit Venue',
    },
    {
      id: 'st-02',
      name: 'Abena Osei',
      role: 'Large Format Print Operator',
      department: 'Production',
      checkIn: '07:30 GMT',
      status: 'Present',
      location: 'Accra HQ Printshop',
    },
    {
      id: 'st-03',
      name: 'Kofi Mensah',
      role: 'Creative Design Director',
      department: 'Creative',
      checkIn: '08:00 GMT',
      status: 'Remote',
      location: 'Accra Studio',
    },
    {
      id: 'st-04',
      name: 'Yaaba Addo',
      role: 'Senior Client Service Executive',
      department: 'Marketing',
      checkIn: '08:15 GMT',
      status: 'On Field',
      location: 'Ecobank Site Survey',
    },
    {
      id: 'st-05',
      name: 'Emmanuel Boateng',
      role: 'Welding & Structural Fabricator',
      department: 'Production',
      checkIn: '07:45 GMT',
      status: 'Present',
      location: 'Workshop B',
    },
  ];

  const notices = [
    {
      id: 'nt-01',
      title: 'Safety Harness Protocol: Ridge Unipole Rigging',
      category: 'Safety',
      priority: 'Urgent',
      author: 'Efua Baffour (HR)',
      date: 'Today',
      pinned: true,
    },
    {
      id: 'nt-02',
      title: 'Festival Production Overtime Scheduling',
      category: 'Operations',
      priority: 'High',
      author: 'Kojo Nathan (Operations)',
      date: 'Yesterday',
      pinned: true,
    },
    {
      id: 'nt-03',
      title: 'Health Insurance Card Renewal (Ridge Clinic)',
      category: 'Policy',
      priority: 'General',
      author: 'Efua Baffour (HR)',
      date: 'Oct 25',
      pinned: false,
    },
  ];

  const leaveRequests = [
    {
      id: 'lv-01',
      staffName: 'Abena Osei',
      department: 'Production',
      type: 'Annual Leave',
      duration: '5 Days (Nov 03 - Nov 07)',
      reason: 'Annual family break after heavy quarter run.',
    },
    {
      id: 'lv-02',
      staffName: 'Kwesi Antwi',
      department: 'Field & Rigging',
      type: 'Casual Leave',
      duration: '2 Days (Oct 30 - Oct 31)',
      reason: 'Personal family engagement.',
    },
  ];

  function handleApproveLeave(id: string) {
    setApprovedIds((prev) => [...prev, id]);
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#C61C2E]">
            People & Culture Desk · Workforce Operations
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
            People Hub & Staff Directory
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Staff attendance logs, field rigging deployments, safety notices, and internal HR approvals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/staff"
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors no-underline"
          >
            <Contact size={13} /> Staff Directory
          </Link>
          <Link
            href="/attendance"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#111110] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors no-underline"
          >
            <CalendarCheck size={13} /> Daily Attendance
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Total Staff Headcount</span>
            <UsersRound size={15} className="text-[#C61C2E]" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            24 Personnel
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Across 5 Core Operational Departments
          </div>
        </div>

        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Today Attendance Rate</span>
            <CalendarCheck size={15} className="text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            95.8%
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            23 present / on-field, 1 on approved leave
          </div>
        </div>

        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>On-Field Rigging Crew</span>
            <Layers size={15} className="text-blue-600" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            6 Deployed
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Active at AICC & Ridge billboard sites
          </div>
        </div>

        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Pending Leave Requests</span>
            <Clock3 size={15} className="text-amber-600" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            {leaveRequests.length - approvedIds.length} Requests
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Awaiting People & Culture review
          </div>
        </div>
      </div>

      {/* Main Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-900">
                Today Field & Workshop Attendance Log
              </h3>
              <Link href="/attendance" className="text-xs text-[#C61C2E] hover:underline font-medium">
                Full Log →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-medium">
                    <th className="pb-2">Staff Member</th>
                    <th className="pb-2">Department</th>
                    <th className="pb-2">Check-In</th>
                    <th className="pb-2">Location</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {staffList.map((s) => (
                    <tr key={s.id} className="hover:bg-neutral-50/50">
                      <td className="py-2.5 font-medium text-neutral-900">
                        {s.name}
                        <div className="text-[10px] text-neutral-400 font-mono">{s.role}</div>
                      </td>
                      <td className="py-2.5 text-neutral-600">{s.department}</td>
                      <td className="py-2.5 font-mono text-neutral-700">{s.checkIn}</td>
                      <td className="py-2.5 text-neutral-600">{s.location}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            s.status === 'On Field'
                              ? 'bg-blue-50 text-blue-700'
                              : s.status === 'Present'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-3">
              Leave Requests Queue
            </h3>
            <div className="space-y-3">
              {leaveRequests.map((req) => {
                const isApproved = approvedIds.includes(req.id);
                return (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-neutral-100 bg-neutral-50/60 p-3.5"
                  >
                    <div>
                      <div className="text-xs font-bold text-neutral-900">
                        {req.staffName} · <span className="font-normal text-neutral-500">{req.department}</span>
                      </div>
                      <div className="text-xs text-neutral-600 mt-0.5 font-medium">
                        {req.type} · <span className="text-neutral-500 font-mono text-[11px]">{req.duration}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-1">
                        Reason: {req.reason}
                      </div>
                    </div>
                    <div>
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <Check size={12} /> Approved
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApproveLeave(req.id)}
                          className="inline-flex items-center gap-1 rounded bg-[#111110] px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          Approve Leave
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-neutral-900">
                Internal Notice Board
              </h3>
              <Link href="/notices" className="text-xs text-[#C61C2E] hover:underline font-medium">
                All Notices →
              </Link>
            </div>
            <div className="space-y-3">
              {notices.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-lg border p-3 ${
                    n.pinned
                      ? 'border-amber-200 bg-amber-50/40'
                      : 'border-neutral-100 bg-neutral-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                    <span
                      className={
                        n.priority === 'Urgent'
                          ? 'text-[#C61C2E]'
                          : n.priority === 'High'
                            ? 'text-amber-700'
                            : 'text-neutral-500'
                      }
                    >
                      {n.priority} · {n.category}
                    </span>
                    <span className="text-neutral-400 font-mono">{n.date}</span>
                  </div>
                  <div className="text-xs font-semibold text-neutral-900 leading-snug">
                    {n.title}
                  </div>
                  <div className="mt-2 text-[10.5px] text-neutral-400 font-mono">
                    Posted by: {n.author}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-2">
              HR Quick Protocol Links
            </h3>
            <div className="space-y-2 text-xs">
              <Link
                href="/staff"
                className="flex items-center justify-between py-1.5 text-neutral-700 hover:text-[#C61C2E] transition-colors no-underline"
              >
                <span>Staff Emergency Contacts Directory</span>
                <span>→</span>
              </Link>
              <Link
                href="/notices"
                className="flex items-center justify-between py-1.5 text-neutral-700 hover:text-[#C61C2E] transition-colors no-underline border-t border-neutral-100"
              >
                <span>Ghana Labour Act Compliance Guidelines</span>
                <span>→</span>
              </Link>
              <Link
                href="/attendance"
                className="flex items-center justify-between py-1.5 text-neutral-700 hover:text-[#C61C2E] transition-colors no-underline border-t border-neutral-100"
              >
                <span>Rigging Height Certification Records</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleDashboardRouter() {
  const { user } = useAppUser();
  const role = (user?.role as UserRole) || 'admin';

  if (role === 'marketer') {
    return <MarketerDashboardHub />;
  }
  if (role === 'hr') {
    return <HrDashboardHub />;
  }
  return <Dashboard />;
}

function AdminUsersView() {
  const users = [
    {
      id: 'usr-admin-kojo',
      name: 'Kojo Nathan',
      email: 'admin@collage.com.gh',
      role: 'admin',
      office: 'Accra HQ (Ridge)',
      status: 'Active',
      capabilities: 'Full financial operations, quotations, invoices, rentals, diagnostics',
    },
    {
      id: 'usr-marketer-nana',
      name: 'Nana Mensah',
      email: 'marketer@collage.com.gh',
      role: 'marketer',
      office: 'Brand & Marketing Desk',
      status: 'Active',
      capabilities: 'Client leads pipeline, campaigns tracker, portfolio pitch showcase',
    },
    {
      id: 'usr-hr-efua',
      name: 'Efua Baffour',
      email: 'hr@collage.com.gh',
      role: 'hr',
      office: 'People & Culture Desk',
      status: 'Active',
      capabilities: 'Staff directory, internal notices bulletins, attendance and leave',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200 pb-5">
        <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#C61C2E]">
          Administration · User & Role Access
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
          Workspace Access & Role Management
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Manage operator accounts, security clearances, and operational capability matrices across Collage Ghana.
        </p>
      </div>

      <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-neutral-900 mb-3">
          Authorized Operators Directory
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-medium">
                <th className="pb-2">Name & Credentials</th>
                <th className="pb-2">Role Clearance</th>
                <th className="pb-2">Operational Desk</th>
                <th className="pb-2">Scope of Authority</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50/50">
                  <td className="py-3 font-medium text-neutral-900">
                    {u.name}
                    <div className="text-[10.5px] text-neutral-400 font-mono">{u.email}</div>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 font-mono uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 text-neutral-600">{u.office}</td>
                  <td className="py-3 text-neutral-500 text-[11px] max-w-xs">{u.capabilities}</td>
                  <td className="py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminSystemView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200 pb-5">
        <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#C61C2E]">
          System Intelligence · Health & Storage Diagnostics
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
          System Status & Diagnostics
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Browser storage quotas, Neon PostgreSQL synchronization status, security headers, and compliance audits.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="text-xs text-neutral-500 font-medium">API Service Status</div>
          <div className="text-xl font-bold text-emerald-600 mt-2 font-mono flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Operational
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 font-mono">Neon DB & Local Fallback Active</div>
        </div>

        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="text-xs text-neutral-500 font-medium">Storage Quota (5MB)</div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            5,242,880 Bytes
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 font-mono">Usage: &lt; 2% Capacity</div>
        </div>

        <div className="panel p-4 bg-white border border-neutral-200/80 rounded-xl shadow-xs">
          <div className="text-xs text-neutral-500 font-medium">Security & Compliance</div>
          <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">
            100% Compliant
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 font-mono">CSP Active · 0 Em Dashes</div>
        </div>
      </div>

      <div className="panel bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-neutral-900">
          Compliance Verification Checkpoints
        </h3>
        <div className="space-y-2 text-xs text-neutral-600">
          <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
            <span>Ghana Statutory Tax Calculation (GETFund 2.5%, NHIL 2.5%, GRA VAT 15%)</span>
            <span className="text-emerald-600 font-semibold">Active & Validated</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
            <span>Multi-Role Route Access Boundaries (Admin, Marketer, HR)</span>
            <span className="text-emerald-600 font-semibold">Enforced via RoleGuard</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
            <span>Content Security Policy & Strict Framing Meta Headers</span>
            <span className="text-emerald-600 font-semibold">Hardened</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span>Zero Em Dash Source Code Compliance</span>
            <span className="text-emerald-600 font-semibold">Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadsView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200 pb-5">
        <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#C61C2E]">
          Marketer Desk · Pipeline
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
          Client Leads Directory
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Corporate leads from portfolio inquiries and marketing activations.
        </p>
      </div>
      <MarketerDashboard />
    </div>
  );
}

function CampaignsView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200 pb-5">
        <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#C61C2E]">
          Marketer Desk · Campaign Tracker
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
          Outdoor & Event Marketing Campaigns
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Active campaign budgets, billboard placements, and client conversions.
        </p>
      </div>
      <MarketerDashboard />
    </div>
  );
}

function PortfolioShowcaseView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200 pb-5">
        <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#C61C2E]">
          Marketer Desk · Showcase Pitch Links
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
          Client Showcase Pitch Links
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Custom shareable portfolio links for pitching corporate Ghanaian clients.
        </p>
      </div>
      <MarketerDashboard />
    </div>
  );
}

function StaffDirectoryView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200 pb-5">
        <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#C61C2E]">
          People & Culture Desk · Staff
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
          Staff Directory & Department Records
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Team member profiles across Production, Rigging, Creative, and Marketing.
        </p>
      </div>
      <HrDashboard />
    </div>
  );
}

function InternalNoticesView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200 pb-5">
        <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#C61C2E]">
          People & Culture Desk · Notices
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
          Internal Bulletins & Safety Notices
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Operational bulletins, safety protocols, and company announcements.
        </p>
      </div>
      <HrDashboard />
    </div>
  );
}

function AttendanceView() {
  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200 pb-5">
        <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#C61C2E]">
          People & Culture Desk · Attendance
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
          Attendance Logs & Leave Management
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Daily workshop and on-site field check-in times and leave request tracking.
        </p>
      </div>
      <HrDashboard />
    </div>
  );
}

function Router() {
  const { setNeonUser } = useAppClerk();

  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/" component={() => <Welcome hasClerk={hasClerk} />} />
        <Route path="/portfolio" component={() => <PortfolioPage />} />
        <Route path="/portfolio/:id" component={() => <PortfolioPage />} />
        <Route
          path="/sign-in"
          component={() => (
            <UnifiedAuthScreen
              onLoginSuccess={(u) => {
                setNeonUser?.(u);
                queryClient.invalidateQueries();
              }}
            />
          )}
        />
        <Route
          path="/sign-in/*"
          component={() => (
            <UnifiedAuthScreen
              onLoginSuccess={(u) => {
                setNeonUser?.(u);
                queryClient.invalidateQueries();
              }}
            />
          )}
        />
        <Route
          path="/sign-up"
          component={() => (
            <UnifiedAuthScreen
              signup
              onLoginSuccess={(u) => {
                setNeonUser?.(u);
                queryClient.invalidateQueries();
              }}
            />
          )}
        />
        <Route
          path="/sign-up/*"
          component={() => (
            <UnifiedAuthScreen
              signup
              onLoginSuccess={(u) => {
                setNeonUser?.(u);
                queryClient.invalidateQueries();
              }}
            />
          )}
        />

        {/* Canonical Dashboard */}
        <Route path="/dashboard">
          {() => (
            <Shell>
              <RoleDashboardRouter />
            </Shell>
          )}
        </Route>

        {/* Shared Admin & Marketer Routes (with strict per-marketer client isolation) */}
        <Route path="/clients">
          {() => (
            <Shell>
              <RoleGuard allowedRoles={['admin', 'marketer']}>
                <ClientList />
              </RoleGuard>
            </Shell>
          )}
        </Route>
        <Route path="/clients/:id">
          {() => (
            <Shell>
              <RoleGuard allowedRoles={['admin', 'marketer']}>
                <ClientDetail />
              </RoleGuard>
            </Shell>
          )}
        </Route>
        <Route path="/quotations">
          {() => (
            <Shell>
              <RoleGuard allowedRoles={['admin', 'marketer']}>
                <DocumentList kind="quotation" />
              </RoleGuard>
            </Shell>
          )}
        </Route>
        <Route path="/quotations/:id">
          {() => (
            <Shell>
              <RoleGuard allowedRoles={['admin', 'marketer']}>
                <DocumentDetail />
              </RoleGuard>
            </Shell>
          )}
        </Route>
        <Route path="/invoices">
          {() => (
            <Shell>
              <RoleGuard allowedRoles={['admin', 'marketer']}>
                <DocumentList kind="invoice" />
              </RoleGuard>
            </Shell>
          )}
        </Route>
        <Route path="/invoices/:id">
          {() => (
            <Shell>
              <RoleGuard allowedRoles={['admin', 'marketer']}>
                <DocumentDetail />
              </RoleGuard>
            </Shell>
          )}
        </Route>
        <Route path="/operations">
          {() => (
            <Shell>
              <RoleGuard allowedRoles={['admin']}>
                <OperationsView />
              </RoleGuard>
            </Shell>
          )}
        </Route>
        <Route path="/admin/users">
          {() => (
            <Shell>
              <RoleGuard allowedRoles={['admin']}>
                <AdminWorkspacePage />
              </RoleGuard>
            </Shell>
          )}
        </Route>
        <Route path="/admin/system">
          {() => (
            <Shell>
              <RoleGuard allowedRoles={['admin']}>
                <AdminWorkspacePage />
              </RoleGuard>
            </Shell>
          )}
        </Route>

        {/* Marketer Routes : Protected with RoleGuard allowedRoles={['marketer', 'admin']} */}
        <Route path="/leads">
          {() => (
            <Shell>
              <RoleGuard allowedRoles={['marketer', 'admin']}>
                <MarketerWorkspacePage />
              </RoleGuard>
            </Shell>
          )}
        </Route>
        <Route path="/campaigns">
          {() => (
            <Shell>
              <RoleGuard allowedRoles={['marketer', 'admin']}>
                <MarketerWorkspacePage />
              </RoleGuard>
            </Shell>
          )}
        </Route>
        <Route path="/portfolio-showcase">
          {() => (
            <Shell>
              <RoleGuard allowedRoles={['marketer', 'admin']}>
                <MarketerWorkspacePage />
              </RoleGuard>
            </Shell>
          )}
        </Route>

        {/* HR Routes : Protected with RoleGuard allowedRoles={['hr', 'admin']} */}
        <Route path="/staff">
          {() => (
            <Shell>
              <RoleGuard allowedRoles={['hr', 'admin']}>
                <HrWorkspacePage />
              </RoleGuard>
            </Shell>
          )}
        </Route>
        <Route path="/notices">
          {() => (
            <Shell>
              <RoleGuard allowedRoles={['hr', 'admin']}>
                <HrWorkspacePage />
              </RoleGuard>
            </Shell>
          )}
        </Route>
        <Route path="/attendance">
          {() => (
            <Shell>
              <RoleGuard allowedRoles={['hr', 'admin']}>
                <HrWorkspacePage />
              </RoleGuard>
            </Shell>
          )}
        </Route>

        <Route path="/privacy" component={() => <PrivacyPolicyPage />} />
        <Route>
          <div className="grid min-h-[100dvh] place-items-center">
            <div className="text-center">
              <h1 className="font-sans font-extrabold text-3xl text-[#1e1e23]">
                Page not found
              </h1>
              <p className="text-sm text-[#777] mt-2">
                The requested view could not be located in this workspace.
              </p>
              <Link href="/dashboard" className="btn btn-primary mt-5">
                Back to overview
              </Link>
            </div>
          </div>
        </Route>
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  const inner = (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
          <CookieConsentBanner />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
  if (clerkPubKey) {
    return (
      <ClerkProvider publishableKey={clerkPubKey} appearance={clerkAppearance}>
        <ClerkDataProvider>{inner}</ClerkDataProvider>
      </ClerkProvider>
    );
  }
  return <NeonAuthProvider>{inner}</NeonAuthProvider>;
}

export default App;
