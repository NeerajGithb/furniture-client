import { useAuth } from '@/context/AuthContext';

export function useCurrentUser() {
  return useAuth();
}
