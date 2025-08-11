import React, { useState } from 'react';
import { startOfWeek } from 'date-fns';
import Header from './components/Header';
import AttendanceCalendar from './components/AttendanceCalendar';
import EmployeeManagement from './components/EmployeeManagement';
import Settings from './components/Settings';
import './index.css';

type ViewType = 'calendar' | 'employees' | 'settings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const renderCurrentView = () => {
    switch (currentView) {
      case 'calendar':
        return (
          <AttendanceCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        );
      case 'employees':
        return <EmployeeManagement />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <AttendanceCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        );
    }
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

