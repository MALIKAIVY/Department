export type UserRole = 'student' | 'faculty' | 'alumni' | 'admin';
export type YearbookStatus = 'pending' | 'approved' | 'rejected';
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  consent_given?: boolean;
  consent_timestamp?: string | null;
  is_first_login?: boolean;
  last_login?: string | null;
  created_at: string;
}

export interface StudentData {
  student_id: string;
  year_of_study: number | null;
  graduation_year: number | null;
  courses_enrolled?: string[];
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
}

export interface FacultyData {
  faculty_id: string;
  department: string;
  designation: string;
  courses_teaching?: string[];
  office_location?: string | null;
  linkedin_url?: string | null;
  research_interest?: string[];
}

export interface AlumniData {
  alumni_id: string;
  graduation_year: number;
  degree_earned: string;
  current_company?: string | null;
  current_position?: string | null;
  industry?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  is_visible?: boolean;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  consent_given?: boolean;
  consent_timestamp?: string | null;
  is_first_login?: boolean;
  last_login?: string | null;
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
  course: string | null;
  linkedin_url: string | null;
  profile_image_url: string | null;
  status: YearbookStatus;
  rejection_reason?: string | null;
  author_name?: string;
  created_at: string;
}

export interface MemorySubmission {
  id: string;
  submitted_by: string;
  title: string;
  story: string;
  media_url?: string | null;
  academic_year: string;
  event_name?: string | null;
  location?: string | null;
  status: YearbookStatus;
  rejection_reason?: string | null;
  created_at: string;
  author_name?: string | null;
  author_role?: string | null;
}

export interface Connection {
  id: string;
  requester_id?: string;
  receiver_id?: string;
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
  media_url?: string | null;
  author_id: string;
  author_name?: string;
  target_roles: UserRole[];
  is_published: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
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
