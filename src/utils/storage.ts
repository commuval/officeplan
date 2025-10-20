import { Employee, AttendanceEntry, Department } from '../types';
import { startOfWeek, subWeeks, format } from 'date-fns';
import { api, ApiError } from './api';
import { getDeviceId } from './identity';

// Event-System für Datenänderungen
const dataChangeCallbacks: (() => void)[] = [];

const notifyDataChange = () => {
  dataChangeCallbacks.forEach(callback => callback());
};

export const storage = {
  
  // Event-System
  onDataChange: (callback: () => void) => {
    dataChangeCallbacks.push(callback);
    return () => {
      const index = dataChangeCallbacks.indexOf(callback);
      if (index > -1) {
        dataChangeCallbacks.splice(index, 1);
      }
    };
  },
  
  // Abteilungen
  getDepartments: async (): Promise<Department[]> => {
    try {
      return await api.getDepartments();
    } catch (error) {
      console.error('Fehler beim Laden der Abteilungen:', error);
      throw error;
    }
  },

  // Mitarbeiter
  getEmployees: async (): Promise<Employee[]> => {
    try {
      return await api.getEmployees();
    } catch (error) {
      console.error('Fehler beim Laden der Mitarbeiter:', error);
      throw error;
    }
  },

  addEmployee: async (employee: Omit<Employee, 'id'>): Promise<Employee> => {
    try {
      const ownerId = getDeviceId();
      const newEmployee = await api.addEmployee({ ...employee, ownerId });
      notifyDataChange();
      return newEmployee;
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Mitarbeiters:', error);
      throw error;
    }
  },

  updateEmployee: async (id: string, employee: Partial<Employee>): Promise<Employee> => {
    try {
      const updatedEmployee = await api.updateEmployee(id, employee);
      notifyDataChange();
      return updatedEmployee;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Mitarbeiters:', error);
      throw error;
    }
  },

  deleteEmployee: async (id: string): Promise<void> => {
    try {
      await api.deleteEmployee(id);
      notifyDataChange();
    } catch (error) {
      console.error('Fehler beim Löschen des Mitarbeiters:', error);
      throw error;
    }
  },

  // Anwesenheit
  getAttendance: async (): Promise<AttendanceEntry[]> => {
    try {
      const attendance = await api.getAttendance();
      // Alte Daten bereinigen (älter als 1 Woche)
      return storage.cleanOldAttendanceData(attendance);
    } catch (error) {
      console.error('Fehler beim Laden der Anwesenheitsdaten:', error);
      throw error;
    }
  },

  addAttendanceEntry: async (entry: AttendanceEntry): Promise<AttendanceEntry> => {
    try {
      const ownerId = entry.ownerId ?? getDeviceId();
      const newEntry = await api.addAttendanceEntry({ ...entry, ownerId });
      notifyDataChange();
      return newEntry;
    } catch (error) {
      console.error('Fehler beim Speichern der Anwesenheit:', error);
      throw error;
    }
  },

  deleteAttendanceEntry: async (employeeId: string, date: string): Promise<void> => {
    try {
      await api.deleteAttendanceEntry(employeeId, date);
      notifyDataChange();
    } catch (error) {
      console.error('Fehler beim Löschen der Anwesenheit:', error);
      throw error;
    }
  },

  getAttendanceForDate: async (date: string): Promise<AttendanceEntry[]> => {
    try {
      const attendance = await storage.getAttendance();
      return attendance.filter(entry => entry.date === date);
    } catch (error) {
      console.error('Fehler beim Laden der Anwesenheit für Datum:', error);
      throw error;
    }
  },

  getAttendanceForEmployee: async (employeeId: string, startDate?: string, endDate?: string): Promise<AttendanceEntry[]> => {
    try {
      const attendance = await storage.getAttendance();
      return attendance.filter(entry => {
        if (entry.employeeId !== employeeId) return false;
        if (startDate && entry.date < startDate) return false;
        if (endDate && entry.date > endDate) return false;
        return true;
      });
    } catch (error) {
      console.error('Fehler beim Laden der Anwesenheit für Mitarbeiter:', error);
      throw error;
    }
  },

  // Alte Anwesenheitsdaten bereinigen (älter als 1 Woche)
  cleanOldAttendanceData: (attendance: AttendanceEntry[]): AttendanceEntry[] => {
    const oneWeekAgo = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
    const cutoffDate = format(oneWeekAgo, 'yyyy-MM-dd');
    
    return attendance.filter(entry => entry.date >= cutoffDate);
  },

  // Anwesenheitsdaten für nicht existierende Mitarbeiter bereinigen
  cleanOrphanedAttendanceData: async (): Promise<void> => {
    try {
      const employees = await storage.getEmployees();
      const attendance = await storage.getAttendance();
      const employeeIds = employees.map(emp => emp.id);
      
      const cleanedAttendance = attendance.filter(entry => 
        employeeIds.includes(entry.employeeId)
      );
      
      if (cleanedAttendance.length !== attendance.length) {
        console.log('Bereinige verwaiste Anwesenheitsdaten:', {
          before: attendance.length,
          after: cleanedAttendance.length,
          removed: attendance.length - cleanedAttendance.length
        });
        // Hier könnten wir einen API-Endpunkt für das Massen-Update hinzufügen
        // Für jetzt ignorieren wir das, da es selten vorkommt
      }
    } catch (error) {
      console.error('Fehler beim Bereinigen verwaister Anwesenheitsdaten:', error);
    }
  },
};

