import { useAuth } from '../context/AuthContext';

export function usePermission() {
  const { user } = useAuth();

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'DOCTOR') return true;
    if (user.role === 'RECEPTIONIST') {
      return (user.permissions || []).includes(permission);
    }
    return false;
  };

  const hasAnyPermission = (...permissions) => {
    return permissions.some(p => hasPermission(p));
  };

  const hasAllPermissions = (...permissions) => {
    return permissions.every(p => hasPermission(p));
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions, permissions: user?.permissions || [] };
}
