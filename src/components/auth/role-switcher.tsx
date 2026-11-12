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
    <div className="relative inline-block text-left shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title="Switch Portal / Marketer Account"
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 sm:px-3 text-[11.5px] font-medium text-[#1D1D1B] transition-colors hover:border-neutral-300 hover:bg-neutral-50 cursor-pointer"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="hidden sm:inline text-neutral-500 font-mono text-[10.5px]">Role:</span>
        <span className="font-semibold text-neutral-900 truncate max-w-[110px] sm:max-w-none">
          {activeOption.role === 'marketer'
            ? `${activeOption.label} (${activeOption.name.split(' ')[0]})`
            : activeOption.label}
        </span>
        <ChevronDown
          size={12}
          className={`text-neutral-400 shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 sm:w-72 origin-top-right rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl focus:outline-none">
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-neutral-400">
            Switch Portal / Marketer Account
          </div>
          <div className="divide-y divide-neutral-100">
            {PERSONA_OPTIONS.map((persona) => {
              const isSelected = persona.email === activeOption.email;
              const Icon = persona.icon;
              return (
                <button
                  key={persona.email}
                  type="button"
                  onClick={() => handleSelectPersona(persona.email)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-100 font-medium text-neutral-950'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      size={13}
                      className={isSelected ? 'text-[#E02B20] shrink-0' : 'text-neutral-400 shrink-0'}
                    />
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
        </div>
      )}
    </div>
  );
}

export default RoleSwitcher;

