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
  
  // Hilfsfunktion für sicheres localStorage
  safeLocalStorage: {
    getItem: (key: string): string | null => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const result = window.localStorage.getItem(key);
          console.log(`localStorage getItem(${key}):`, result ? 'Daten gefunden' : 'Keine Daten');
          return result;
        }
        console.warn('localStorage nicht verfügbar - window oder localStorage fehlt');
        return null;
      } catch (error) {
        console.error('localStorage Fehler beim Lesen:', error);
        return null;
      }
    },
    
    setItem: (key: string, value: string): void => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
          console.log(`localStorage setItem(${key}): Erfolgreich gespeichert`);
        } else {
          console.warn('localStorage nicht verfügbar - kann nicht speichern');
        }
      } catch (error) {
        console.error('localStorage Fehler beim Speichern:', error);
      }
    },
    
    removeItem: (key: string): void => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
          console.log(`localStorage removeItem(${key}): Erfolgreich entfernt`);
        } else {
          console.warn('localStorage nicht verfügbar - kann nicht entfernen');
        }
      } catch (error) {
        console.error('localStorage Fehler beim Entfernen:', error);
      }
    }
  },
  
  // Abteilungen
  getDepartments: (): Department[] => {
    const stored = storage.safeLocalStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.warn('Fehler beim Parsen der Abteilungsdaten:', error);
      }
    }
    // Erste Initialisierung
    storage.safeLocalStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(DEFAULT_DEPARTMENTS));
    return DEFAULT_DEPARTMENTS;
  },

  setDepartments: (departments: Department[]): void => {
    storage.safeLocalStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
  },

  // Mitarbeiter
  getEmployees: (): Employee[] => {
    const stored = storage.safeLocalStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.warn('Fehler beim Parsen der Mitarbeiterdaten:', error);
      }
    }
    // Erste Initialisierung
    storage.safeLocalStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(DEFAULT_EMPLOYEES));
    return DEFAULT_EMPLOYEES;
  },

  setEmployees: (employees: Employee[]): void => {
    storage.safeLocalStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  },

  // Anwesenheit
  getAttendance: (): AttendanceEntry[] => {
    const stored = storage.safeLocalStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    let attendance: AttendanceEntry[] = [];
    
    if (stored) {
      try {
        attendance = JSON.parse(stored);
      } catch (error) {
        console.warn('Fehler beim Parsen der Anwesenheitsdaten:', error);
        attendance = [];
      }
    }
    
    // Alte Daten bereinigen (älter als 1 Woche)
    const cleanedAttendance = storage.cleanOldAttendanceData(attendance);
    if (cleanedAttendance.length !== attendance.length) {
      storage.setAttendance(cleanedAttendance);
    }
    
    return cleanedAttendance;
  },

  setAttendance: (attendance: AttendanceEntry[]): void => {
    storage.safeLocalStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
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
    storage.safeLocalStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
    storage.safeLocalStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    storage.safeLocalStorage.removeItem(STORAGE_KEYS.DEPARTMENTS);
  },
};

