export const permissions = {
    user: ['read:users', 'read:hotels', 'read:bookings'],
    admin: ['read:users', 'write:users', 'read:hotels', 'write:hotels', 'read:bookings', 'write:bookings'],
    super_admin: ['*']
};
export function hasPermission(role, permission) {
    const rolePermissions = permissions[role] || [];
    return rolePermissions.includes('*') || rolePermissions.includes(permission);
}
