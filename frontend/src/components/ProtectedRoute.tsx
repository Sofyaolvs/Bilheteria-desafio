import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../lib/auth-store';
import type { UserRole } from '../types';

export function ProtectedRoute({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/entrar" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
