import React, { useState, useEffect, useCallback } from 'react';
import { facultyService } from '../../services/faculty.service';
import { departmentService } from '../../services/academic.service';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  Shield,
  BookOpen,
  Mail,
  Phone,
  Briefcase,
} from 'lucide-react';

export const FacultyManagement = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingFaculty, setViewingFaculty] = useState(null);

  // Form State
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('Male');
  const [dateOfBirth, setDateOfBirth] = useState('1985-01-01');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [designation, setDesignation] = useState('Assistant Professor');
  const [qualification, setQualification] = useState('Ph.D. / M.Tech');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchDependencies = useCallback(async () => {
    try {
      const depts = await departmentService.getAll();
      setDepartments(depts);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  }, []);

  const fetchFaculty = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await facultyService.getAll({
        department_id: selectedDeptFilter ? parseInt(selectedDeptFilter) : undefined,
        search: searchTerm || undefined,
      });
      setFacultyList(data);
    } catch (err) {
      error('Failed to load faculty members.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDeptFilter, searchTerm, error]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedFaculty(null);
    setEmail('');
    setUsername('');
    setPassword('');
    setDepartmentId(departments.length > 0 ? departments[0].id.toString() : '');
    setEmployeeCode(`FAC-EMP-${Math.floor(100 + Math.random() * 900)}`);
    setFirstName('');
    setLastName('');
    setGender('Male');
    setDateOfBirth('1985-01-01');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setDesignation('Assistant Professor');
    setQualification('Ph.D. / M.Tech');
    setPhone('');
    setAddress('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (fac) => {
    setIsEditing(true);
    setSelectedFaculty(fac);
    setDepartmentId(fac.department_id.toString());
    setEmployeeCode(fac.employee_code);
    setFirstName(fac.first_name);
    setLastName(fac.last_name);
    setGender(fac.gender || 'Male');
    setDateOfBirth(fac.date_of_birth || '');
    setJoiningDate(fac.joining_date);
    setDesignation(fac.designation);
    setQualification(fac.qualification || '');
    setPhone(fac.phone || '');
    setAddress(fac.address || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const openDetailModal = async (fac) => {
    try {
      const details = await facultyService.getById(fac.id);
      setViewingFaculty(details);
      setIsDetailModalOpen(true);
    } catch (err) {
      error('Failed to load faculty details.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!departmentId || !employeeCode.trim() || !firstName.trim() || !lastName.trim()) {
      setFormError('Department, Employee Code, and Name are required.');
      return;
    }

    if (!isEditing && (!email.trim() || !username.trim() || !password.trim())) {
      setFormError('Account login credentials are required for new faculty members.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && selectedFaculty) {
        await facultyService.update(selectedFaculty.id, {
          department_id: parseInt(departmentId),
          employee_code: employeeCode.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          gender,
          date_of_birth: dateOfBirth || null,
          joining_date: joiningDate,
          designation: designation.trim(),
          qualification: qualification.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
        });
        success(`Faculty '${firstName} ${lastName}' updated successfully.`);
      } else {
        await facultyService.create({
          email: email.trim().toLowerCase(),
          username: username.trim(),
          password: password.trim(),
          department_id: parseInt(departmentId),
          employee_code: employeeCode.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          gender,
          date_of_birth: dateOfBirth || null,
          joining_date: joiningDate,
          designation: designation.trim(),
          qualification: qualification.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
        });
        success(`Faculty '${firstName} ${lastName}' registered with user login account.`);
      }
      setIsModalOpen(false);
      fetchFaculty();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to save faculty record.';
      setFormError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!facultyToDelete) return;
    setIsDeleting(true);
    try {
      await facultyService.delete(facultyToDelete.id);
      success(`Faculty member '${facultyToDelete.first_name} ${facultyToDelete.last_name}' deleted.`);
      setIsDeleteDialogOpen(false);
      setFacultyToDelete(null);
      fetchFaculty();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Cannot delete faculty with active subject allocations.';
      error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Employee Code',
      key: 'employee_code',
      render: (row) => (
        <Badge variant="primary" size="sm" className="font-mono font-bold">
          {row.employee_code}
        </Badge>
      ),
    },
    {
      header: 'Faculty Name',
      key: 'name',
      render: (row) => (
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
            {row.first_name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-white text-sm">{row.first_name} {row.last_name}</div>
            <div className="text-[11px] text-slate-400">{row.designation}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Department',
      key: 'department',
      render: (row) => (
        <span className="text-slate-300 text-xs font-semibold">
          {row.department?.name || 'Department Ref'}
        </span>
      ),
    },
    {
      header: 'Qualification & Contact',
      key: 'contact',
      render: (row) => (
        <div>
          <div className="text-xs text-white font-medium">{row.qualification || 'Academician'}</div>
          <div className="text-[11px] text-slate-400">{row.user?.email || row.phone}</div>
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDetailModal(row)}
            title="View Faculty Profile"
            className="p-1.5"
          >
            <Eye className="w-4 h-4 text-slate-300 hover:text-brand-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(row)}
            title="Edit Faculty Record"
            className="p-1.5"
          >
            <Edit2 className="w-4 h-4 text-slate-300 hover:text-brand-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFacultyToDelete(row);
              setIsDeleteDialogOpen(true);
            }}
            title="Delete Faculty"
            className="p-1.5"
          >
            <Trash2 className="w-4 h-4 text-rose-400 hover:text-rose-300" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <GraduationCap className="w-6 h-6 text-brand-400" />
            <span>Faculty & Academic Staff Directory</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage professorships, teaching appointments, designations, and instructor user accounts.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" icon={BookOpen} onClick={() => window.location.href = '/admin/allocations'}>
            Subject Allocations
          </Button>
          <Button variant="primary" icon={Plus} onClick={openCreateModal}>
            Add Faculty Member
          </Button>
        </div>
      </div>

      {/* Control Bar */}
      <Card bodyClassName="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
            <div className="relative w-full sm:w-72">
              <Input
                placeholder="Search name, code, designation..."
                icon={Search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-60">
              <Select
                options={[
                  { value: '', label: 'All Departments' },
                  ...departments.map((d) => ({ value: d.id.toString(), label: d.name })),
                ]}
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
              />
            </div>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchFaculty}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Data Table */}
      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={facultyList}
          isLoading={isLoading}
          emptyMessage="No faculty records found."
        />
      </Card>

      {/* Add / Edit Faculty Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Faculty Record' : 'Register New Faculty Member'}
        subtitle={isEditing ? `Modifying: ${selectedFaculty?.first_name} ${selectedFaculty?.last_name}` : 'Create faculty profile and login credentials'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          {/* User Account Credentials (Only on Create) */}
          {!isEditing && (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Account Credentials</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Institutional Email"
                  type="email"
                  placeholder="faculty@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Username"
                  placeholder="e.g. profsmith"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Personal Info */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Personal Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Gender"
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              />
              <Input
                label="Date of Birth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
              <Input
                label="Contact Phone"
                placeholder="+1 555-019-8877"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Department & Employment Details */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Employment & Designation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Department"
                options={departments.map((d) => ({ value: d.id.toString(), label: `${d.code} - ${d.name}` }))}
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
              />
              <Input
                label="Employee Code"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Designation"
                options={[
                  { value: 'Professor', label: 'Professor' },
                  { value: 'Associate Professor', label: 'Associate Professor' },
                  { value: 'Assistant Professor', label: 'Assistant Professor' },
                  { value: 'Lecturer', label: 'Lecturer' },
                  { value: 'Lab Instructor', label: 'Lab Instructor' },
                  { value: 'Visiting Faculty', label: 'Visiting Faculty' },
                ]}
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                required
              />
              <Input
                label="Highest Qualification"
                placeholder="e.g. Ph.D. Computer Science"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
              />
              <Input
                label="Joining Date"
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Update Faculty Record' : 'Register Faculty'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Faculty Member Profile"
      >
        {viewingFaculty && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                {viewingFaculty.first_name.charAt(0)}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {viewingFaculty.first_name} {viewingFaculty.last_name}
                </h3>
                <div className="text-indigo-400 font-mono font-semibold">
                  Employee Code: {viewingFaculty.employee_code}
                </div>
                <div className="text-slate-300">{viewingFaculty.designation} • {viewingFaculty.department?.name}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="text-slate-400">Department:</span>
                <p className="font-semibold text-white mt-0.5">{viewingFaculty.department?.name}</p>
              </div>
              <div>
                <span className="text-slate-400">Qualification:</span>
                <p className="font-semibold text-white mt-0.5">{viewingFaculty.qualification || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400">Official Email:</span>
                <p className="font-semibold text-white mt-0.5">{viewingFaculty.user?.email}</p>
              </div>
              <div>
                <span className="text-slate-400">Contact Phone:</span>
                <p className="font-semibold text-white mt-0.5">{viewingFaculty.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400">Date of Joining:</span>
                <p className="font-semibold text-white mt-0.5">{viewingFaculty.joining_date}</p>
              </div>
              <div>
                <span className="text-slate-400">Allocated Teaching Load:</span>
                <p className="font-semibold text-brand-400 mt-0.5">{viewingFaculty.allocations?.length || 0} Subjects Assigned</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Faculty Record"
        message={`Are you sure you want to delete '${facultyToDelete?.first_name} ${facultyToDelete?.last_name}' (${facultyToDelete?.employee_code})?`}
        confirmText="Delete Faculty"
        isLoading={isDeleting}
      />
    </div>
  );
};
