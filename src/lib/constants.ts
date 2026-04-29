import {
  BarChart3,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Search,
  Users,
} from 'lucide-react';
import type { UserRole } from './types';

export const APP_NAME = 'DTCY';
export const APP_FULL_NAME = 'Digital Tech-Connect Yearbook';

export const USER_ROLES = ['student', 'faculty', 'alumni', 'admin'] as const satisfies readonly UserRole[];
export const PUBLIC_SIGNUP_ROLES = ['faculty', 'alumni'] as const satisfies readonly UserRole[];

export const ROLE_DESCRIPTIONS: Record<(typeof PUBLIC_SIGNUP_ROLES)[number], string> = {
  faculty: 'Faculty member or instructor',
  alumni: 'Graduate of the program',
};

export const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Consulting',
  'Government',
  'Non-profit',
  'Other',
];

export const TEST_ACCOUNTS = [
  'student@dtcy.com / Student@123',
  'faculty@dtcy.com / Faculty@123',
  'alumni@dtcy.com / Alumni@123',
  'admin@dtcy.com / Admin@123',
];

export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: USER_ROLES,
  },
  {
    label: 'Yearbook',
    href: '/yearbook',
    icon: BookOpen,
    roles: USER_ROLES,
  },
  {
    label: 'Alumni Network',
    href: '/alumni',
    icon: Users,
    roles: ['student', 'alumni'],
  },
  {
    label: 'Search',
    href: '/search',
    icon: Search,
    roles: USER_ROLES,
  },
  {
    label: 'Announcements',
    href: '/announcements',
    icon: MessageSquare,
    roles: USER_ROLES,
  },
  {
    label: 'Admin Panel',
    href: '/admin',
    icon: BarChart3,
    roles: ['admin', 'faculty'],
  },
  {
    label: 'Moderation',
    href: '/admin/moderation',
    icon: GraduationCap,
    roles: ['faculty', 'admin'],
  },
] as const;
