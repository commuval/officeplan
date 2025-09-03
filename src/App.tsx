import React, { useState, useEffect } from 'react';
import { startOfWeek } from 'date-fns';
import Header from './components/Header';
import AttendanceCalendar from './components/AttendanceCalendar';
import './index.css';
import { DATA_VERSION } from './config';

type ViewType = 'calendar';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Automatisches Daten-Reset nur bei neuem Deployment (Versionswechsel)
  useEffect(() => {
    const storedVersion = localStorage.getItem('office_plan_data_version');
    console.log('Versions-Check:', { storedVersion, currentVersion: DATA_VERSION });
    
    if (storedVersion !== DATA_VERSION) {
      console.log('Versionswechsel erkannt - Daten werden zurückgesetzt');
      localStorage.removeItem('office_plan_employees');
      localStorage.removeItem('office_plan_attendance');
      localStorage.removeItem('office_plan_departments');
      localStorage.setItem('office_plan_data_version', DATA_VERSION);
      
      // Seite neu laden um sicherzustellen, dass alle Komponenten mit den neuen Daten arbeiten
      window.location.reload();
    }
  }, []);

  const renderCurrentView = () => {
    return (
      <AttendanceCalendar
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default App;

