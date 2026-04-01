export interface Center {
  id: number;
  name: string;
  location: string;
}

export interface Department {
  id: number;
  center_id: number;
  name: string;
  description: string;
  sewadar_count?: number;
  center?: Center;
}

export interface Sewadar {
  id: number;
  sewadar_id: string;
  uuid?: string;
  name: string;
  center_id: number;
  center?: Center;
  department_id: number;
  department?: Department;
  parent_spouse_name?: string;
  gender?: string;
  badge_status?: string;
  phone?: string;
  email?: string;
  created_at: string;
}

export interface Attendance {
  id: number;
  sewadar_id: number;
  sewadar?: Sewadar;
  center_id: number;
  center?: Center;
  department_id: number;
  department?: Department;
  date: string;
  check_in: string;
  check_out?: string | null;
  marked_by: number;
  created_at: string;
}

export interface DashboardStats {
  total_sewadars: number;
  today_attendance: number;
  today_by_dept: { id: number; name: string; count: number }[];
  today_by_center: { id: number; name: string; count: number }[];
}

export interface User {
  id: number;
  username: string;
  role: 'super_admin' | 'center_admin' | 'operator' | 'dept_viewer';
  center_id?: number;
  center?: Center;
}

export interface Feedback {
  id: number;
  user_id?: number;
  user?: User;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
