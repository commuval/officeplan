import React from 'react';
import { Calendar } from 'lucide-react';

interface HeaderProps {
  currentView: 'calendar';
  onViewChange: (view: 'calendar') => void;
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
                <div className="w-16 h-16 flex items-center justify-center">
                  <img 
                    src="/Logo HR factory.png" 
                    alt="HR Factory Logo" 
                    className="w-16 h-16 object-contain"
                  />
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
          </nav>

        </div>
      </div>
    </header>
  );
};

export default Header;

