import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, User, X, Plus, Dog, Trash2 } from 'lucide-react';
import { Employee, AttendanceEntry, AttendanceStatus } from '../types';
import { storage } from '../utils/storage';

interface AttendanceCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ selectedDate, onDateSelect }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Date[]>([]);
  const [newEmployeeName, setNewEmployeeName] = useState('');

  useEffect(() => {
    console.log('AttendanceCalendar - Initialisierung:', {
      localStorageAvailable: typeof window !== 'undefined' && !!window.localStorage,
      employeesCount: storage.getEmployees().length,
      attendanceCount: storage.getAttendance().length
    });
    
    loadData();
    generateWeekDays();
  }, []);

  useEffect(() => {
    generateWeekDays();
  }, [selectedDate]);

  // Daten neu laden wenn sich Mitarbeiter oder Anwesenheitsdaten ändern
  useEffect(() => {
    const unsubscribe = storage.onDataChange(() => {
      console.log('Datenänderung erkannt - lade Daten neu');
      loadData();
    });

    return unsubscribe;
  }, []);

  const loadData = () => {
    // Verwaiste Anwesenheitsdaten bereinigen
    storage.cleanOrphanedAttendanceData();
    
    let allEmployees = storage.getEmployees();
    
    // Wenn es Mitarbeiter gibt, den ersten lokal hinzugefügten immer ganz oben anzeigen
    if (allEmployees.length > 0) {
      // Der erste Mitarbeiter (niedrigste ID) wird immer ganz oben angezeigt
      // Neue Mitarbeiter kommen darunter
      allEmployees.sort((a, b) => {
        const idA = parseInt(a.id);
        const idB = parseInt(b.id);
        return idA - idB; // Aufsteigend sortieren (älteste zuerst)
      });
    }
    
    setEmployees(allEmployees);
    setAttendance(storage.getAttendance());
  };

  const generateWeekDays = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const days: Date[] = [];
    // Nur Montag bis Freitag (5 Tage)
    for (let i = 0; i < 5; i++) {
      days.push(addDays(weekStart, i));
    }
    setCurrentWeek(days);
  };

  const getStatusIcon = (status: AttendanceStatus | null) => {
    if (!status) return <Plus className="w-4 h-4 text-gray-400" />;
    
    switch (status) {
      case 'present':
        return <User className="w-4 h-4 text-green-600" />;
      case 'present_with_dog':
        return <Dog className="w-4 h-4 text-orange-600" />;
      case 'absent':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <Plus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: AttendanceStatus | null) => {
    if (!status) return 'bg-gray-50 text-gray-500 border-gray-200';
    
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'present_with_dog':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const getStatusText = (status: AttendanceStatus | null) => {
    if (!status) return 'Hinzufügen';
    
    switch (status) {
      case 'present':
        return 'Anwesend';
      case 'present_with_dog':
        return 'Mit Hund';
      case 'absent':
        return 'Abwesend';
      default:
        return 'Hinzufügen';
    }
  };

  const getAttendanceForEmployeeAndDate = (employeeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return attendance.find(entry => 
      entry.employeeId === employeeId && entry.date === dateStr
    );
  };

  const getDogCountForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return attendance.filter(entry => 
      entry.date === dateStr && entry.status === 'present_with_dog'
    ).length;
  };

  const handleCellClick = (employeeId: string, date: Date) => {
    const existingEntry = getAttendanceForEmployeeAndDate(employeeId, date);
    const dogCount = getDogCountForDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    console.log('DEBUG - Click:', {
      employeeId,
      date: dateStr,
      existingStatus: existingEntry?.status,
      dogCount,
      allEntriesForDate: attendance.filter(entry => entry.date === dateStr),
      localStorageAvailable: typeof window !== 'undefined' && !!window.localStorage
    });
    
    if (existingEntry) {
      // Status durchwechseln: anwesend -> abwesend -> mit hund -> anwesend -> abwesend -> mit hund...
      let newStatus: AttendanceStatus;
      
      if (existingEntry.status === 'present') {
        newStatus = 'absent';
      } else if (existingEntry.status === 'absent') {
        // Prüfe ob bereits 2 Hunde für diesen Tag vorhanden sind
        if (dogCount >= 2) {
          newStatus = 'present'; // Überspringe "mit Hund" wenn bereits 2 Hunde da sind
        } else {
          newStatus = 'present_with_dog';
        }
      } else if (existingEntry.status === 'present_with_dog') {
        newStatus = 'present';
      } else {
        newStatus = 'present';
      }
      
      const updatedEntry: AttendanceEntry = {
        ...existingEntry,
        status: newStatus,
      };
      
      storage.addAttendanceEntry(updatedEntry);
    } else {
      // Neuen Eintrag erstellen - immer mit "Anwesend" beginnen
      const newStatus: AttendanceStatus = 'present';
      
      const newEntry: AttendanceEntry = {
        id: Date.now().toString(),
        employeeId: employeeId,
        date: dateStr,
        status: newStatus,
      };
      
      storage.addAttendanceEntry(newEntry);
    }
    
    // Daten neu laden um sicherzustellen, dass alles synchron ist
    const updatedAttendance = storage.getAttendance();
    setAttendance(updatedAttendance);
    
    console.log('Status aktualisiert:', {
      employeeId,
      date: dateStr,
      newStatus: existingEntry ? 'updated' : 'created',
      totalAttendanceEntries: updatedAttendance.length,
      entriesForDate: updatedAttendance.filter(entry => entry.date === dateStr).length
    });
  };

  const handleAddEmployee = () => {
    if (!newEmployeeName.trim()) return;

    const newEmployee: Employee = {
      id: Date.now().toString(),
      name: newEmployeeName.trim(),
      department: 'Unbekannt', // Standardwert
    };

    storage.addEmployee(newEmployee);
    setNewEmployeeName('');
    loadData(); // Daten neu laden, um den neuen Mitarbeiter zu sehen
  };

  const handleDeleteEmployee = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    const confirmMessage = `Sind Sie sicher, dass Sie "${employee.name}" löschen möchten?\n\nDies löscht auch alle Anwesenheitsdaten dieser Person.`;
    
    if (window.confirm(confirmMessage)) {
      // Mitarbeiter aus der Liste entfernen
      const updatedEmployees = employees.filter(emp => emp.id !== employeeId);
      storage.setEmployees(updatedEmployees);
      setEmployees(updatedEmployees);
      
      // Anwesenheitsdaten des gelöschten Mitarbeiters entfernen
      const currentAttendance = storage.getAttendance();
      const cleanedAttendance = currentAttendance.filter(entry => entry.employeeId !== employeeId);
      storage.setAttendance(cleanedAttendance);
      setAttendance(cleanedAttendance);
      
      console.log('Mitarbeiter gelöscht:', {
        employeeName: employee.name,
        employeeId,
        removedAttendanceEntries: currentAttendance.length - cleanedAttendance.length
      });
    }
  };

  const handlePreviousWeek = () => {
    const newDate = addDays(selectedDate, -7);
    onDateSelect(newDate);
  };

  const handleNextWeek = () => {
    const newDate = addDays(selectedDate, 7);
    onDateSelect(newDate);
  };

  const isCurrentWeek = () => {
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return currentWeekStart.getTime() === selectedWeekStart.getTime();
  };

  return (
    <div className="space-y-6">
      {/* Kalender-Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {!isCurrentWeek() && (
            <button
              onClick={handlePreviousWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {currentWeek.length > 0 ? (
                `${format(currentWeek[0], 'dd.MM.yyyy', { locale: de })} - ${format(currentWeek[4], 'dd.MM.yyyy', { locale: de })}`
              ) : (
                'Lade Kalender...'
              )}
            </h2>
            {currentWeek.length > 0 && (
              <div className="flex items-center justify-center mt-2 space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Dog className="w-4 h-4 mr-1" />
                  <span>Empfohlen: Max 2 Hunde pro Tag</span>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Kalender-Tabelle */}
      {currentWeek.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Mitarbeiter
                  </th>
                  {currentWeek.map((date) => (
                    <th key={date.toISOString()} className="px-2 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-400">
                          {format(date, 'EEE', { locale: de })}
                        </span>
                        <span className={`text-sm font-medium ${
                          isToday(date) ? 'text-blue-600 bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center' : ''
                        }`}>
                          {format(date, 'dd')}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-700">
                                {employee.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.name}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEmployee(employee.id);
                          }}
                          className="p-1 hover:bg-red-100 rounded-full text-red-600 transition-colors"
                          title="Mitarbeiter löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    {currentWeek.map((date) => {
                      const entry = getAttendanceForEmployeeAndDate(employee.id, date);
                      const dogCount = getDogCountForDate(date);
                      return (
                        <td 
                          key={date.toISOString()} 
                          className="px-2 py-3 text-center cursor-pointer hover:bg-gray-100 transition-colors relative"
                          onClick={() => handleCellClick(employee.id, date)}
                        >
                          <div className="flex items-center justify-center">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(entry?.status || null)}`}>
                              {getStatusIcon(entry?.status || null)}
                              <span className="ml-1">{getStatusText(entry?.status || null)}</span>
                            </div>
                          </div>

                        </td>
                      );
                    })}
                  </tr>
                ))}
                
                {/* Neue Mitarbeiter-Zeile */}
                <tr className="bg-gray-50 hover:bg-gray-100">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <Plus className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            placeholder="Vollständiger Name..."
                            value={newEmployeeName}
                            onChange={(e) => setNewEmployeeName(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddEmployee()}
                          />
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex items-center mt-6">
                        <button
                          onClick={handleAddEmployee}
                          disabled={!newEmployeeName.trim()}
                          className="px-4 py-1.5 text-sm font-medium bg-green-700 text-white rounded-md hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                        >
                          Hinzufügen
                        </button>
                      </div>
                    </div>
                  </td>
                  {currentWeek.map((date) => (
                    <td key={date.toISOString()} className="px-2 py-4 text-center">
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;

