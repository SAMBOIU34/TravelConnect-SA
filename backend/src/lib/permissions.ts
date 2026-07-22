export const permissions = {
  user: ['read:users', 'read:hotels', 'read:bookings'],
  admin: ['read:users', 'write:users', 'read:hotels', 'write:hotels', 'read:bookings', 'write:bookings'],
  super_admin: ['*']
};

export function hasPermission(role: string, permission: string) {
  const rolePermissions = permissions[role as keyof typeof permissions] || [];
  return rolePermissions.includes('*') || rolePermissions.includes(permission);
}
