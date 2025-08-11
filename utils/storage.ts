import { Employee, AttendanceEntry, Department } from '../types';
import { startOfWeek, subWeeks, format } from 'date-fns';

const STORAGE_KEYS = {
  EMPLOYEES: 'office_plan_employees',
  ATTENDANCE: 'office_plan_attendance',
  DEPARTMENTS: 'office_plan_departments',
};

// Standard-Abteilungen
const DEFAULT_DEPARTMENTS: Department[] = [
  { id: '1', name: 'IT', color: '#3b82f6' },
  { id: '2', name: 'Marketing', color: '#10b981' },
  { id: '3', name: 'Vertrieb', color: '#f59e0b' },
  { id: '4', name: 'HR', color: '#8b5cf6' },
  { id: '5', name: 'Finanzen', color: '#ef4444' },
];

// Standard-Mitarbeiter
const DEFAULT_EMPLOYEES: Employee[] = [
  { id: '1', name: 'Max Mustermann', department: 'IT' },
  { id: '2', name: 'Anna Schmidt', department: 'Marketing' },
  { id: '3', name: 'Tom Weber', department: 'Vertrieb' },
  { id: '4', name: 'Lisa Müller', department: 'HR' },
  { id: '5', name: 'Peter Fischer', department: 'Finanzen' },
];

export const storage = {
  // Abteilungen
  getDepartments: (): Department[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    if (stored) {
      return JSON.parse(stored);
    }
    // Erste Initialisierung
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(DEFAULT_DEPARTMENTS));
    return DEFAULT_DEPARTMENTS;
  },

  setDepartments: (departments: Department[]): void => {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
  },

  // Mitarbeiter
  getEmployees: (): Employee[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (stored) {
      return JSON.parse(stored);
    }
    // Erste Initialisierung
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(DEFAULT_EMPLOYEES));
    return DEFAULT_EMPLOYEES;
  },

  setEmployees: (employees: Employee[]): void => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  },

  // Anwesenheit
  getAttendance: (): AttendanceEntry[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    const attendance = stored ? JSON.parse(stored) : [];
    
    // Alte Daten bereinigen (älter als 1 Woche)
    const cleanedAttendance = storage.cleanOldAttendanceData(attendance);
    if (cleanedAttendance.length !== attendance.length) {
      storage.setAttendance(cleanedAttendance);
    }
    
    return cleanedAttendance;
  },

  setAttendance: (attendance: AttendanceEntry[]): void => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  },

  // Hilfsfunktionen
  addAttendanceEntry: (entry: AttendanceEntry): void => {
    const attendance = storage.getAttendance();
    const existingIndex = attendance.findIndex(
      a => a.employeeId === entry.employeeId && a.date === entry.date
    );
    
    if (existingIndex >= 0) {
      attendance[existingIndex] = entry;
    } else {
      attendance.push(entry);
    }
    
    storage.setAttendance(attendance);
  },

  getAttendanceForDate: (date: string): AttendanceEntry[] => {
    const attendance = storage.getAttendance();
    return attendance.filter(entry => entry.date === date);
  },

  getAttendanceForEmployee: (employeeId: string, startDate?: string, endDate?: string): AttendanceEntry[] => {
    const attendance = storage.getAttendance();
    return attendance.filter(entry => {
      if (entry.employeeId !== employeeId) return false;
      if (startDate && entry.date < startDate) return false;
      if (endDate && entry.date > endDate) return false;
      return true;
    });
  },

  // Alte Anwesenheitsdaten bereinigen (älter als 1 Woche)
  cleanOldAttendanceData: (attendance: AttendanceEntry[]): AttendanceEntry[] => {
    const oneWeekAgo = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
    const cutoffDate = format(oneWeekAgo, 'yyyy-MM-dd');
    
    return attendance.filter(entry => entry.date >= cutoffDate);
  },

  // Daten zurücksetzen
  resetData: (): void => {
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.DEPARTMENTS);
  },
};
