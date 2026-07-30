import { useAuth } from '@/hooks/useAuth';

/*
 * The signed-in user's capability flags, straight from the login response.
 * Components use these to show or hide actions so a user is never offered a
 * button the backend would reject.
 */
export interface Permissions {
  canRead: boolean;
  canWrite: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canDelete: boolean;
  /** True when the user only manages a subset of employees/sites. */
  isScoped: boolean;
  scopedEmployeeCount: number;
  scopedSiteCount: number;
}

export function usePermissions(): Permissions {
  const { user } = useAuth();
  const permissions = user?.permissions;
  const employeeCount = user?.employeeIds?.length ?? 0;
  const siteCount = user?.siteIds?.length ?? 0;

  return {
    canRead: permissions?.read ?? false,
    canWrite: permissions?.write ?? false,
    canEdit: permissions?.edit ?? false,
    canApprove: permissions?.approve ?? false,
    canDelete: permissions?.delete ?? false,
    isScoped: employeeCount > 0 || siteCount > 0,
    scopedEmployeeCount: employeeCount,
    scopedSiteCount: siteCount,
  };
}
