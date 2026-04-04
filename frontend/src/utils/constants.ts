import type { UserRole } from '../types';

export const APP_NAME = 'Finance Dashboard';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  analyst: 'Analyst',
  viewer: 'Viewer',
};

export const ROLE_ACCESS: Record<UserRole, string[]> = {
  admin: ['dashboard', 'finance', 'users'],
  analyst: ['dashboard', 'finance'],
  viewer: ['dashboard'],
};
