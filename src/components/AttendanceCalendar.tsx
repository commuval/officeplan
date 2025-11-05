import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, User, X, Plus, Dog, Trash2, Lock } from 'lucide-react';
import { Employee, AttendanceEntry, AttendanceStatus } from '../types';
import { storage } from '../utils/storage';
import { getDeviceId } from '../utils/identity';

interface AttendanceCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ selectedDate, onDateSelect }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Date[]>([]);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalType, setPasswordModalType] = useState<'set' | 'verify'>('set');
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingAction, setPendingAction] = useState<{employeeId: string, date: Date, entry?: AttendanceEntry} | null>(null);

  useEffect(() => {
    console.log('AttendanceCalendar - Initialisierung');
    
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

  const loadData = async () => {
    try {
      // Verwaiste Anwesenheitsdaten bereinigen
      await storage.cleanOrphanedAttendanceData();
      
      const [allEmployees, allAttendance] = await Promise.all([
        storage.getEmployees(),
        storage.getAttendance()
      ]);
      
      // Sortierung: Lokal hinzugefügte Mitarbeiter immer oben
      if (allEmployees.length > 0) {
        const localEmployeeIds = JSON.parse(localStorage.getItem('local_employees') || '[]');
        
        allEmployees.sort((a, b) => {
          const aIsLocal = localEmployeeIds.includes(a.id);
          const bIsLocal = localEmployeeIds.includes(b.id);
          
          // Lokale Mitarbeiter kommen zuerst
          if (aIsLocal && !bIsLocal) return -1;
          if (!aIsLocal && bIsLocal) return 1;
          
          // Innerhalb der Gruppen nach ID sortieren
          const idA = parseInt(a.id);
          const idB = parseInt(b.id);
          return idA - idB;
        });
      }
      
      setEmployees(allEmployees);
      setAttendance(allAttendance);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      // Fallback zu leeren Arrays bei Fehlern
      setEmployees([]);
      setAttendance([]);
    }
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
    if (!status) return <X className="w-4 h-4 text-red-600" />; // default: Abwesend
    
    switch (status) {
      case 'present':
        return <User className="w-4 h-4 text-green-600" />;
      case 'present_with_dog':
        return <Dog className="w-4 h-4 text-orange-600" />;
      case 'absent':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <X className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: AttendanceStatus | null) => {
    if (!status) return 'bg-red-100 text-red-800 border-red-200'; // default: Abwesend
    
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'present_with_dog':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getStatusText = (status: AttendanceStatus | null) => {
    if (!status) return 'Abwesend';
    
    switch (status) {
      case 'present':
        return 'Anwesend';
      case 'present_with_dog':
        return 'Mit Hund';
      case 'absent':
        return 'Abwesend';
      default:
        return 'Abwesend';
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

  const getActiveCountForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return attendance.filter(entry => 
      entry.date === dateStr && (entry.status === 'present' || entry.status === 'present_with_dog')
    ).length;
  };

  const canModifyEntry = (entry?: AttendanceEntry | null): boolean => {
    const deviceId = getDeviceId();
    if (!entry) return true; // Neue Einträge immer erlaubt
    if (!entry.ownerId) return true; // Alte Einträge ohne Owner
    if (entry.ownerId === deviceId) return true; // Eigenes Gerät
    return false; // Fremdes Gerät - Passwort nötig
  };

  const handleCellClick = async (employeeId: string, date: Date) => {
    const existingEntry = getAttendanceForEmployeeAndDate(employeeId, date);
    
    // Prüfen ob Bearbeitung erlaubt ist
    if (existingEntry && !canModifyEntry(existingEntry)) {
      // Fremder Eintrag - Passwort erforderlich
      if (existingEntry.password) {
        // Passwort ist gesetzt - Abfrage erforderlich
        setPendingAction({ employeeId, date, entry: existingEntry });
        setPasswordModalType('verify');
        setPasswordInput('');
        setShowPasswordModal(true);
        return;
      } else {
        // Kein Passwort gesetzt - nicht bearbeitbar
        alert('Dieser Eintrag wurde von einem anderen Gerät erstellt und hat kein Passwort. Er kann nicht bearbeitet werden.');
        return;
      }
    }
    
    const dogCount = getDogCountForDate(date);
    const activeCount = getActiveCountForDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    console.log('DEBUG - Click:', {
      employeeId,
      date: dateStr,
      existingStatus: existingEntry?.status,
      dogCount,
      allEntriesForDate: attendance.filter(entry => entry.date === dateStr)
    });
    
    try {
      if (existingEntry) {
        // Gewünschte Reihenfolge: absent -> present -> present_with_dog -> absent
        let newStatus: AttendanceStatus;

        if (existingEntry.status === 'absent') {
          newStatus = 'present';
        } else if (existingEntry.status === 'present') {
          // Nächster Schritt wäre "mit Hund", aber nur wenn Hundelimit nicht erreicht
          if (dogCount >= 2) {
            newStatus = 'absent';
          } else {
            newStatus = 'present_with_dog';
          }
        } else if (existingEntry.status === 'present_with_dog') {
          newStatus = 'absent';
        } else {
          newStatus = 'present';
        }
        
        // Warnung ab der 26. aktiven Person (present/present_with_dog) am Tag
        const wasActive = existingEntry.status === 'present' || existingEntry.status === 'present_with_dog';
        const willBeActive = newStatus === 'present' || newStatus === 'present_with_dog';
        const projectedActive = activeCount + (willBeActive && !wasActive ? 1 : 0) - (!willBeActive && wasActive ? 1 : 0);
        if (projectedActive > 25 && willBeActive) {
          alert('Hinweis: Das Büro ist bereits voll (max. 25 Personen). Du kannst dich trotzdem eintragen.');
        }

        const updatedEntry: AttendanceEntry = {
          ...existingEntry,
          status: newStatus,
        };
        
        await storage.addAttendanceEntry(updatedEntry);
      } else {
        // Neuen Eintrag erstellen - Passwort-Abfrage anzeigen
        setPendingAction({ employeeId, date });
        setPasswordModalType('set');
        setPasswordInput('');
        setShowPasswordModal(true);
        return;
      }
      
      // Daten neu laden um sicherzustellen, dass alles synchron ist
      const updatedAttendance = await storage.getAttendance();
      setAttendance(updatedAttendance);
      
      console.log('Status aktualisiert:', {
        employeeId,
        date: dateStr,
        newStatus: existingEntry ? 'updated' : 'created',
        totalAttendanceEntries: updatedAttendance.length,
        entriesForDate: updatedAttendance.filter(entry => entry.date === dateStr).length
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Anwesenheit:', error);
      alert('Fehler beim Speichern der Anwesenheit. Bitte versuchen Sie es erneut.');
    }
  };

  const handlePasswordSubmit = async () => {
    if (!pendingAction) return;

    const { employeeId, date, entry } = pendingAction;
    const dateStr = format(date, 'yyyy-MM-dd');

    if (passwordModalType === 'verify') {
      // Passwort verifizieren
      if (!entry) return;
      
      if (passwordInput !== entry.password) {
        alert('Falsches Passwort!');
        return;
      }
      
      // Passwort korrekt - Eintrag bearbeiten
      setShowPasswordModal(false);
      setPendingAction(null);
      setPasswordInput('');
      
      // Jetzt den eigentlichen Click durchführen
      await performEntryUpdate(employeeId, date, entry);
    } else {
      // Neues Passwort setzen und Eintrag erstellen
      const dogCount = getDogCountForDate(date);
      const activeCount = getActiveCountForDate(date);
      
      // Warnung für neuen aktiven Eintrag ab der 26. Person
      if (activeCount + 1 > 25) {
        alert('Hinweis: Das Büro ist bereits voll (max. 25 Personen). Du kannst dich trotzdem eintragen.');
      }

      const newEntry: AttendanceEntry = {
        id: Date.now().toString(),
        employeeId: employeeId,
        date: dateStr,
        status: 'present',
        ownerId: getDeviceId(),
        password: passwordInput || undefined, // Nur setzen wenn nicht leer
      };
      
      try {
        await storage.addAttendanceEntry(newEntry);
        const updatedAttendance = await storage.getAttendance();
        setAttendance(updatedAttendance);
        
        setShowPasswordModal(false);
        setPendingAction(null);
        setPasswordInput('');
      } catch (error) {
        console.error('Fehler beim Speichern der Anwesenheit:', error);
        alert('Fehler beim Speichern der Anwesenheit. Bitte versuchen Sie es erneut.');
      }
    }
  };

  const performEntryUpdate = async (employeeId: string, date: Date, existingEntry: AttendanceEntry) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dogCount = getDogCountForDate(date);
    const activeCount = getActiveCountForDate(date);

    try {
      // Gewünschte Reihenfolge: absent -> present -> present_with_dog -> absent
      let newStatus: AttendanceStatus;

      if (existingEntry.status === 'absent') {
        newStatus = 'present';
      } else if (existingEntry.status === 'present') {
        // Nächster Schritt wäre "mit Hund", aber nur wenn Hundelimit nicht erreicht
        if (dogCount >= 2) {
          newStatus = 'absent';
        } else {
          newStatus = 'present_with_dog';
        }
      } else if (existingEntry.status === 'present_with_dog') {
        newStatus = 'absent';
      } else {
        newStatus = 'present';
      }
      
      // Warnung ab der 26. aktiven Person (present/present_with_dog) am Tag
      const wasActive = existingEntry.status === 'present' || existingEntry.status === 'present_with_dog';
      const willBeActive = newStatus === 'present' || newStatus === 'present_with_dog';
      const projectedActive = activeCount + (willBeActive && !wasActive ? 1 : 0) - (!willBeActive && wasActive ? 1 : 0);
      if (projectedActive > 25 && willBeActive) {
        alert('Hinweis: Das Büro ist bereits voll (max. 25 Personen). Du kannst dich trotzdem eintragen.');
      }

      const updatedEntry: AttendanceEntry = {
        ...existingEntry,
        status: newStatus,
      };
      
      await storage.addAttendanceEntry(updatedEntry);
      
      // Daten neu laden um sicherzustellen, dass alles synchron ist
      const updatedAttendance = await storage.getAttendance();
      setAttendance(updatedAttendance);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Anwesenheit:', error);
      alert('Fehler beim Speichern der Anwesenheit. Bitte versuchen Sie es erneut.');
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployeeName.trim()) return;

    try {
      const newEmployee = await storage.addEmployee({
        name: newEmployeeName.trim(),
        department: 'Unbekannt', // Standardwert
      });
      
      // Lokal hinzugefügte Mitarbeiter in localStorage speichern
      const localEmployees = JSON.parse(localStorage.getItem('local_employees') || '[]');
      localEmployees.push(newEmployee.id);
      localStorage.setItem('local_employees', JSON.stringify(localEmployees));
      
      setNewEmployeeName('');
      await loadData(); // Daten neu laden, um den neuen Mitarbeiter zu sehen
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Mitarbeiters:', error);
      alert('Fehler beim Hinzufügen des Mitarbeiters. Bitte versuchen Sie es erneut.');
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    const confirmMessage = `Sind Sie sicher, dass Sie "${employee.name}" löschen möchten?\n\nDies löscht auch alle Anwesenheitsdaten dieser Person.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await storage.deleteEmployee(employeeId);
        setEmployees(employees.filter(emp => emp.id !== employeeId));
        
        // Lokalen Mitarbeiter aus localStorage entfernen
        const localEmployees = JSON.parse(localStorage.getItem('local_employees') || '[]');
        const updatedLocalEmployees = localEmployees.filter((id: string) => id !== employeeId);
        localStorage.setItem('local_employees', JSON.stringify(updatedLocalEmployees));
        
        // Anwesenheitsdaten lokal aktualisieren
        const cleanedAttendance = attendance.filter(entry => entry.employeeId !== employeeId);
        setAttendance(cleanedAttendance);
        
        console.log('Mitarbeiter erfolgreich gelöscht:', {
          employeeName: employee.name,
          employeeId,
          removedAttendanceEntries: attendance.length - cleanedAttendance.length
        });
      } catch (error) {
        console.error('Fehler beim Löschen des Mitarbeiters:', error);
        alert('Fehler beim Löschen des Mitarbeiters. Bitte versuchen Sie es erneut.');
      }
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
                  <User className="w-4 h-4 mr-1" />
                  <span className={`${getActiveCountForDate(selectedDate) >= 25 ? 'text-red-600 font-medium' : ''}`}>
                    {getActiveCountForDate(selectedDate)}/25 belegt (für {format(selectedDate, 'dd.MM.yyyy', { locale: de })})
                  </span>
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
                        <span className={`mt-1 text-[11px] ${getActiveCountForDate(date) >= 25 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {getActiveCountForDate(date)}/25
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
                          className="p-1 hover:bg-red-100 rounded-full text-red-600 transition-colors disabled:opacity-40"
                          title="Mitarbeiter löschen"
                          disabled={!
                            // Nur lokale Mitarbeiter (aus eigener Liste) dürfen gelöscht werden
                            JSON.parse(localStorage.getItem('local_employees') || '[]').includes(employee.id)
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    {currentWeek.map((date) => {
                      const entry = getAttendanceForEmployeeAndDate(employee.id, date);
                      const dogCount = getDogCountForDate(date);
                      const displayStatus: AttendanceStatus | null = entry?.status ?? 'absent';
                      const isProtected = entry && entry.password && !canModifyEntry(entry);
                      return (
                        <td 
                          key={date.toISOString()} 
                          className="px-2 py-3 text-center cursor-pointer hover:bg-gray-100 transition-colors relative"
                          onClick={() => handleCellClick(employee.id, date)}
                        >
                          <div className="flex items-center justify-center">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(displayStatus)}`}>
                              {getStatusIcon(displayStatus)}
                              <span className="ml-1">{getStatusText(displayStatus)}</span>
                              {isProtected && (
                                <span title="Passwortgeschützt">
                                  <Lock className="w-3 h-3 ml-1 opacity-50" />
                                </span>
                              )}
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

      {/* Passwort-Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {passwordModalType === 'set' ? 'Passwort festlegen (optional)' : 'Passwort eingeben'}
              </h3>
              
              <div className="space-y-4">
                {passwordModalType === 'set' && (
                  <p className="text-sm text-gray-600">
                    Du kannst optional ein Passwort festlegen, um diesen Eintrag von anderen Geräten aus bearbeiten zu können.
                    Wenn du kein Passwort setzt, kannst du den Eintrag nur von diesem Gerät aus bearbeiten.
                  </p>
                )}
                {passwordModalType === 'verify' && (
                  <p className="text-sm text-gray-600">
                    Dieser Eintrag wurde von einem anderen Gerät erstellt. Bitte gib das Passwort ein, um ihn zu bearbeiten.
                  </p>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passwort {passwordModalType === 'set' && '(optional)'}
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="input-field"
                    placeholder={passwordModalType === 'set' ? 'Leer lassen für kein Passwort' : 'Passwort eingeben'}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handlePasswordSubmit();
                      }
                    }}
                    autoFocus
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPendingAction(null);
                      setPasswordInput('');
                    }}
                    className="btn-secondary"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={handlePasswordSubmit}
                    className="btn-primary"
                  >
                    {passwordModalType === 'set' ? 'Erstellen' : 'Bestätigen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;

