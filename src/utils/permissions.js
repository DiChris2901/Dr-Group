// Centralized permission helpers for DR Group Dashboard
// Determines admin privileges consistently across the app

import { isSystemUser } from '../config/systemUsers';

/**
 * Determine if the current user should be treated as an admin.
 * Criteria:
 * - userProfile.role is ADMIN or SUPER_ADMIN (case-insensitive)
 * - OR the user's email is a known system admin (see systemUsers)
 */
export const isAdminUser = (currentUser, userProfile) => {
  try {
    const role = userProfile?.role || '';
    const email = (currentUser?.email || '').toLowerCase();
    const byRole = role && ['admin', 'super_admin', 'super-admin', 'ADMIN', 'SUPER_ADMIN'].includes(String(role));
    const bySystemUser = email ? isSystemUser(email) : false;
    return Boolean(byRole || bySystemUser);
  } catch (e) {
    // Be safe; if anything goes wrong, default to non-admin
    return false;
  }
};

export default {
  isAdminUser,
};
