import { createContext } from 'react';
import type { BackendUser, LoginInput } from '@/lib/api/auth';

export type AuthContextValue = {
  user: BackendUser | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  signOut: () => Promise<void>;
};
export const AuthContext = createContext<AuthContextValue | null>(null);
