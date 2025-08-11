import React from 'react';
import { Calendar, Users, Settings } from 'lucide-react';

interface HeaderProps {
  currentView: 'calendar' | 'employees' | 'settings';
  onViewChange: (view: 'calendar' | 'employees' | 'settings') => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo und Titel */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h1 className="ml-3 text-xl font-semibold text-gray-900">
                  Büroplan
                </h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex space-x-8">
            <button
              onClick={() => onViewChange('calendar')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === 'calendar'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Kalender
            </button>
            
            <button
              onClick={() => onViewChange('employees')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === 'employees'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Mitarbeiter
            </button>
            
            <button
              onClick={() => onViewChange('settings')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === 'settings'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Einstellungen
            </button>
          </nav>

          {/* Benutzerinfo */}
          <div className="flex items-center">
            <div className="text-sm text-gray-500">
              <span className="font-medium">Anwesenheitsverwaltung</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
