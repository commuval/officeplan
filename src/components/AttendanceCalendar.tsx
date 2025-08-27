import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, User, X, Plus, Dog } from 'lucide-react';
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

  const loadData = () => {
    setEmployees(storage.getEmployees());
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
      // Status durchwechseln: abwesend -> anwesend -> mit hund -> abwesend
      let newStatus: AttendanceStatus;
      
      if (existingEntry.status === 'absent') {
        newStatus = 'present';
      } else if (existingEntry.status === 'present') {
        // Prüfen, ob bereits 2 Hunde für diesen Tag vorhanden sind
        const currentDogCount = attendance.filter(entry => 
          entry.date === dateStr && 
          entry.status === 'present_with_dog' &&
          entry.employeeId !== employeeId // Aktueller Mitarbeiter nicht mitzählen
        ).length;
        
        if (currentDogCount < 2) {
          newStatus = 'present_with_dog';
        } else {
          // Wenn bereits 2 Hunde da sind, zu "Abwesend" wechseln
          newStatus = 'absent';
        }
      } else if (existingEntry.status === 'present_with_dog') {
        newStatus = 'absent';
      } else {
        newStatus = 'absent';
      }
      
      const updatedEntry: AttendanceEntry = {
        ...existingEntry,
        status: newStatus,
      };
      
      storage.addAttendanceEntry(updatedEntry);
    } else {
      // Neuen Eintrag erstellen - prüfen, ob bereits 2 Hunde vorhanden sind
      const currentDogCount = attendance.filter(entry => 
        entry.date === dateStr && 
        entry.status === 'present_with_dog'
      ).length;
      
      let newStatus: AttendanceStatus;
      if (currentDogCount < 2) {
        newStatus = 'present_with_dog';
      } else {
        newStatus = 'present';
      }
      
      const newEntry: AttendanceEntry = {
        id: Date.now().toString(),
        employeeId: employeeId,
        date: dateStr,
        status: newStatus,
      };
      
      console.log('DEBUG - New entry:', { newStatus, currentDogCount });
      storage.addAttendanceEntry(newEntry);
    }
    
    // Daten neu laden um sicherzustellen, dass alles synchron ist
    setAttendance(storage.getAttendance());
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
                {currentWeek.map((date) => {
                  const dogCount = getDogCountForDate(date);
                  return (
                    <div key={date.toISOString()} className="flex items-center">
                      <span className="text-xs text-gray-500">
                        {format(date, 'dd.MM')}: {dogCount}/2 Hunde
                      </span>
                    </div>
                  );
                })}
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
                          <div className="text-sm text-gray-500">
                            {employee.department}
                          </div>
                        </div>
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
                            
                            {/* Hund-Limit-Indikator */}
                            {dogCount >= 2 && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                !
                              </div>
                            )}
                          </div>

                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;

