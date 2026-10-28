import { type ReactNode } from 'react';
import { Link } from 'wouter';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { type UserRole, evaluateRoleAccess, getActiveSessionUser } from '@/types/auth';

export { evaluateRoleAccess };

export interface RoleGuardProps {
  allowedRoles: UserRole[];
  currentRole?: UserRole | null;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({
  allowedRoles,
  currentRole,
  children,
  fallback,
}: RoleGuardProps) {
  // Determine role: passed prop, or session user, or null
  const effectiveRole =
    currentRole !== undefined
      ? currentRole
      : getActiveSessionUser()?.role || null;

  const access = evaluateRoleAccess(effectiveRole, allowedRoles);

  if (access.allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="panel mx-auto my-12 max-w-lg p-8 text-center border border-neutral-200/80 bg-white shadow-sm rounded-xl">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-[#C61C2E]">
        <ShieldAlert size={24} strokeWidth={2} />
      </div>
      <div className="text-[11px] font-bold uppercase tracking-[.18em] text-[#C61C2E]">
        Security Clearance
      </div>
      <h3 className="mt-2 text-xl font-bold tracking-tight text-neutral-900">
        Access Restricted
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        {access.reason ||
          `Your active role (${effectiveRole || 'unauthenticated'}) is not authorized for this view.`}
      </p>
      <div className="mt-4 rounded-md bg-neutral-50 p-3 text-xs text-neutral-500 font-mono">
        Authorized roles for this workspace section: {allowedRoles.join(', ')}
      </div>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-md bg-[#111110] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800 no-underline"
        >
          <ArrowLeft size={14} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}

export default RoleGuard;
