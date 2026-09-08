import { UserProfile, UserPermissions, ModulePermissions, ActionPermissions } from '../types';

export interface RolePreset {
  id: string;
  name: string;
  description: string;
  role: 'admin' | 'user' | string;
  permissions: UserPermissions;
}

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'admin',
    name: 'Administrator',
    role: 'admin',
    description: 'Full administrative access across all system modules and user management',
    permissions: {
      modules: {
        overview: true,
        annual_report: true,
        suite: true,
        activity: true,
        gantt: true,
        directory: true,
        dissemination: true,
        capacity: true,
        settings: true,
        users: true
      },
      actions: {
        export: true,
        createEdit: true,
        delete: true,
        manageUsers: true
      }
    }
  },
  {
    id: 'co_director',
    name: 'Co-Director / Executive',
    role: 'user',
    description: 'Executive overview, suite analytics, work packages, full export & editing rights',
    permissions: {
      modules: {
        overview: true,
        annual_report: true,
        suite: true,
        activity: true,
        gantt: true,
        directory: true,
        dissemination: true,
        capacity: true,
        settings: true,
        users: false
      },
      actions: {
        export: true,
        createEdit: true,
        delete: true,
        manageUsers: false
      }
    }
  },
  {
    id: 'researcher',
    name: 'Researcher / Contributor',
    role: 'user',
    description: 'Access to research modules, data entry and content export. Deletion restricted.',
    permissions: {
      modules: {
        overview: true,
        annual_report: true,
        suite: false,
        activity: true,
        gantt: true,
        directory: true,
        dissemination: true,
        capacity: true,
        settings: true,
        users: false
      },
      actions: {
        export: true,
        createEdit: true,
        delete: false,
        manageUsers: false
      }
    }
  },
  {
    id: 'viewer',
    name: 'Viewer / External Partner',
    role: 'user',
    description: 'Read-only access to directory, publications and project overview',
    permissions: {
      modules: {
        overview: true,
        annual_report: true,
        suite: false,
        activity: true,
        gantt: true,
        directory: true,
        dissemination: true,
        capacity: true,
        settings: true,
        users: false
      },
      actions: {
        export: false,
        createEdit: false,
        delete: false,
        manageUsers: false
      }
    }
  }
];

export const MODULE_DEFINITIONS: { id: keyof ModulePermissions; label: string; description: string; iconName: string }[] = [
  { id: 'overview', label: 'Project Overview', description: 'Main project summary & key stats', iconName: 'Target' },
  { id: 'annual_report', label: 'Progress Report', description: '6-monthly progress, deliverables & funder reporting', iconName: 'FileCheck' },
  { id: 'suite', label: 'Executive Suite', description: 'Co-Director dashboard & priorities', iconName: 'LayoutDashboard' },
  { id: 'activity', label: 'Activity Tracker', description: 'Work package deliverables & tickets', iconName: 'ClipboardList' },
  { id: 'gantt', label: 'Gantt Schedule', description: 'Project timeline & milestone planning', iconName: 'Clock' },
  { id: 'directory', label: 'Team Directory', description: 'Global team contacts & institutions', iconName: 'Users' },
  { id: 'dissemination', label: 'Content Management', description: 'Publications, media & resource hub', iconName: 'Library' },
  { id: 'capacity', label: 'Capacity & Training', description: 'NIHR Academy, mentoring & events', iconName: 'GraduationCap' },
  { id: 'settings', label: 'Account Settings', description: 'User profile settings & preferences', iconName: 'Settings' },
  { id: 'users', label: 'User Management', description: 'Manage team approvals & role permissions', iconName: 'UserCircle2' },
];

export const ACTION_DEFINITIONS: { id: keyof ActionPermissions; label: string; description: string }[] = [
  { id: 'export', label: 'Export Data & Reports', description: 'Ability to download CSV files, export schedule data & reports' },
  { id: 'createEdit', label: 'Create & Edit Content', description: 'Ability to add, edit, and manage tickets, tasks, literature, manuscripts, and trainee records' },
  { id: 'delete', label: 'Delete Records', description: 'Ability to permanently delete records across all modules' },
  { id: 'manageUsers', label: 'Manage Users & Roles', description: 'Ability to approve pending requests, grant roles and assign permissions' },
];

export const ACTIVITY_COUNTRIES = [
  'Central',
  'Brazil',
  'India',
  'Peru',
  'Mexico',
  'South Africa',
  'Sri Lanka',
  'UK'
];

export function getUserAllowedCountries(
  userProfile: UserProfile | null | undefined,
  isAdmin: boolean
): string[] | null {
  if (!userProfile) return null;
  if (userProfile.email?.toLowerCase() === 'ganiillin@gmail.com') return null;
  if (userProfile.role === 'admin' || isAdmin) return null;

  const allowed = userProfile.permissions?.allowedCountries;
  if (!allowed || allowed.length === 0 || allowed.includes('All')) {
    return null; // null means unrestricted access across all countries
  }
  return allowed;
}

export function isCountryAllowedForUser(
  userProfile: UserProfile | null | undefined,
  ticketCountries: string[] | undefined,
  isAdmin: boolean
): boolean {
  const allowed = getUserAllowedCountries(userProfile, isAdmin);
  if (!allowed) return true; // No country restrictions
  if (!ticketCountries || ticketCountries.length === 0) return true; // Unassigned / general items
  return ticketCountries.some(c => allowed.includes(c));
}

export function hasModuleAccess(
  userProfile: UserProfile | null | undefined,
  moduleKey: string,
  isAdmin: boolean
): boolean {
  if (!userProfile) return false;
  if (userProfile.email?.toLowerCase() === 'ganiillin@gmail.com') return true;

  if (userProfile.permissions?.modules) {
    const val = userProfile.permissions.modules[moduleKey as keyof ModulePermissions];
    if (val !== undefined) return val;
  }

  if (userProfile.role === 'admin' || isAdmin) {
    return true;
  }

  if (moduleKey === 'users' || moduleKey === 'suite') {
    return false;
  }

  return true;
}

export function hasActionPermission(
  userProfile: UserProfile | null | undefined,
  actionKey: keyof ActionPermissions,
  isAdmin: boolean
): boolean {
  if (!userProfile) return false;
  if (userProfile.email?.toLowerCase() === 'ganiillin@gmail.com') return true;

  if (userProfile.permissions?.actions) {
    const val = userProfile.permissions.actions[actionKey];
    if (val !== undefined) return val;
  }

  if (userProfile.role === 'admin' || isAdmin) {
    return true;
  }

  if (actionKey === 'export' || actionKey === 'createEdit') {
    return true;
  }

  return false;
}
