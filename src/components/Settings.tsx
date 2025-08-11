import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Palette, Building } from 'lucide-react';
import { Department } from '../types';
import { storage } from '../utils/storage';

const Settings: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDepartments(storage.getDepartments());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingDepartment) {
      // Abteilung bearbeiten
      const updatedDepartments = departments.map(dept =>
        dept.id === editingDepartment.id
          ? { ...dept, ...formData }
          : dept
      );
      storage.setDepartments(updatedDepartments);
      setDepartments(updatedDepartments);
      setEditingDepartment(null);
    } else {
      // Neue Abteilung hinzufügen
      const newDepartment: Department = {
        id: Date.now().toString(),
        ...formData,
      };
      const updatedDepartments = [...departments, newDepartment];
      storage.setDepartments(updatedDepartments);
      setDepartments(updatedDepartments);
    }

    setFormData({ name: '', color: '#3b82f6' });
    setShowAddModal(false);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      color: department.color,
    });
    setShowAddModal(true);
  };

  const handleDelete = (departmentId: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Abteilung löschen möchten?')) {
      const updatedDepartments = departments.filter(dept => dept.id !== departmentId);
      storage.setDepartments(updatedDepartments);
      setDepartments(updatedDepartments);
    }
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setEditingDepartment(null);
    setFormData({ name: '', color: '#3b82f6' });
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Einstellungen</h2>
          <p className="text-gray-600">Verwalten Sie Abteilungen und Systemeinstellungen</p>
        </div>
      </div>

      {/* Abteilungsverwaltung */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Abteilungsverwaltung</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Abteilung hinzufügen
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((department) => (
            <div
              key={department.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: department.color }}
                  />
                  <span className="font-medium text-gray-900">{department.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(department)}
                    className="text-primary-600 hover:text-primary-900 p-1 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(department.id)}
                    className="text-red-600 hover:text-red-900 p-1 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* Systeminformationen */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Systeminformationen</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              Anwendung
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Version:</span>
                <span className="text-sm font-medium text-gray-900">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Entwickelt von:</span>
                <span className="text-sm font-medium text-gray-900">Büroplan Team</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Lizenz:</span>
                <span className="text-sm font-medium text-gray-900">MIT</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              Technologie
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Framework:</span>
                <span className="text-sm font-medium text-gray-900">React 18</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Styling:</span>
                <span className="text-sm font-medium text-gray-900">Tailwind CSS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sprache:</span>
                <span className="text-sm font-medium text-gray-900">TypeScript</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal für Abteilung hinzufügen/bearbeiten */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingDepartment ? 'Abteilung bearbeiten' : 'Neue Abteilung hinzufügen'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Farbe
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="input-field flex-1"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-secondary"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingDepartment ? 'Aktualisieren' : 'Hinzufügen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

