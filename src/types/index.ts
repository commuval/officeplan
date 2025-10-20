export interface Employee {
  id: string;
  name: string;
  department: string;
  avatar?: string;
  ownerId?: string; // lokale Ownership: nur Ersteller darf bearbeiten/löschen
}

export interface AttendanceEntry {
  id: string;
  employeeId: string;
  date: string;
  status: 'present' | 'absent' | 'present_with_dog';
  startTime?: string;
  endTime?: string;
  notes?: string;
  ownerId?: string; // lokale Ownership: nur Ersteller darf bearbeiten/löschen
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

