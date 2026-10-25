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
  Sparkles,
  Trash2,
  UserRound,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import collageLogo from './assets/collage-logo.png';
import { Brand } from '@/components/brand';
import { Welcome } from '@/pages/welcome';

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
  user: {
    firstName: 'Kojo',
    lastName: 'Admin',
    fullName: 'Kojo Admin',
    primaryEmailAddress: { emailAddress: 'admin@collage.com.gh' },
  },
};

type AppUser = typeof mockUser;
type AppClerkCtx = { signOut: (opts?: unknown) => void };

const AppUserContext = createContext<AppUser>(mockUser);
const AppClerkContext = createContext<AppClerkCtx>({
  signOut: () => {
    window.location.href = basePath || '/';
  },
});

function useAppUser() {
  return useContext(AppUserContext);
}
function useAppClerk() {
  return useContext(AppClerkContext);
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
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    borderRadius: '0.65rem',
  },
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

const dateFmt = (date?: string | null) =>
  date
    ? new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(date))
    : '-';

const today = () => new Date().toISOString().slice(0, 10);

const CATALOG_PRESETS = [
  { description: 'Polo rental', quantity: 4, days: 1, unitPrice: 70 },
  { description: 'Flag printing (1x3m)', quantity: 4, days: 1, unitPrice: 200 },
  {
    description: 'Logistics (Transpotation, Deployment)',
    quantity: 1,
    days: 1,
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
    days: 1,
    unitPrice: 1450,
  },
  {
    description: 'Exhibition LED Floodlight & Truss System Rental',
    quantity: 4,
    days: 2,
    unitPrice: 180,
  },
] as const;

const nav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/quotations', label: 'Quotations', icon: FileText },
  { href: '/invoices', label: 'Invoices', icon: ReceiptText },
  { href: '/operations', label: 'Rentals & Print', icon: Layers },
];

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
  const { signOut } = useAppClerk();

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

  const page = nav.find((x) => location.startsWith(x.href))?.label ?? 'Overview';

  function handleResetDemo() {
    resetErpDemoData();
    queryClient.invalidateQueries();
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2000);
  }

  return (
    <div className="app-shell flex">
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`sidebar fixed inset-y-0 left-0 z-40 flex w-[244px] flex-col bg-[#1a1b1f] px-4 py-5 text-[#f8f5ee] transition-transform md:sticky md:top-0 md:h-dvh md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <Link href="/">
            <Brand inverse />
          </Link>
          <button
            className="btn btn-quiet !px-2 !text-[#c5c1ba] md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mx-2 mb-2 mt-10 text-[10px] font-bold uppercase tracking-[.17em] text-[#77777b]">
          Workspace
        </div>
        <nav className="space-y-1" aria-label="Main navigation">
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
                className={`flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors ${
                  active
                    ? 'bg-[#33343a] text-white shadow-inner'
                    : 'text-[#aaa9a5] hover:bg-white/[.055] hover:text-white'
                }`}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span>{item.label}</span>
                {item.label === 'Invoices' && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#e53b50]" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mx-2 mb-3 mt-8 text-[10px] font-bold uppercase tracking-[.17em] text-[#77777b]">
          Your desk
        </div>
        <div className="mx-1 rounded-lg border border-white/[.08] bg-white/[.035] p-3.5">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#eeece5]">
            <ShieldCheck size={14} className="text-[#de4859]" />
            First things, in order
          </div>
          <p className="mb-0 mt-2 text-[11px] leading-[1.65] text-[#aaa8a2]">
            Keep every brief, quote, rental and payment connected to the right client.
          </p>
        </div>
        <div className="mt-auto border-t border-white/[.09] px-2 pt-4">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#393a3f] text-[11px] font-bold text-white">
              {user?.firstName?.slice(0, 1) || 'C'}
              {user?.lastName?.slice(0, 1) || ''}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12px] font-semibold">
                {isLoaded
                  ? user?.fullName || user?.firstName || 'Signed in'
                  : 'Loading profile…'}
              </div>
              <div className="truncate text-[10px] text-[#9b9994]">
                {user?.primaryEmailAddress?.emailAddress || 'Collage workspace'}
              </div>
            </div>
            <button
              aria-label="Sign out"
              title="Sign out"
              onClick={() => signOut({ redirectUrl: '/' })}
              className="btn btn-quiet ml-auto !h-8 !min-h-8 !px-2 !text-[#aaa8a2] hover:!text-white"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="no-print sticky top-0 z-20 flex h-[66px] items-center justify-between border-b border-[#e9e3dc] bg-[#f8f6f1]/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              className="btn btn-quiet !px-2 md:hidden"
            >
              <Menu size={19} />
            </button>
            <div className="text-[12px] text-[#8a8580]">
              Collage <ChevronRight size={13} className="mx-1 inline" />{' '}
              <span className="font-semibold text-[#38383d]">{page}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDemo}
              title="Restore initial sample records (including Invoice 00211026.01)"
              className="btn btn-quiet !h-8 !min-h-8 !px-2.5 text-[11px]"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">
                {resetDone ? 'Records restored' : 'Restore sample data'}
              </span>
            </button>
            <span className="hidden text-[11px] text-[#918c85] sm:block">
              Operations desk
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-full border border-[#e5ded6] bg-white text-[#55545a]">
              <UserRound size={15} />
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1360px] px-4 py-7 md:px-8 md:py-9">
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
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#c61c2e]">
            {eyebrow}
          </div>
        )}
        <h1 className="m-0 font-sans text-[28px] font-extrabold tracking-[-0.035em] text-[#1c1c21] md:text-[32px]">
          {title}
        </h1>
        {description && (
          <p className="mb-0 mt-1.5 text-[13px] text-[#736e67]">{description}</p>
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
      className="flex items-center gap-2 rounded-lg border border-[#f0d4d5] bg-[#fff5f3] p-3.5 text-[12px] text-[#9f2d3d]"
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
    <div className="grid min-h-[270px] place-items-center p-7 text-center">
      <div className="max-w-[340px]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#f3ede6] text-[#9c7468]">
          <Icon size={21} />
        </div>
        <h3 className="mb-1 mt-4 text-[15px] font-bold text-[#38383d]">{title}</h3>
        <p className="mb-4 mt-0 text-[12px] leading-5 text-[#89847e]">{detail}</p>
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
      ? 'bg-[#e8f2eb] text-[#3d6e4d]'
      : value === 'partially_paid' ||
          value === 'deployed' ||
          value === 'in_production' ||
          value === 'quality_check'
        ? 'bg-[#fff2df] text-[#a36c22]'
        : value === 'issued'
          ? 'bg-[#fcebed] text-[#c61c2e]'
          : value === 'declined' || value === 'archived' || value === 'cancelled'
            ? 'bg-[#f1efed] text-[#77716c]'
            : 'bg-[#f2eee7] text-[#83714e]';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${cls}`}
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
        <div className="flex items-start justify-between border-b border-[#eee8e0] px-5 py-4 md:px-6">
          <div>
            <h2
              id="dialog-title"
              className="m-0 font-sans text-[18px] font-bold tracking-[-0.025em] text-[#1f1e24]"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mb-0 mt-1 text-[12px] text-[#89847e]">{subtitle}</p>
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
  const create = useCreateClient();
  const update = useUpdateClient();
  const busy = create.isPending || update.isPending;
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const f = new FormData(e.currentTarget);
    const value = {
      companyName: String(f.get('companyName')).trim(),
      contactName: String(f.get('contactName') || '').trim() || null,
      email: String(f.get('email') || '').trim() || null,
      phone: String(f.get('phone') || '').trim() || null,
      address: String(f.get('address') || '').trim() || null,
      city: String(f.get('city') || '').trim() || null,
      country: String(f.get('country') || 'Ghana').trim(),
      status: String(f.get('status') || 'active') as ClientInput['status'],
    };
    const finish = (savedClient?: Client) => {
      setSuccess(true);
      qc.invalidateQueries({ queryKey: getGetClientsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      if (client) qc.invalidateQueries({ queryKey: getGetClientQueryKey(client.id) });
      if (savedClient && onCreated) onCreated(savedClient);
      setTimeout(onClose, 450);
    };
    try {
      if (client)
        update.mutate(
          { id: client.id, data: value },
          {
            onSuccess: (res) => finish(res),
            onError: () =>
              setError(
                'Could not save this client. Please check the details and try again.',
              ),
          },
        );
      else
        create.mutate(
          { data: value },
          {
            onSuccess: (res) => finish(res),
            onError: () =>
              setError('Could not create this client. Please try again.'),
          },
        );
    } catch {
      setError('Something went wrong. Please try again.');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Company or client name"
          name="companyName"
          required
          defaultValue={client?.companyName}
          placeholder="e.g. Eugenia / Ecobank Ghana"
        />
        <Input
          label="Contact person (Attn)"
          name="contactName"
          defaultValue={client?.contactName || ''}
          placeholder="Primary contact name"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          defaultValue={client?.email || ''}
          placeholder="name@company.com"
        />
        <Input
          label="Phone"
          name="phone"
          defaultValue={client?.phone || ''}
          placeholder="+233 24 000 0000"
        />
        <Input
          label="City"
          name="city"
          defaultValue={client?.city || 'Accra'}
          placeholder="Accra"
        />
        <Select label="Status" name="status" defaultValue={client?.status || 'active'}>
          <option value="active">Active</option>
          <option value="lead">Lead</option>
        </Select>
      </div>
      <Input
        label="Address"
        name="address"
        defaultValue={client?.address || ''}
        placeholder="Street address or landmark"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Country" name="country" defaultValue={client?.country || 'Ghana'} />
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
    payment.mutate(
      {
        id: doc.id,
        data: {
          amount: Number(amount),
          paymentDate,
          method,
          reference: reference.trim() || null,
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
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Client | undefined>();
  const [confirmArchive, setConfirmArchive] = useState<Client | undefined>();
  const [filter, setFilter] = useState('all');
  const qc = useQueryClient();
  const query = useGetClients();
  const archive = useArchiveClient();
  const updateClient = useUpdateClient();

  const allClients = query.data || [];
  const counts = {
    all: allClients.length,
    active: allClients.filter((c) => c.status === 'active').length,
    lead: allClients.filter((c) => c.status === 'lead').length,
    archived: allClients.filter((c) => c.status === 'archived').length,
  };

  const clients = allClients.filter(
    (c) =>
      (filter === 'all' || c.status === filter) &&
      `${c.companyName} ${c.contactName || ''} ${c.email || ''} ${c.phone || ''} ${c.city || ''}`
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

  return (
    <>
      <PageTitle
        eyebrow="Relationships"
        title="Clients"
        description="Keep every relationship, contact person and job history close at hand."
        action={
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditing(undefined);
              setModal(true);
            }}
          >
            <Plus size={16} />
            Add client
          </button>
        }
      />
      <div className="panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#eee8e0] px-4 py-4 lg:flex-row lg:items-center lg:justify-between md:px-5">
          <div className="relative w-full max-w-[350px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a958e]"
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
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['all', 'All clients', counts.all],
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
            title={search ? 'No matching clients' : 'A good relationship starts here'}
            detail={
              search
                ? 'Try another name, contact or city.'
                : 'Add your first client to keep requests, quotes and invoices connected.'
            }
            action={
              !search && (
                <button className="btn btn-primary" onClick={() => setModal(true)}>
                  <Plus size={15} />
                  Add first client
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#eee8e0] text-[10px] font-bold uppercase tracking-[.1em] text-[#99928b]">
                  <th className="px-5 py-3">Company / contact</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Email & phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr
                    key={c.id}
                    className="table-row border-b border-[#f0ece6] last:border-0"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/clients/${c.id}`}
                        className="text-[13px] font-bold text-[#333338] hover:text-[#af273c]"
                      >
                        {c.companyName}
                      </Link>
                      <div className="mt-1 text-[11px] text-[#89847e]">
                        {c.contactName ? `Attn: ${c.contactName}` : 'No contact added'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[12px] text-[#68666a]">
                      {[c.city, c.country].filter(Boolean).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-4 text-[12px] text-[#68666a]">
                      {c.email && <div>{c.email}</div>}
                      <div className="mt-1 text-[#96918b]">{c.phone || '-'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <Status value={c.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
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
                        {c.status !== 'archived' && (
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
          title={editing ? 'Edit client' : 'Add a client'}
          subtitle="A single source of truth for every piece of work."
          onClose={() => setModal(false)}
        >
          <ClientForm client={editing} onClose={() => setModal(false)} />
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
              All clients
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
                  className="btn btn-secondary"
                  onClick={() => setNewDocKind('quotation')}
                >
                  <FilePlus2 size={15} />
                  New quotation
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
              <h2 className="m-0 text-[14px] font-bold">Contact details</h2>
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
                  detail="Create a quotation or invoice for this client."
                  action={
                    <button
                      className="btn btn-primary"
                      onClick={() => setNewDocKind('quotation')}
                    >
                      <Plus size={15} /> Create quotation
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
          <ClientForm client={client} onClose={() => setEdit(false)} />
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

  const summary = q.data;
  const openInvoices = (docsQuery.data || []).filter(
    (d) => d.kind === 'invoice' && d.balance > 0 && d.status !== 'cancelled',
  );
  const ops = getOperationsData();
  const activeRentalsCount = ops.rentals.filter((r) => r.status !== 'returned').length;
  const activePrintCount = ops.productionOrders.filter(
    (p) => p.status !== 'delivered',
  ).length;

  const metrics = summary
    ? [
        {
          label: 'Total clients',
          value: String(summary.totalClients),
          sub: 'In your client book',
          icon: Users,
          tint: 'ink',
          href: '/clients',
        },
        {
          label: 'Active quotations',
          value: String(summary.activeQuotes),
          sub: 'Waiting on a decision',
          icon: FileText,
          tint: 'red',
          href: '/quotations',
        },
        {
          label: 'Open invoices',
          value: String(summary.openInvoices),
          sub: 'Awaiting payment',
          icon: ReceiptText,
          tint: 'gold',
          href: '/invoices',
        },
        {
          label: 'Collected this month',
          value: fmt(summary.collectedThisMonth),
          sub: 'Payments recorded',
          icon: Banknote,
          tint: 'green',
          href: '/invoices',
        },
      ]
    : [];

  const totalPipeline = summary
    ? summary.collectedThisMonth + summary.outstandingBalance
    : 0;
  const collectedPct =
    totalPipeline > 0 && summary
      ? Math.min(100, Math.round((summary.collectedThisMonth / totalPipeline) * 100))
      : 0;

  function activityHref(id: string): string {
    if (id.startsWith('client:')) return `/clients/${id.split(':')[1]}`;
    if (id.startsWith('document:')) {
      const [, kind, docId] = id.split(':');
      return `/${kind === 'quotation' ? 'quotations' : 'invoices'}/${docId}`;
    }
    if (id.startsWith('payment:')) {
      const docId = id.split(':')[1];
      return `/invoices/${docId}`;
    }
    return '/dashboard';
  }

  return (
    <>
      <PageTitle
        eyebrow="Your operations desk"
        title="Good morning."
        description="A clear view of clients, proposals, rentals and collections moving through Collage."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalAction('client')}
            >
              <Users size={15} />
              Add client
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalAction('quotation')}
            >
              <FilePlus2 size={15} />
              New quotation
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalAction('invoice')}
            >
              <Plus size={16} />
              New invoice
            </button>
          </div>
        }
      />
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {q.isLoading
          ? [0, 1, 2, 3].map((i) => (
              <div key={i} className="panel h-[132px] p-5">
                <div className="skeleton h-3 w-24" />
                <div className="skeleton mt-5 h-7 w-32" />
                <div className="skeleton mt-3 h-3 w-28" />
              </div>
            ))
          : metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <Link
                  key={m.label}
                  href={m.href}
                  className="panel slide-in block p-5 no-underline"
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#77736e]">
                      {m.label}
                    </span>
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-lg ${
                        m.tint === 'red'
                          ? 'bg-[#fbeded] text-[#b92d41]'
                          : m.tint === 'gold'
                            ? 'bg-[#fbf1df] text-[#ae7a2d]'
                            : m.tint === 'green'
                              ? 'bg-[#e9f1eb] text-[#54805f]'
                              : 'bg-[#efeee9] text-[#66666b]'
                      }`}
                    >
                      <Icon size={16} />
                    </span>
                  </div>
                  <div className="mt-3 font-sans text-[26px] font-bold tracking-[-.045em] text-[#292a2f]">
                    {m.value}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-[#969089]">
                    <span>{m.sub}</span>
                    <ArrowRight size={12} />
                  </div>
                </Link>
              );
            })}
      </div>

      {!q.isLoading && summary && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#eee8e0] px-5 py-4">
              <div>
                <div className="text-[14px] font-bold">Recent activity</div>
                <div className="mt-1 text-[11px] text-[#918b85]">
                  Click any update to open the record
                </div>
              </div>
              <Clock3 size={17} className="text-[#99938c]" />
            </div>
            {summary.recentActivity?.length ? (
              summary.recentActivity.map((a) => (
                <Link
                  key={a.id}
                  href={activityHref(a.id)}
                  className="table-row flex items-center gap-3 border-b border-[#f1ede7] px-5 py-3.5 last:border-0 no-underline"
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      a.kind === 'payment'
                        ? 'bg-[#e9f1eb] text-[#54805f]'
                        : a.kind === 'client'
                          ? 'bg-[#f1eee8] text-[#746c60]'
                          : 'bg-[#fbeded] text-[#ad3545]'
                    }`}
                  >
                    {a.kind === 'payment' ? (
                      <Banknote size={15} />
                    ) : a.kind === 'client' ? (
                      <Building2 size={15} />
                    ) : (
                      <FileText size={15} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold text-[#45434a]">
                      {a.title}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-[#89847e]">
                      {a.detail}
                    </div>
                  </div>
                  <time className="shrink-0 text-[10px] text-[#99928b]">
                    {dateFmt(a.date)}
                  </time>
                </Link>
              ))
            ) : (
              <Empty
                icon={Clock3}
                title="No activity yet"
                detail="As work moves forward, the latest updates will land here."
              />
            )}
          </section>

          <div className="space-y-4">
            <section className="panel p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-bold">Accounts receivable</div>
                  <div className="mt-1 text-[11px] text-[#918b85]">
                    Open balance across active invoices
                  </div>
                </div>
                <ArrowUpRight size={17} className="text-[#a62b3d]" />
              </div>
              <div className="mt-5 border-b border-[#eee8e0] pb-4">
                <div className="mono text-[28px] font-semibold tracking-[-.04em] text-[#292a2f]">
                  {fmt(summary.outstandingBalance)}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] font-semibold text-[#7b756e]">
                    <span>{fmt(summary.collectedThisMonth)} collected</span>
                    <span>{collectedPct}% settled</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#efeae2]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#c61c2e] to-[#3d6e4d]"
                      style={{ width: `${collectedPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {openInvoices.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#8e8881]">
                    Awaiting collection
                  </div>
                  {openInvoices.slice(0, 3).map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[#eee8e0] bg-[#faf8f5] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="mono text-[11px] font-bold text-[#a82b3e] hover:underline"
                        >
                          {inv.number}
                        </Link>
                        <div className="truncate text-[11px] text-[#555]">
                          {inv.clientName} · <span className="mono font-semibold">{fmt(inv.balance)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPayingDoc(inv)}
                        className="btn btn-primary !h-7 !min-h-7 !px-2.5 text-[11px]"
                      >
                        Collect
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4">
                <Link href="/invoices" className="btn btn-secondary w-full justify-between">
                  Review all invoices <ArrowRight size={15} />
                </Link>
              </div>
            </section>

            <section className="panel p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-bold">Rentals & PrintD Pigh Dispatch</div>
                  <div className="mt-1 text-[11px] text-[#918b85]">
                    Field equipment & sister-company production
                  </div>
                </div>
                <Layers size={16} className="text-[#c61c2e]" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className="rounded-lg bg-[#faf7f2] p-3 border border-[#eee8e0]">
                  <div className="text-[10px] font-bold uppercase text-[#88827a]">
                    Active Rentals
                  </div>
                  <div className="mt-1 text-[20px] font-bold text-[#1e1f24]">
                    {activeRentalsCount}
                  </div>
                  <div className="text-[10px] text-[#88827a]">Poles, bases & lighting</div>
                </div>
                <div className="rounded-lg bg-[#faf7f2] p-3 border border-[#eee8e0]">
                  <div className="text-[10px] font-bold uppercase text-[#88827a]">
                    PrintD Pigh Queue
                  </div>
                  <div className="mt-1 text-[20px] font-bold text-[#c61c2e]">
                    {activePrintCount}
                  </div>
                  <div className="text-[10px] text-[#88827a]">Active print orders</div>
                </div>
              </div>
              <div className="mt-3">
                <Link href="/operations" className="btn btn-secondary w-full justify-between">
                  Open Rentals & Print desk <ArrowRight size={15} />
                </Link>
              </div>
            </section>
          </div>
        </div>
      )}

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

  const [items, setItems] = useState<
    Array<{ description: string; quantity: number; days: number; unitPrice: number }>
  >(
    doc?.items?.length
      ? doc.items.map((x) => ({
          description: x.description,
          quantity: x.quantity,
          days: x.days,
          unitPrice: x.unitPrice,
        }))
      : [{ description: '', quantity: 1, days: 1, unitPrice: 0 }],
  );
  const [clientId, setClientId] = useState(doc?.clientId || defaultClientId || '');
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
      description: it.description || 'Item',
      quantity: Number(it.quantity) || 0,
      days: Number(it.days) || 0,
      unitPrice: Number(it.unitPrice) || 0,
    })),
    discountPercent: Number(rates.discount) || 0,
    getfundRate: Number(rates.getfund) || 0,
    nhilRate: Number(rates.nhil) || 0,
    vatRate: Number(rates.vat) || 0,
  });

  function updateItem(
    index: number,
    patch: Partial<{ description: string; quantity: number; days: number; unitPrice: number }>,
  ) {
    setItems((prev) => prev.map((it, idx) => (idx === index ? { ...it, ...patch } : it)));
  }

  function addPreset(preset: (typeof CATALOG_PRESETS)[number]) {
    setItems((prev) => {
      if (prev.length === 1 && !prev[0].description.trim() && prev[0].unitPrice === 0) {
        return [{ ...preset }];
      }
      return [...prev, { ...preset }];
    });
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!clientId) {
      setError('Choose a client before saving.');
      return;
    }
    const cleanedItems = items.map((it) => ({
      description: it.description.trim(),
      quantity: Number(it.quantity),
      days: Number(it.days),
      unitPrice: Number(it.unitPrice),
    }));
    if (
      cleanedItems.some(
        (it) => !it.description || it.quantity <= 0 || it.days <= 0 || it.unitPrice < 0,
      )
    ) {
      setError('Add a description and valid quantity and days for each line item.');
      return;
    }

    const f = new FormData(e.currentTarget);
    const input: DocumentInput = {
      kind,
      clientId,
      subject: String(f.get('subject')).trim(),
      issueDate: String(f.get('issueDate')),
      dueDate: String(f.get('dueDate') || '') || null,
      status,
      items: cleanedItems,
      discountPercent: Number(rates.discount),
      getfundRate: Number(rates.getfund),
      nhilRate: Number(rates.nhil),
      vatRate: Number(rates.vat),
      paymentTerms: String(f.get('paymentTerms') || '').trim(),
      validityDays: Number(f.get('validityDays') || 5),
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

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Client"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
        >
          <option value="">Choose a client</option>
          {(clients.data || [])
            .filter((c) => c.status !== 'archived')
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
        </Select>
        <Input
          label="Subject / Project title"
          name="subject"
          required
          defaultValue={doc?.subject}
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
      <div className="rounded-lg border border-[#ece5dc] bg-[#faf8f4] p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8a837b]">
          <Sparkles size={12} className="text-[#c61c2e]" />
          Quick add Collage catalog item
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
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e9e3db]">
        <div className="grid grid-cols-[1fr_68px_68px_105px_95px_32px] gap-2 bg-[#f5f1eb] px-3 py-2 text-[9px] font-bold uppercase tracking-[.09em] text-[#8c867e]">
          <span>Item Description</span>
          <span>Qty</span>
          <span>Days</span>
          <span>Unit Price</span>
          <span className="text-right">Line Total</span>
          <span />
        </div>
        <div className="divide-y divide-[#f0ece6]">
          {items.map((item, idx) => {
            const rowTotal = (Number(item.quantity) || 0) * (Number(item.days) || 0) * (Number(item.unitPrice) || 0);
            return (
              <div
                key={idx}
                className="grid grid-cols-[1fr_68px_68px_105px_95px_32px] items-center gap-2 p-2.5"
              >
                <input
                  aria-label="Item description"
                  className="field"
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
                <input
                  aria-label="Days"
                  className="field"
                  type="number"
                  min="1"
                  step="1"
                  value={item.days}
                  onChange={(e) => updateItem(idx, { days: Number(e.target.value) })}
                />
                <input
                  aria-label="Unit price in GHS"
                  className="field"
                  type="number"
                  min="0"
                  step=".01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                />
                <div className="mono text-right text-[12px] font-semibold text-[#292a2f]">
                  {fmt(rowTotal).replace('GHS ', '')}
                </div>
                <button
                  type="button"
                  aria-label="Remove line item"
                  disabled={items.length <= 1}
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  className="btn btn-quiet !h-8 !min-h-8 !w-8 !px-0 text-[#a53b47]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
        <div className="border-t border-[#eee8e0] bg-[#faf8f4] px-3 py-2">
          <button
            type="button"
            className="btn btn-quiet !h-7 !min-h-7 !px-2 text-[11px]"
            onClick={() =>
              setItems((prev) => [
                ...prev,
                { description: '', quantity: 1, days: 1, unitPrice: 0 },
              ])
            }
          >
            <Plus size={13} /> Add blank line item
          </button>
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
      <div className="rounded-lg border border-[#e6dfd6] bg-[#f7f3ed] p-4 text-[12px]">
        <div className="grid gap-1.5 sm:grid-cols-2">
          <div className="text-[11px] text-[#79736c]">
            <div className="font-bold uppercase tracking-wider text-[#333]">
              Statutory Ghana Tax Breakdown
            </div>
            <div className="mt-1">
              Line total = Qty × Days × Unit Price. GETFund (2.5%), NHIL (2.5%) & VAT
              (15%) applied on taxable subtotal.
            </div>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#777]">Subtotal:</span>
              <span className="mono">{fmt(Number(livePricing.subtotal))}</span>
            </div>
            {Number(livePricing.discountAmount) > 0 && (
              <div className="flex justify-between text-[#a82b3e]">
                <span>Discount ({rates.discount}%):</span>
                <span className="mono">-{fmt(Number(livePricing.discountAmount))}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#777]">
                GETFund ({rates.getfund}%) + NHIL ({rates.nhil}%):
              </span>
              <span className="mono">
                {fmt(
                  Number(livePricing.getfundAmount) + Number(livePricing.nhilAmount),
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#777]">VAT ({rates.vat}%):</span>
              <span className="mono">{fmt(Number(livePricing.vatAmount))}</span>
            </div>
            <div className="flex justify-between border-t border-[#ded7cd] pt-1 text-[13px] font-bold text-[#1e1f23]">
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
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<SalesDocument | undefined>();
  const [payingDoc, setPayingDoc] = useState<SalesDocument | undefined>();
  const [filter, setFilter] = useState('all');
  const convert = useConvertQuotation();

  const query = useGetDocuments(
    { kind },
    { query: { queryKey: getGetDocumentsQueryKey({ kind }) } },
  );

  const allDocs = query.data || [];
  const docs = allDocs.filter(
    (d) =>
      (filter === 'all' || d.status === filter) &&
      `${d.number} ${d.clientName} ${d.subject}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const title = kind === 'quotation' ? 'Quotations' : 'Invoices';
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
        eyebrow={kind === 'quotation' ? 'Shape the work' : 'Keep cash moving'}
        title={title}
        description={
          kind === 'quotation'
            ? 'Move a brief into a clear, considered proposal with Ghanaian taxes calculated.'
            : 'Every bill, balance and payment in one place.'
        }
        action={
          <button
            className="btn btn-primary"
            onClick={() => {
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
          <div className="text-[11px] font-semibold text-[#77736e]">
            {kind === 'quotation' ? 'Total quoted pipeline' : 'Total billed'}
          </div>
          <div className="mono mt-1.5 text-[22px] font-bold text-[#292a2f]">
            {fmt(totalValue)}
          </div>
        </div>
        <div className="panel p-4">
          <div className="text-[11px] font-semibold text-[#77736e]">
            {kind === 'quotation' ? 'Accepted proposals' : 'Total collected'}
          </div>
          <div className="mono mt-1.5 text-[22px] font-bold text-[#3d6e4d]">
            {fmt(totalPaidOrAccepted)}
          </div>
        </div>
        <div className="panel p-4">
          <div className="text-[11px] font-semibold text-[#77736e]">
            {kind === 'quotation' ? 'Active proposals count' : 'Outstanding balance'}
          </div>
          <div className="mono mt-1.5 text-[22px] font-bold text-[#c61c2e]">
            {kind === 'quotation'
              ? `${allDocs.filter((d) => d.status === 'issued' || d.status === 'draft').length} open`
              : fmt(totalBalance)}
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#eee8e0] px-4 py-4 lg:flex-row lg:items-center lg:justify-between md:px-5">
          <div className="relative w-full max-w-[340px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a958e]"
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
                <tr className="border-b border-[#eee8e0] text-[10px] font-bold uppercase tracking-[.1em] text-[#99928b]">
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
                      className="table-row border-b border-[#f0ece6] last:border-0"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={href}
                          className="mono text-[11px] font-semibold text-[#a82b3e]"
                        >
                          {d.number}
                        </Link>
                        <div className="mt-1 text-[10px] capitalize text-[#928c85]">
                          {d.kind}
                        </div>
                      </td>
                      <td className="max-w-[270px] px-4 py-4">
                        <Link
                          href={href}
                          className="block truncate text-[12px] font-semibold text-[#45434a] hover:text-[#a82b3e]"
                        >
                          {d.clientName}
                        </Link>
                        <div className="mt-1 truncate text-[11px] text-[#89847e]">
                          {d.subject}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[12px] text-[#6f6b66]">
                        {dateFmt(d.issueDate)}
                      </td>
                      <td className="px-4 py-4">
                        <Status value={d.status} />
                      </td>
                      <td className="mono px-4 py-4 text-right text-[12px] font-semibold">
                        {fmt(d.total)}
                      </td>
                      <td className="mono px-4 py-4 text-right text-[12px] text-[#6f6b66]">
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
          onClose={() => setModal(false)}
        >
          <DocumentForm kind={kind} doc={editing} onClose={() => setModal(false)} />
        </Modal>
      )}
      {payingDoc && (
        <PaymentModal doc={payingDoc} onClose={() => setPayingDoc(undefined)} />
      )}
    </>
  );
}

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

      <article className="print-paper panel mx-auto max-w-[850px] bg-white p-6 md:p-12 shadow-sm">
        {/* Centered Collage Logo */}
        <div className="text-center pb-2">
          <img
            src={collageLogo}
            alt="Collage · Creating Results"
            className="mx-auto h-14 md:h-16 w-auto object-contain"
          />
        </div>

        {/* Red Document Title */}
        <div className="mt-4 text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-wide text-[#c61c2e] m-0">
            {doc.kind === 'quotation' ? 'QUOTATION' : 'INVOICE'}
          </h1>
        </div>

        {/* Date & Reference */}
        <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-[#ece6de] pb-3 text-[12px]">
          <div className="font-medium text-[#2d2c31]">
            {new Date(doc.issueDate).toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          <div className="flex items-center gap-3">
            <span className="mono font-semibold text-[#555]">
              {doc.kind === 'quotation' ? 'Quotation' : 'Invoice'} No.{' '}
              <span className="text-[#c61c2e]">{doc.number}</span>
            </span>
            <span className="no-print">
              <Status value={doc.status} />
            </span>
          </div>
        </div>

        {/* Red Banner: Client Details */}
        <div className="mt-5">
          <div className="inline-block bg-[#b71c1c] px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white rounded-sm">
            Client Details
          </div>
          <div className="mt-2.5 text-[12px] leading-snug text-[#2f2e34]">
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

        {/* Black Banner: Subject / Project Title */}
        <div className="mt-5 bg-[#1f2024] px-4 py-2.5 text-[13px] font-extrabold uppercase tracking-wide text-white rounded-sm">
          {doc.subject}
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto my-4">
          <table className="w-full min-w-[560px] text-left border-collapse">
            <thead>
              <tr className="bg-[#a81a29] text-white text-[9px] font-bold uppercase tracking-[.08em]">
                <th className="px-4 py-2.5">Item Description</th>
                <th className="px-3 py-2.5 text-center">Qty</th>
                <th className="px-3 py-2.5 text-center">Days</th>
                <th className="px-3 py-2.5 text-right">Unit Price GHS</th>
                <th className="px-4 py-2.5 text-right">Total Amount GHS</th>
              </tr>
            </thead>
            <tbody>
              {doc.items.map((item, i) => (
                <tr
                  key={`${item.description}-${i}`}
                  className="border-b border-[#ece6de] text-[11px] even:bg-[#faf7f2]"
                >
                  <td className="px-4 py-2.5 font-medium text-[#2e2d33]">
                    {item.description}
                  </td>
                  <td className="mono px-3 py-2.5 text-center text-[#555]">
                    {item.quantity}
                  </td>
                  <td className="mono px-3 py-2.5 text-center text-[#555]">
                    {item.days}
                  </td>
                  <td className="mono px-3 py-2.5 text-right text-[#555]">
                    {fmt(item.unitPrice).replace('GHS ', '')}
                  </td>
                  <td className="mono px-4 py-2.5 text-right font-semibold text-[#1e1f23]">
                    {fmt(item.total).replace('GHS ', '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tax & Total Calculation */}
        <div className="ml-auto max-w-[340px] space-y-1.5 border-t border-[#ece6de] pt-3 text-[11px]">
          <MoneyRow label="Subtotal" value={doc.subtotal} />
          <div className="flex justify-between text-[#77726c] bg-[#fbe9e7]/60 px-1.5 py-0.5 rounded-sm">
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
        <div className="ml-auto max-w-[340px] mt-3 bg-[#1f2024] text-white px-4 py-2.5 flex items-center justify-between text-[12px] font-bold rounded-sm">
          <span className="uppercase tracking-wider">Total Payment Due GHS</span>
          <span className="mono text-[16px]">
            {fmt(doc.total).replace('GHS ', '')}
          </span>
        </div>

        {doc.kind === 'invoice' && (
          <div className="ml-auto max-w-[340px] space-y-1.5 border-t border-dashed border-[#e5ded6] mt-3 pt-2 text-[11px]">
            <MoneyRow label="Paid to date" value={doc.amountPaid} />
            <MoneyRow label="Balance due" value={doc.balance} strong />
          </div>
        )}

        {/* Payment Terms & Validity */}
        <div className="mt-8 space-y-1 text-[11px]">
          <div className="font-semibold text-[#222] italic">
            {doc.paymentTerms || '100% Down Payment'}
          </div>
          <div className="text-[#666] italic">
            Quotation is valid for {doc.validityDays} days after Invoice Date
          </div>
        </div>

        {/* Authentic Collage Footer with Red Circle + Black Diamond Mark */}
        <div className="mt-12 flex flex-wrap items-end justify-between border-t border-[#e2dcce] pt-6 text-[11px]">
          <div className="text-[10px] text-[#7a756f] space-y-0.5">
            <div className="font-bold uppercase tracking-wider text-[#1f2024]">
              Collage · Creating Results
            </div>
            <div className="text-[#999]">Accra, Ghana</div>
          </div>
          <div className="flex items-end gap-4">
            <div className="text-right text-[10px] leading-tight text-[#444] space-y-0.5">
              <div className="font-semibold text-[#1f2024]">+233 24 736 1133</div>
              <div>collagenmosaic@gmail.com</div>
              <div>sendit@collagenmosaic.com</div>
              <div className="font-medium text-[#c61c2e]">www.collagenmosaic.com</div>
            </div>
            <div className="relative h-12 w-12 shrink-0" aria-hidden="true">
              <span className="absolute left-0 top-0 h-6 w-6 rounded-full bg-[#e52329]" />
              <span className="absolute bottom-0.5 right-0.5 h-6 w-6 rotate-45 rounded-[3px] bg-[#1f2024]" />
            </div>
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
  const clients = useGetClients();

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
    const updated = createRentalBooking({
      itemName: String(f.get('itemName')).trim(),
      clientName: String(f.get('clientName')).trim(),
      documentNumber: String(f.get('documentNumber') || 'Direct').trim(),
      quantity: Number(f.get('quantity') || 1),
      days: Number(f.get('days') || 1),
      unitRate: Number(f.get('unitRate') || 70),
      startDate: String(f.get('startDate')),
      returnDate: String(f.get('returnDate')),
      status: 'deployed',
    });
    setOps((prev) => ({ ...prev, rentals: [...updated] }));
    setRentalModal(false);
  }

  function submitPrint(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const updated = createProductionOrder({
      clientName: String(f.get('clientName')).trim(),
      documentNumber: String(f.get('documentNumber') || 'Direct').trim(),
      specification: String(f.get('specification')).trim(),
      quantity: Number(f.get('quantity') || 1),
      assignedTo: String(f.get('assignedTo') || 'PrintD Pigh · Large Format Press'),
      dueDate: String(f.get('dueDate')),
      status: 'queued',
    });
    setOps((prev) => ({ ...prev, productionOrders: [...updated] }));
    setPrintModal(false);
  }

  return (
    <>
      <PageTitle
        eyebrow="Field & Sister-Company Coordination"
        title="Rentals & PrintD Pigh Dispatch"
        description="Track telescopic flag pole rentals in the field and print production dispatched to PrintD Pigh."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setRentalModal(true)}
            >
              <CalendarDays size={15} />
              Log equipment rental
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setPrintModal(true)}
            >
              <Wrench size={15} />
              Dispatch to PrintD Pigh
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
          <span>PrintD Pigh Production Orders ({ops.productionOrders.length})</span>
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
                {ops.rentals.map((r) => (
                  <tr
                    key={r.id}
                    className="table-row border-b border-[#f0ece6] last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div className="text-[13px] font-bold text-[#333338]">
                        {r.itemName}
                      </div>
                      <div className="mono mt-0.5 text-[11px] text-[#89847e]">
                        {fmt(r.unitRate)} / day · Total {fmt(r.quantity * r.days * r.unitRate)}
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
                      {r.quantity} units × {r.days}d
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
                ))}
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
          subtitle="Reserve or deploy telescopic poles, bases, or lighting kits."
          onClose={() => setRentalModal(false)}
        >
          <form onSubmit={submitRental} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Equipment item"
                name="itemName"
                required
                defaultValue="Telescopic Flag Pole & Heavy Water Base (5m)"
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
                defaultValue="4"
                required
              />
              <Input
                label="Rental days"
                name="days"
                type="number"
                min="1"
                defaultValue="1"
                required
              />
              <Input
                label="Unit rate (GHS / day)"
                name="unitRate"
                type="number"
                min="0"
                step=".01"
                defaultValue="70"
                required
              />
              <Input
                label="Invoice / Quote Ref"
                name="documentNumber"
                placeholder="e.g. 00211026.01"
              />
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
              <Input
                label="Invoice / Quote Ref"
                name="documentNumber"
                placeholder="e.g. 00211026.01"
              />
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
              <span>Access waits on admin approval</span>
            </div>
          </div>
        </div>
        <div className="text-[11px] text-[#7d7a74]">
          COLLAGE · CREATING RESULTS · GHANA
        </div>
      </section>

      {/* Right Form Section */}
      <section className="flex items-center justify-center bg-[#faf8f5] p-6 md:p-12">
        <div className="w-full max-w-[400px]">
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
              {hasClerk
                ? 'Access is protected. New accounts wait on admin approval.'
                : 'Open the workspace to continue.'}
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
              <Link href="/dashboard" className="btn btn-primary mt-6 w-full !h-11">
                Enter your workspace
              </Link>
            )}
          </div>

          <div className="mt-5 text-center text-[11px] text-[#9c958c]">
            Secure Workspace · Collage Ghana
          </div>
        </div>
      </section>
    </div>
  );
}

function Router() {
  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/" component={() => <Welcome hasClerk={hasClerk} />} />
        <Route path="/sign-in" component={() => <AuthScreen />} />
        <Route path="/sign-in/*" component={() => <AuthScreen />} />
        <Route path="/sign-up" component={() => <AuthScreen signup />} />
        <Route path="/sign-up/*" component={() => <AuthScreen signup />} />
        <Route path="/dashboard">
          {() => (
            <Shell>
              <Dashboard />
            </Shell>
          )}
        </Route>
        <Route path="/clients">
          {() => (
            <Shell>
              <ClientList />
            </Shell>
          )}
        </Route>
        <Route path="/clients/:id">
          {() => (
            <Shell>
              <ClientDetail />
            </Shell>
          )}
        </Route>
        <Route path="/quotations">
          {() => (
            <Shell>
              <DocumentList kind="quotation" />
            </Shell>
          )}
        </Route>
        <Route path="/quotations/:id">
          {() => (
            <Shell>
              <DocumentDetail />
            </Shell>
          )}
        </Route>
        <Route path="/invoices">
          {() => (
            <Shell>
              <DocumentList kind="invoice" />
            </Shell>
          )}
        </Route>
        <Route path="/invoices/:id">
          {() => (
            <Shell>
              <DocumentDetail />
            </Shell>
          )}
        </Route>
        <Route path="/operations">
          {() => (
            <Shell>
              <OperationsView />
            </Shell>
          )}
        </Route>
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
  return inner;
}

export default App;
