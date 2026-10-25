import type { ReactNode } from 'react';

export const shadcn = {};

export function publishableKeyFromHost(_host: string, key?: string): string {
  return key || '';
}

export function ClerkProvider({
  children,
}: {
  children: ReactNode;
  publishableKey?: string;
  appearance?: unknown;
}) {
  return <>{children}</>;
}

export function Show({ children }: { children: ReactNode; when?: unknown }) {
  return <>{children}</>;
}

export function SignIn(_props: Record<string, unknown>) {
  return null;
}

export function SignUp(_props: Record<string, unknown>) {
  return null;
}

export function useAuth() {
  return {
    isLoaded: true,
    isSignedIn: true,
    userId: 'usr_collat_admin',
  };
}

export function useUser() {
  return {
    isLoaded: true as const,
    isSignedIn: true as const,
    user: {
      firstName: 'Kojo',
      lastName: 'Admin',
      fullName: 'Kojo Admin',
      primaryEmailAddress: { emailAddress: 'admin@collage.com.gh' },
    },
  };
}

export function useClerk() {
  return {
    signOut: (opts?: unknown) => {
      const redirectUrl =
        typeof opts === 'object' && opts !== null && 'redirectUrl' in opts
          ? String((opts as { redirectUrl?: string }).redirectUrl || '/')
          : '/';
      window.location.href = redirectUrl;
    },
  };
}
