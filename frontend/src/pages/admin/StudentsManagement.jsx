import React, { useState, useEffect, useCallback } from 'react';
import { studentService } from '../../services/student.service';
import {
  departmentService,
  courseService,
  sessionService,
  semesterService,
  sectionService,
} from '../../services/academic.service';
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
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  GraduationCap,
  Mail,
  Phone,
  UserCheck,
  Shield,
} from 'lucide-react';

export const StudentsManagement = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hierarchy Options
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [sections, setSections] = useState([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('Male');
  const [dateOfBirth, setDateOfBirth] = useState('2004-01-01');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [phone, setPhone] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [address, setAddress] = useState('');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('ACTIVE');

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchDependencies = useCallback(async () => {
    try {
      const [deptList, crsList, sessList, semList, secList] = await Promise.all([
        departmentService.getAll(),
        courseService.getAll(),
        sessionService.getAll(),
        semesterService.getAll(),
        sectionService.getAll(),
      ]);
      setDepartments(deptList);
      setCourses(crsList);
      setSessions(sessList);
      setSemesters(semList);
      setSections(secList);
    } catch (err) {
      console.error('Failed to load academic dependencies:', err);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await studentService.getAll({
        department_id: selectedDeptFilter ? parseInt(selectedDeptFilter) : undefined,
        course_id: selectedCourseFilter ? parseInt(selectedCourseFilter) : undefined,
        status: selectedStatusFilter || undefined,
        search: searchTerm || undefined,
      });
      setStudents(data);
    } catch (err) {
      error('Failed to load students.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDeptFilter, selectedCourseFilter, selectedStatusFilter, searchTerm, error]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedStudent(null);
    setEmail('');
    setUsername('');
    setPassword('');
    setDepartmentId(departments.length > 0 ? departments[0].id.toString() : '');
    setCourseId(courses.length > 0 ? courses[0].id.toString() : '');
    setSessionId(sessions.length > 0 ? sessions[0].id.toString() : '');
    setSemesterId(semesters.length > 0 ? semesters[0].id.toString() : '');
    setSectionId(sections.length > 0 ? sections[0].id.toString() : '');
    setEnrollmentNumber(`ENR${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`);
    setRollNumber(`${Math.floor(10 + Math.random() * 90)}CS01`);
    setFirstName('');
    setLastName('');
    setGender('Male');
    setDateOfBirth('2004-01-01');
    setBloodGroup('O+');
    setPhone('');
    setGuardianName('');
    setGuardianPhone('');
    setAddress('');
    setAdmissionDate(new Date().toISOString().split('T')[0]);
    setStatus('ACTIVE');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (stu) => {
    setIsEditing(true);
    setSelectedStudent(stu);
    setDepartmentId(stu.department_id.toString());
    setCourseId(stu.course_id.toString());
    setSessionId(stu.admission_session_id.toString());
    setSemesterId(stu.current_semester_id ? stu.current_semester_id.toString() : '');
    setSectionId(stu.current_section_id ? stu.current_section_id.toString() : '');
    setEnrollmentNumber(stu.enrollment_number);
    setRollNumber(stu.roll_number);
    setFirstName(stu.first_name);
    setLastName(stu.last_name);
    setGender(stu.gender || 'Male');
    setDateOfBirth(stu.date_of_birth || '');
    setBloodGroup(stu.blood_group || 'O+');
    setPhone(stu.phone || '');
    setGuardianName(stu.guardian_name || '');
    setGuardianPhone(stu.guardian_phone || '');
    setAddress(stu.address || '');
    setStatus(stu.status || 'ACTIVE');
    setFormError('');
    setIsModalOpen(true);
  };

  const openDetailModal = async (stu) => {
    try {
      const full = await studentService.getById(stu.id);
      setViewingStudent(full);
      setIsDetailModalOpen(true);
    } catch (err) {
      error('Failed to load student details.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!departmentId || !courseId || !sessionId || !firstName.trim() || !lastName.trim()) {
      setFormError('Department, Course, Session, and Student Name are required.');
      return;
    }

    if (!isEditing && (!email.trim() || !username.trim() || !password.trim())) {
      setFormError('Login credentials (Email, Username, Password) are required for new student accounts.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && selectedStudent) {
        await studentService.update(selectedStudent.id, {
          department_id: parseInt(departmentId),
          course_id: parseInt(courseId),
          admission_session_id: parseInt(sessionId),
          current_semester_id: semesterId ? parseInt(semesterId) : null,
          current_section_id: sectionId ? parseInt(sectionId) : null,
          enrollment_number: enrollmentNumber.trim(),
          roll_number: rollNumber.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          gender,
          date_of_birth: dateOfBirth || null,
          blood_group: bloodGroup,
          phone: phone.trim() || null,
          guardian_name: guardianName.trim() || null,
          guardian_phone: guardianPhone.trim() || null,
          address: address.trim() || null,
          status,
        });
        success(`Student '${firstName} ${lastName}' updated successfully.`);
      } else {
        await studentService.create({
          email: email.trim().toLowerCase(),
          username: username.trim(),
          password: password.trim(),
          department_id: parseInt(departmentId),
          course_id: parseInt(courseId),
          admission_session_id: parseInt(sessionId),
          current_semester_id: semesterId ? parseInt(semesterId) : null,
          current_section_id: sectionId ? parseInt(sectionId) : null,
          enrollment_number: enrollmentNumber.trim(),
          roll_number: rollNumber.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          gender,
          date_of_birth: dateOfBirth || null,
          blood_group: bloodGroup,
          phone: phone.trim() || null,
          guardian_name: guardianName.trim() || null,
          guardian_phone: guardianPhone.trim() || null,
          address: address.trim() || null,
          admission_date: admissionDate,
          status,
        });
        success(`Student '${firstName} ${lastName}' registered and account activated.`);
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to save student record.';
      setFormError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await studentService.delete(studentToDelete.id);
      success(`Student '${studentToDelete.first_name} ${studentToDelete.last_name}' removed.`);
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
      fetchStudents();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to delete student.';
      error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'ACTIVE':
        return <Badge variant="success" size="sm" dot>Active</Badge>;
      case 'SUSPENDED':
        return <Badge variant="danger" size="sm">Suspended</Badge>;
      case 'DROPPED':
        return <Badge variant="default" size="sm">Dropped</Badge>;
      default:
        return <Badge variant="purple" size="sm">Passed Out</Badge>;
    }
  };

  const columns = [
    {
      header: 'Student ID & Roll #',
      key: 'enrollment_number',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-brand-400 text-xs">{row.enrollment_number}</span>
          <div className="text-[11px] text-slate-400 font-mono">Roll: {row.roll_number}</div>
        </div>
      ),
    },
    {
      header: 'Full Name',
      key: 'name',
      render: (row) => (
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-xs">
            {row.first_name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-white text-sm">{row.first_name} {row.last_name}</div>
            <div className="text-[11px] text-slate-400">{row.user?.email || row.phone}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Academic Program',
      key: 'course',
      render: (row) => (
        <div>
          <span className="text-slate-200 text-xs font-semibold">{row.course?.code}</span>
          <div className="text-[11px] text-slate-400">{row.department?.name}</div>
        </div>
      ),
    },
    {
      header: 'Semester & Section',
      key: 'semester',
      render: (row) => (
        <div className="text-xs">
          <span className="text-slate-300 font-medium">Sem {row.current_semester?.semester_number || 'N/A'}</span>
          {row.current_section && (
            <Badge variant="primary" size="sm" className="ml-2 font-mono">
              Sec {row.current_section.name}
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => getStatusBadge(row.status),
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
            title="View Student Profile"
            className="p-1.5"
          >
            <Eye className="w-4 h-4 text-slate-300 hover:text-brand-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(row)}
            title="Edit Student"
            className="p-1.5"
          >
            <Edit2 className="w-4 h-4 text-slate-300 hover:text-brand-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStudentToDelete(row);
              setIsDeleteDialogOpen(true);
            }}
            title="Delete Student"
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
            <Users className="w-6 h-6 text-brand-400" />
            <span>Student Admissions & Records</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Register student admissions, configure academic enrollments, and manage user accounts.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={openCreateModal}>
          Admit Student
        </Button>
      </div>

      {/* Control Bar */}
      <Card bodyClassName="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
            <div className="relative w-full sm:w-60">
              <Input
                placeholder="Search name, roll or ID..."
                icon={Search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: '', label: 'All Departments' },
                  ...departments.map((d) => ({ value: d.id.toString(), label: d.code })),
                ]}
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: '', label: 'All Courses' },
                  ...courses.map((c) => ({ value: c.id.toString(), label: c.code })),
                ]}
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-36">
              <Select
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'SUSPENDED', label: 'Suspended' },
                  { value: 'DROPPED', label: 'Dropped' },
                ]}
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
              />
            </div>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchStudents}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Data Table */}
      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={students}
          isLoading={isLoading}
          emptyMessage="No student records found matching the filters."
        />
      </Card>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Student Record' : 'Admit New Student'}
        subtitle={isEditing ? `Modifying profile: ${selectedStudent?.first_name} ${selectedStudent?.last_name}` : 'Create student profile and login account'}
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
                  placeholder="student@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Login Username"
                  placeholder="e.g. john2025"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <Input
                  label="Account Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Personal Information */}
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
              <Select
                label="Blood Group"
                options={[
                  { value: 'A+', label: 'A+' },
                  { value: 'A-', label: 'A-' },
                  { value: 'B+', label: 'B+' },
                  { value: 'B-', label: 'B-' },
                  { value: 'AB+', label: 'AB+' },
                  { value: 'AB-', label: 'AB-' },
                  { value: 'O+', label: 'O+' },
                  { value: 'O-', label: 'O-' },
                ]}
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Contact Phone"
                placeholder="+1 555-019-2834"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="Guardian / Parent Name"
                placeholder="Full Name"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
              />
            </div>
          </div>

          {/* Academic Allocation */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Academic Assignment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Enrollment / Student ID"
                value={enrollmentNumber}
                onChange={(e) => setEnrollmentNumber(e.target.value)}
                required
              />
              <Input
                label="Roll Number"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Department"
                options={departments.map((d) => ({ value: d.id.toString(), label: d.name }))}
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
              />
              <Select
                label="Degree Course"
                options={courses.map((c) => ({ value: c.id.toString(), label: c.name }))}
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
              />
              <Select
                label="Admission Session"
                options={sessions.map((s) => ({ value: s.id.toString(), label: s.name }))}
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Current Semester"
                options={[
                  { value: '', label: 'None' },
                  ...semesters.map((s) => ({ value: s.id.toString(), label: `${s.name} (${s.course?.code})` })),
                ]}
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value)}
              />
              <Select
                label="Assigned Section"
                options={[
                  { value: '', label: 'None' },
                  ...sections.map((sec) => ({ value: sec.id.toString(), label: `Section ${sec.name} (${sec.semester?.name})` })),
                ]}
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
              />
              <Select
                label="Student Status"
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'SUSPENDED', label: 'Suspended' },
                  { value: 'DROPPED', label: 'Dropped' },
                  { value: 'PASSED_OUT', label: 'Passed Out' },
                ]}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Update Student Record' : 'Complete Admission'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Student Profile Overview"
      >
        {viewingStudent && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-xl font-bold">
                {viewingStudent.first_name.charAt(0)}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {viewingStudent.first_name} {viewingStudent.last_name}
                </h3>
                <div className="text-brand-400 font-mono font-semibold">
                  ID: {viewingStudent.enrollment_number} • Roll: {viewingStudent.roll_number}
                </div>
                <div>{getStatusBadge(viewingStudent.status)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="text-slate-400">Department:</span>
                <p className="font-semibold text-white mt-0.5">{viewingStudent.department?.name}</p>
              </div>
              <div>
                <span className="text-slate-400">Program Course:</span>
                <p className="font-semibold text-white mt-0.5">{viewingStudent.course?.name}</p>
              </div>
              <div>
                <span className="text-slate-400">Current Semester:</span>
                <p className="font-semibold text-white mt-0.5">{viewingStudent.current_semester?.name || 'Unassigned'}</p>
              </div>
              <div>
                <span className="text-slate-400">Section:</span>
                <p className="font-semibold text-white mt-0.5">{viewingStudent.current_section?.name || 'Unassigned'}</p>
              </div>
              <div>
                <span className="text-slate-400">Official Email:</span>
                <p className="font-semibold text-white mt-0.5">{viewingStudent.user?.email}</p>
              </div>
              <div>
                <span className="text-slate-400">Contact Phone:</span>
                <p className="font-semibold text-white mt-0.5">{viewingStudent.phone || 'N/A'}</p>
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
        title="Delete Student Record"
        message={`Are you sure you want to delete '${studentToDelete?.first_name} ${studentToDelete?.last_name}' (${studentToDelete?.enrollment_number})? Associated user login account will also be deleted.`}
        confirmText="Delete Student"
        isLoading={isDeleting}
      />
    </div>
  );
};
