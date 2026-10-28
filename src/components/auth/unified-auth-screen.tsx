import { type FormEvent, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, Check, Shield, Target, Users, LoaderCircle } from 'lucide-react';
import { Brand } from '@/components/brand';
import { loginWithNeon, type NeonAuthUser } from '@/lib/api-client/custom-fetch';

export interface UnifiedAuthScreenProps {
  onLoginSuccess?: (user: NeonAuthUser) => void;
  signup?: boolean;
}

const DEMO_PERSONAS = [
  {
    role: 'admin' as const,
    label: 'Admin (Kojo)',
    email: 'admin@collage.com.gh',
    password: 'Collage2026!',
    office: 'Accra HQ',
    badge: 'Operations & Finance',
    icon: Shield,
  },
  {
    role: 'marketer' as const,
    label: 'Marketer (Nana)',
    email: 'marketer@collage.com.gh',
    password: 'Collage2026!',
    office: 'Brand Desk',
    badge: 'Campaigns & Leads',
    icon: Target,
  },
  {
    role: 'hr' as const,
    label: 'HR (Efua)',
    email: 'hr@collage.com.gh',
    password: 'Collage2026!',
    office: 'People Desk',
    badge: 'People & Culture',
    icon: Users,
  },
];

export function UnifiedAuthScreen({
  onLoginSuccess,
  signup = false,
}: UnifiedAuthScreenProps) {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('admin@collage.com.gh');
  const [password, setPassword] = useState('Collage2026!');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function performLogin(targetEmail: string, targetPass: string) {
    setErrorMsg(null);
    setLoading(true);
    try {
      const result = await loginWithNeon({
        email: targetEmail,
        password: targetPass,
      });
      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }
      setLocation('/dashboard');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await performLogin(email, password);
  }

  function handlePersonaClick(persona: typeof DEMO_PERSONAS[number]) {
    setEmail(persona.email);
    setPassword(persona.password);
    void performLogin(persona.email, persona.password);
  }

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.1fr_1fr]">
      {/* Left Editorial Panel */}
      <section className="flex flex-col justify-between bg-[#111110] p-8 text-[#f7f5ee] md:p-14 border-r border-white/[0.08]">
        <div>
          <Brand inverse />
        </div>
        <div className="my-14 max-w-[500px]">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-[#E02B20]">
            Unified Workspace Shell
          </div>
          <h1 className="font-sans text-[34px] font-extrabold leading-[1.1] tracking-[-0.035em] text-white md:text-[46px]">
            Every brief has a clear next step.
          </h1>
          <p className="mt-5 max-w-[420px] text-[14px] leading-relaxed text-[#aba8a1]">
            Multi-role adaptive workspace connecting Marketing, HR, and Operations desks
            across Ghana on one unified ledger.
          </p>

          <div className="mt-8 space-y-3.5 text-[12px] text-[#ccc9c0]">
            <div className="flex items-center gap-2.5">
              <Check size={16} className="text-[#E02B20]" />
              <span>Executive Admin: Tax invoices, quotation lifecycles, and fleet rentals</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check size={16} className="text-[#E02B20]" />
              <span>Marketer Hub: Client leads conversion, campaign ROI, and showcase links</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check size={16} className="text-[#E02B20]" />
              <span>HR People Desk: Staff directory, internal notice bulletins, and attendance tracking</span>
            </div>
          </div>
        </div>
        <div className="font-mono text-[11px] text-[#7d7a74] tracking-wider">
          COLLAGE · CREATING RESULTS · GHANA
        </div>
      </section>

      {/* Right Sign-In Panel */}
      <section className="flex items-center justify-center bg-[#F9F8F6] p-6 md:p-12">
        <div className="w-full max-w-[440px]">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-[12px] font-medium text-neutral-600 hover:text-[#C61C2E] transition-colors no-underline"
          >
            <ArrowLeft size={14} /> Back to Collage Home
          </Link>

          <div className="panel border border-neutral-200/80 bg-white p-6 md:p-8 rounded-xl shadow-sm">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#C61C2E]">
              Unified Sign In
            </div>
            <h2 className="m-0 font-sans text-[24px] font-bold tracking-tight text-neutral-900">
              Welcome to Workspace
            </h2>
            <p className="mb-0 mt-1.5 text-[12.5px] leading-5 text-neutral-500">
              Sign in with your work email or select a 1-click demo persona below.
            </p>

            {/* Quick Demo Persona Pills */}
            <div className="mt-5 rounded-lg border border-neutral-100 bg-neutral-50/70 p-3">
              <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500">
                Quick Demo Personas (1-Click Sign-In)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DEMO_PERSONAS.map((persona) => {
                  const Icon = persona.icon;
                  const isActive = email === persona.email;
                  return (
                    <button
                      key={persona.role}
                      type="button"
                      disabled={loading}
                      onClick={() => handlePersonaClick(persona)}
                      className={`flex flex-col items-start rounded-md border p-2 text-left transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#E02B20] bg-white shadow-xs'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 w-full">
                        <Icon size={12} className="text-[#E02B20] shrink-0" />
                        <span className="truncate text-[11px] font-bold text-neutral-800">
                          {persona.label}
                        </span>
                      </div>
                      <span className="mt-1 truncate text-[9.5px] text-neutral-400 font-mono">
                        {persona.office}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMsg && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11.5px] font-semibold text-neutral-700 mb-1">
                  Work Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@collage.com.gh"
                  required
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-neutral-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full h-10 items-center justify-center gap-2 rounded-md bg-[#111110] px-4 font-mono text-[12px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={14} className="animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Sign In to Workspace</span>
                )}
              </button>

              <div className="flex items-center justify-between pt-1 text-[11.5px] text-neutral-500">
                <span className="font-mono text-[10.5px]">Default Pass: Collage2026!</span>
                <Link
                  href="/dashboard"
                  className="text-neutral-600 hover:text-neutral-900 font-medium no-underline"
                >
                  Direct Overview →
                </Link>
              </div>
            </form>
          </div>

          <div className="mt-5 text-center text-[11px] text-neutral-400 font-mono">
            Secure Workspace · Collage Ghana · Multi-Role Architecture
          </div>
        </div>
      </section>
    </div>
  );
}

export default UnifiedAuthScreen;
