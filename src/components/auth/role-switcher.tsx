import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, UserCheck, Shield, Target, Users } from 'lucide-react';
import {
  type UserRole,
  type WorkspaceUser,
  PRESEEDED_ACCOUNTS,
  AUTH_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
} from '@/types/auth';

export interface RoleSwitcherProps {
  currentRole: UserRole;
  currentEmail?: string;
  onRoleChange: (newUser: WorkspaceUser) => void;
}

const PERSONA_OPTIONS: Array<{
  role: UserRole;
  label: string;
  name: string;
  email: string;
  office: string;
  icon: typeof Shield;
}> = [
  {
    role: 'admin',
    label: 'Admin',
    name: 'Kojo Nathan',
    email: 'admin@collage.com.gh',
    office: 'Accra HQ · All Clients',
    icon: Shield,
  },
  {
    role: 'marketer',
    label: 'Marketer',
    name: 'Nana Mensah',
    email: 'marketer@collage.com.gh',
    office: 'Brand Desk · 3 Clients',
    icon: Target,
  },
  {
    role: 'marketer',
    label: 'Marketer',
    name: 'Ama Serwaa',
    email: 'ama@collage.com.gh',
    office: 'Corporate Desk · 1 Client',
    icon: Target,
  },
  {
    role: 'marketer',
    label: 'Marketer',
    name: 'Kwesi Boateng',
    email: 'kwesi@collage.com.gh',
    office: 'Outdoor Desk · 1 Client',
    icon: Target,
  },
  {
    role: 'hr',
    label: 'HR',
    name: 'Efua Baffour',
    email: 'hr@collage.com.gh',
    office: 'People Desk',
    icon: Users,
  },
];

export function RoleSwitcher({ currentRole, currentEmail, onRoleChange }: RoleSwitcherProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const activeOption =
    (currentEmail &&
      PERSONA_OPTIONS.find((p) => p.email.toLowerCase() === currentEmail.toLowerCase())) ||
    PERSONA_OPTIONS.find((p) => p.role === currentRole) ||
    PERSONA_OPTIONS[0];

  function handleSelectPersona(email: string) {
    const account = PRESEEDED_ACCOUNTS[email];
    if (account) {
      const updatedUser: WorkspaceUser = {
        ...account.user,
        lastLogin: new Date().toISOString(),
      };
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
          window.localStorage.setItem(
            AUTH_TOKEN_STORAGE_KEY,
            `token-${updatedUser.role}-${Date.now().toString(36)}`,
          );
        } catch {
          // Ignore storage issues
        }
      }
      onRoleChange(updatedUser);
    }
    setOpen(false);
  }

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title="Interactive Demo Role Switcher"
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-neutral-200/80 bg-white/70 px-3 text-[11.5px] font-medium text-[#1D1D1B] backdrop-blur-md shadow-[0_1px_2px_rgba(15,23,42,0.03),inset_0_1px_0_rgba(255,255,255,0.85)] transition-all hover:border-neutral-300 hover:bg-white/95 cursor-pointer"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="flex h-1.5 w-1.5 rounded-full bg-[#E02B20]" />
        <span className="text-neutral-500 font-mono text-[10.5px]">Role:</span>
        <span className="font-semibold text-neutral-900">
          {activeOption.role === 'marketer'
            ? `${activeOption.label} (${activeOption.name.split(' ')[0]})`
            : activeOption.label}
        </span>
        <ChevronDown
          size={12}
          className={`text-neutral-400 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-2xl border border-white/85 bg-white/85 p-1.5 backdrop-blur-2xl shadow-[0_20px_48px_-12px_rgba(15,23,42,0.14),0_0_0_1px_rgba(15,23,42,0.06)] focus:outline-none">
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[.14em] text-neutral-400">
            Switch Portal / Marketer Account
          </div>
          <div className="space-y-1">
            {PERSONA_OPTIONS.map((persona) => {
              const isSelected = persona.email === activeOption.email;
              const Icon = persona.icon;
              return (
                <button
                  key={persona.email}
                  type="button"
                  onClick={() => handleSelectPersona(persona.email)}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900/[0.06] font-medium text-neutral-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]'
                      : 'text-neutral-600 hover:bg-white/70 hover:text-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`grid h-6 w-6 place-items-center rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-[#141413] text-white shadow-xs'
                          : 'bg-neutral-100/80 text-neutral-500'
                      }`}
                    >
                      <Icon size={12} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-neutral-900">
                        {persona.label} ({persona.name})
                      </div>
                      <div className="truncate text-[10px] text-neutral-400 font-mono">
                        {persona.office}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check size={14} className="text-[#E02B20] shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-1 border-t border-neutral-200/50 pt-1.5 px-2 text-[10px] text-neutral-400 text-center">
            Each Marketer sees only their own clients
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleSwitcher;

