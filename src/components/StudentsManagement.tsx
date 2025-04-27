import React, { useState, useMemo } from 'react';
import { Download, Upload, Plus, Loader2, Search, Trash2, Edit, X, UserPlus, Phone, Mail, MapPin } from 'lucide-react';
import { useStudents } from '../hooks/useSupabase';
import { Student } from '../types/database';
import toast from 'react-hot-toast';

function StudentsManagement() {
  const { students, loading, addStudent, updateStudent } = useStudents();
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'reg_number' | 'name' | 'department' | 'section'>('name');
  const [filterYear, setFilterYear] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'graduated'>('all');
  
  const [newStudent, setNewStudent] = useState({
    reg_number: '',
    name: '',
    department: '',
    section: '',
    year: 1,
    semester: 1,
    contact_number: '',
    contact_info: '',
    email: '',
    status: 'active' as const
  });

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = searchQuery
        ? student[searchBy].toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      
      const matchesYear = filterYear
        ? student.year === filterYear
        : true;
      
      const matchesStatus = filterStatus === 'all'
        ? true
        : student.status === filterStatus;

      return matchesSearch && matchesYear && matchesStatus;
    });
  }, [students, searchQuery, searchBy, filterYear, filterStatus]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const existingStudent = students.find(student => student.reg_number === newStudent.reg_number);
    if (existingStudent) {
      toast.error('A student with this registration number already exists');
      return;
    }

    await addStudent(newStudent);
    setNewStudent({
      reg_number: '',
      name: '',
      department: '',
      section: '',
      year: 1,
      semester: 1,
      contact_number: '',
      contact_info: '',
      email: '',
      status: 'active'
    });
    setIsAddingStudent(false);
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingStudent) return;
    
    const existingStudent = students.find(
      student => student.reg_number === isEditingStudent.reg_number && student.id !== isEditingStudent.id
    );
    if (existingStudent) {
      toast.error('A student with this registration number already exists');
      return;
    }

    await updateStudent(isEditingStudent.id, isEditingStudent);
    setIsEditingStudent(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rows = text.split('\n').slice(1);
      const results = {
        success: 0,
        duplicates: 0,
        errors: 0
      };
      
      for (const row of rows) {
        const [reg_number, name, department, section, year, semester, contact_number, contact_info] = 
          row.split(',').map(field => field.trim());
        
        if (reg_number && name && department) {
          const existingStudent = students.find(student => student.reg_number === reg_number);
          if (existingStudent) {
            results.duplicates++;
            continue;
          }

          try {
            // Extract email from contact_info if available
            const emailMatch = contact_info?.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
            const email = emailMatch ? emailMatch[0] : '';
            
            // Remove the email from contact_info to avoid duplication
            const cleanedContactInfo = contact_info?.replace(emailMatch?.[0] ?? '', '').trim();

            await addStudent({
              reg_number,
              name,
              department,
              section: section || 'A',
              year: parseInt(year) || 1,
              semester: parseInt(semester) || 1,
              contact_number: contact_number || '',
              contact_info: cleanedContactInfo || '',
              email: email,
              status: 'active'
            });
            results.success++;
          } catch (error) {
            results.errors++;
          }
        }
      }
      
      toast.success(`Import complete: ${results.success} students added, ${results.duplicates} duplicates skipped, ${results.errors} errors`);
    } catch (error) {
      toast.error('Error importing students');
      console.error('Error:', error);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Registration Number', 'Name', 'Department', 'Section', 'Year', 'Semester', 'Contact Number', 'Contact Info',  'Status'];
    const csvContent = [
      headers.join(','),
      ...students.map(student => [
        student.reg_number,
        student.name,
        student.department,
        student.section,
        student.year,
        student.semester,
        student.contact_number,
        student.contact_info,
        student.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Students Management</h2>
        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setIsAddingStudent(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Student
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value as typeof searchBy)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="name">Search by Name</option>
              <option value="reg_number">Search by Reg. Number</option>
              <option value="department">Search by Department</option>
              <option value="section">Search by Section</option>
            </select>
          </div>
          <div>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value ? parseInt(e.target.value) : '')}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">All Years</option>
              {[1, 2, 3, 4].map(year => (
                <option key={year} value={year}>Year {year}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
            </select>
          </div>
        </div>
      </div>

      {isAddingStudent && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New Student</h3>
            <button
              onClick={() => setIsAddingStudent(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg_number" className="block text-sm font-medium text-gray-700">
                Registration Number
              </label>
              <input
                type="text"
                id="reg_number"
                value={newStudent.reg_number}
                onChange={(e) => setNewStudent({ ...newStudent, reg_number: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <input
                type="text"
                id="department"
                value={newStudent.department}
                onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="section" className="block text-sm font-medium text-gray-700">
                Section
              </label>
              <input
                type="text"
                id="section"
                value={newStudent.section}
                onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                Year
              </label>
              <select
                id="year"
                value={newStudent.year}
                onChange={(e) => setNewStudent({ ...newStudent, year: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {[1, 2, 3, 4].map(year => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                Semester
              </label>
              <select
                id="semester"
                value={newStudent.semester}
                onChange={(e) => setNewStudent({ ...newStudent, semester: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {[1, 2].map(semester => (
                  <option key={semester} value={semester}>Semester {semester}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700">
                Contact Number
              </label>
              <input
                type="tel"
                id="contact_number"
                value={newStudent.contact_number}
                onChange={(e) => setNewStudent({ ...newStudent, contact_number: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="contact_info" className="block text-sm font-medium text-gray-700">
                Additional Contact Info
              </label>
              <input
                type="text"
                id="contact_info"
                value={newStudent.contact_info}
                onChange={(e) => setNewStudent({ ...newStudent, contact_info: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Additional contact information"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={() => setIsAddingStudent(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Student
              </button>
            </div>
          </form>
        </div>
      )}

      {isEditingStudent && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Edit Student</h3>
            <button
              onClick={() => setIsEditingStudent(null)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleEditStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-reg_number" className="block text-sm font-medium text-gray-700">
                Registration Number
              </label>
              <input
                type="text"
                id="edit-reg_number"
                value={isEditingStudent.reg_number}
                onChange={(e) => setIsEditingStudent({ ...isEditingStudent, reg_number: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="edit-name"
                value={isEditingStudent.name}
                onChange={(e) => setIsEditingStudent({ ...isEditingStudent, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-department" className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <input
                type="text"
                id="edit-department"
                value={isEditingStudent.department}
                onChange={(e) => setIsEditingStudent({ ...isEditingStudent, department: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-section" className="block text-sm font-medium text-gray-700">
                Section
              </label>
              <input
                type="text"
                id="edit-section"
                value={isEditingStudent.section}
                onChange={(e) => setIsEditingStudent({ ...isEditingStudent, section: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-year" className="block text-sm font-medium text-gray-700">
                Year
              </label>
              <select
                id="edit-year"
                value={isEditingStudent.year}
                onChange={(e) => setIsEditingStudent({ ...isEditingStudent, year: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {[1, 2, 3, 4].map(year => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-semester" className="block text-sm font-medium text-gray-700">
                Semester
              </label>
              <select
                id="edit-semester"
                value={isEditingStudent.semester}
                onChange={(e) => setIsEditingStudent({ ...isEditingStudent, semester: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {[1, 2].map(semester => (
                  <option key={semester} value={semester}>Semester {semester}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-contact_number" className="block text-sm font-medium text-gray-700">
                Contact Number
              </label>
              <input
                type="tel"
                id="edit-contact_number"
                value={isEditingStudent.contact_number}
                onChange={(e) => setIsEditingStudent({ ...isEditingStudent, contact_number: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="edit-email"
                value={isEditingStudent.email}
                onChange={(e) => setIsEditingStudent({ ...isEditingStudent, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="edit-status"
                value={isEditingStudent.status}
                onChange={(e) => setIsEditingStudent({ ...isEditingStudent, status: e.target.value as Student['status'] })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={() => setIsEditingStudent(null)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reg. Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Information
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section/Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.reg_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.department}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {student.contact_number}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {student.email}
                      </div>
                      {student.contact_info && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {student.contact_info}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Section {student.section}, Year {student.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      student.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : student.status === 'inactive'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => setIsEditingStudent(student)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StudentsManagement;