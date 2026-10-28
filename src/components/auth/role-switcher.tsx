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
    office: 'Accra HQ',
    icon: Shield,
  },
  {
    role: 'marketer',
    label: 'Marketer',
    name: 'Nana Mensah',
    email: 'marketer@collage.com.gh',
    office: 'Brand Desk',
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

export function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
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
    PERSONA_OPTIONS.find((p) => p.role === currentRole) || PERSONA_OPTIONS[0];

  function handleSelectRole(role: UserRole) {
    const email =
      role === 'admin'
        ? 'admin@collage.com.gh'
        : role === 'marketer'
          ? 'marketer@collage.com.gh'
          : 'hr@collage.com.gh';

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
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200/90 bg-white/80 px-2.5 text-[11.5px] font-medium text-neutral-800 shadow-sm backdrop-blur transition-all hover:border-neutral-300 hover:bg-white cursor-pointer"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="flex h-1.5 w-1.5 rounded-full bg-[#E02B20]" />
        <span className="text-neutral-500 font-mono text-[10.5px]">Role:</span>
        <span className="font-semibold text-neutral-900">{activeOption.label}</span>
        <ChevronDown
          size={12}
          className={`text-neutral-400 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-64 origin-top-right rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5 focus:outline-none">
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-neutral-400">
            Switch Demo Persona
          </div>
          <div className="space-y-1">
            {PERSONA_OPTIONS.map((persona) => {
              const isSelected = persona.role === currentRole;
              const Icon = persona.icon;
              return (
                <button
                  key={persona.role}
                  type="button"
                  onClick={() => handleSelectRole(persona.role)}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-100 font-medium text-neutral-900'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`grid h-6 w-6 place-items-center rounded ${
                        isSelected
                          ? 'bg-[#111110] text-white'
                          : 'bg-neutral-100 text-neutral-500'
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
          <div className="mt-1 border-t border-neutral-100 pt-1.5 px-2 text-[10px] text-neutral-400 text-center">
            Live Preview Mode · Zero Logout Required
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleSwitcher;
