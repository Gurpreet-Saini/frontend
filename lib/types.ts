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
  name: string;
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
}
