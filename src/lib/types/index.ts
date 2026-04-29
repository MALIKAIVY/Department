export type UserRole = 'student' | 'faculty' | 'alumni' | 'admin';
export type YearbookStatus = 'pending' | 'approved' | 'rejected';
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface StudentData {
  student_id: string;
  year_of_study: number | null;
  graduation_year: number | null;
}

export interface FacultyData {
  faculty_id: string;
  department: string;
  designation: string;
}

export interface AlumniData {
  alumni_id: string;
  graduation_year: number;
  degree_earned: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  student?: StudentData;
  faculty?: FacultyData;
  alumni?: AlumniData;
  created_at: string;
}


export type AnyProfile = Profile;

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: Profile;
  access_token: string;
  refresh_token: string;
  token_type: string;
}



export interface YearbookEntry {
  id: string;
  user_id: string;
  academic_year: string;
  yearbook_quote: string | null;
  favorite_memory: string | null;
  future_plans: string | null;
  profile_image_url: string | null;
  status: YearbookStatus;
  author_name?: string;
  created_at: string;
}

export interface Connection {
  id: string;
  status: ConnectionStatus;
  message?: string;
  other_user: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: UserRole;
  };
  is_requester: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name?: string;
  target_roles: UserRole[];
  is_published: boolean;
  created_at: string;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  // Role specific
  student_id?: string;
  year_of_study?: number;
  graduation_year?: number;
  department?: string;
  designation?: string;
  degree_earned?: string;
}

export interface SearchFilters {
  role?: UserRole;
  academic_year?: string;
  search_query?: string;
}

