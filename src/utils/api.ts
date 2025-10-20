import { Employee, AttendanceEntry, Department } from '../types';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080';

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}/api${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Netzwerkfehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

export const api = {
  // Mitarbeiter
  getEmployees: (): Promise<Employee[]> => 
    apiRequest<Employee[]>('/employees'),

  addEmployee: (employee: Omit<Employee, 'id'>): Promise<Employee> => 
    apiRequest<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    }),

  updateEmployee: (id: string, employee: Partial<Employee>): Promise<Employee> => 
    apiRequest<Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employee),
    }),

  deleteEmployee: (id: string): Promise<void> => 
    apiRequest<void>(`/employees/${id}`, {
      method: 'DELETE',
    }),

  // Abteilungen
  getDepartments: (): Promise<Department[]> => 
    apiRequest<Department[]>('/departments'),

  // Anwesenheit
  getAttendance: (): Promise<AttendanceEntry[]> => 
    apiRequest<AttendanceEntry[]>('/attendance'),

  addAttendanceEntry: (entry: AttendanceEntry): Promise<AttendanceEntry> => 
    apiRequest<AttendanceEntry>('/attendance', {
      method: 'POST',
      body: JSON.stringify(entry),
    }),

  deleteAttendanceEntry: (employeeId: string, date: string): Promise<void> => 
    apiRequest<void>(`/attendance/${employeeId}/${date}`, {
      method: 'DELETE',
    }),
};

export { ApiError };
