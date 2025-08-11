export interface Employee {
  id: string;
  name: string;
  department: string;
  avatar?: string;
}

export interface AttendanceEntry {
  id: string;
  employeeId: string;
  date: string;
  status: 'present' | 'absent' | 'present_with_dog';
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export interface Department {
  id: string;
  name: string;
  color: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'present_with_dog';

export interface AttendanceStats {
  present: number;
  absent: number;
  total: number;
}
