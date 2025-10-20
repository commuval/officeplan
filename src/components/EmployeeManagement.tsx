import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Building } from 'lucide-react';
import { Employee, Department } from '../types';
import { storage } from '../utils/storage';
import { getDeviceId } from '../utils/identity';

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [employeesData, departmentsData] = await Promise.all([
        storage.getEmployees(),
        storage.getDepartments()
      ]);
      setEmployees(employeesData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      // Fallback zu leeren Arrays bei Fehlern
      setEmployees([]);
      setDepartments([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingEmployee) {
        // Mitarbeiter bearbeiten
        const updatedEmployee = await storage.updateEmployee(editingEmployee.id, formData);
        setEmployees(employees.map(emp => 
          emp.id === editingEmployee.id ? updatedEmployee : emp
        ));
        setEditingEmployee(null);
      } else {
        // Neuen Mitarbeiter hinzufügen
        const newEmployee = await storage.addEmployee(formData);
        setEmployees([...employees, newEmployee]);
      }

      setFormData({ name: '', department: '' });
      setShowAddModal(false);
    } catch (error) {
      console.error('Fehler beim Speichern des Mitarbeiters:', error);
      alert('Fehler beim Speichern des Mitarbeiters. Bitte versuchen Sie es erneut.');
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      department: employee.department,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (employeeId: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen Mitarbeiter löschen möchten?')) {
      try {
        await storage.deleteEmployee(employeeId);
        setEmployees(employees.filter(emp => emp.id !== employeeId));
        console.log('Mitarbeiter erfolgreich gelöscht:', employeeId);
      } catch (error) {
        console.error('Fehler beim Löschen des Mitarbeiters:', error);
        alert('Fehler beim Löschen des Mitarbeiters. Bitte versuchen Sie es erneut.');
      }
    }
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setEditingEmployee(null);
    setFormData({ name: '', department: '' });
  };

  const getDepartmentColor = (departmentName: string) => {
    const department = departments.find(d => d.name === departmentName);
    return department?.color || '#6b7280';
  };

  const isOwner = (employee: Employee) => {
    const deviceId = getDeviceId();
    return !employee.ownerId || employee.ownerId === deviceId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mitarbeiterverwaltung</h2>
          <p className="text-gray-600">Verwalten Sie Ihre Mitarbeiter und deren Abteilungen</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Mitarbeiter hinzufügen
          </button>
          
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Gesamt Mitarbeiter</p>
              <p className="text-2xl font-semibold text-gray-900">{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building className="w-8 h-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Abteilungen</p>
              <p className="text-2xl font-semibold text-gray-900">{departments.length}</p>
            </div>
          </div>
        </div>


      </div>

      {/* Mitarbeiterliste */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mitarbeiter
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Abteilung
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-700">
                            {employee.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.name}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${getDepartmentColor(employee.department)}20`,
                        color: getDepartmentColor(employee.department),
                      }}
                    >
                      {employee.department}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="text-primary-600 hover:text-primary-900 p-1 rounded disabled:opacity-40"
                        disabled={!isOwner(employee)}
                        title={isOwner(employee) ? 'Bearbeiten' : 'Nur vom Ersteller bearbeitbar'}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-40"
                        disabled={!isOwner(employee)}
                        title={isOwner(employee) ? 'Löschen' : 'Nur vom Ersteller löschbar'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal für Mitarbeiter hinzufügen/bearbeiten */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingEmployee ? 'Mitarbeiter bearbeiten' : 'Neuen Mitarbeiter hinzufügen'}
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
                    Abteilung
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Abteilung auswählen</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.name}>
                        {department.name}
                      </option>
                    ))}
                  </select>
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
                    {editingEmployee ? 'Aktualisieren' : 'Hinzufügen'}
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

export default EmployeeManagement;

