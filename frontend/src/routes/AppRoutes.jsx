import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from '../pages/auth/Login';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { DepartmentsManagement } from '../pages/admin/DepartmentsManagement';
import { CoursesManagement } from '../pages/admin/CoursesManagement';
import { SessionsManagement } from '../pages/admin/SessionsManagement';
import { SemestersSectionsManagement } from '../pages/admin/SemestersSectionsManagement';
import { SubjectsManagement } from '../pages/admin/SubjectsManagement';
import { StudentsManagement } from '../pages/admin/StudentsManagement';
import { FacultyManagement } from '../pages/admin/FacultyManagement';
import { SubjectAllocationsManagement } from '../pages/admin/SubjectAllocationsManagement';
import { AdminAttendanceOverview } from '../pages/admin/AdminAttendanceOverview';
import { AdminTimetableManagement } from '../pages/admin/AdminTimetableManagement';
import { AdminExamsManagement } from '../pages/admin/AdminExamsManagement';
import { AdminAssignmentsOverview } from '../pages/admin/AdminAssignmentsOverview';
import { AdminNoticesManagement } from '../pages/admin/AdminNoticesManagement';
import { FacultyDashboard } from '../pages/faculty/FacultyDashboard';
import { FacultyMarkAttendance } from '../pages/faculty/FacultyMarkAttendance';
import { FacultyTimetable } from '../pages/faculty/FacultyTimetable';
import { FacultyMarksEntry } from '../pages/faculty/FacultyMarksEntry';
import { FacultyAssignmentsManagement } from '../pages/faculty/FacultyAssignmentsManagement';
import { FacultyNoticeBoard } from '../pages/faculty/FacultyNoticeBoard';
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { StudentProfile } from '../pages/student/StudentProfile';
import { StudentAttendance } from '../pages/student/StudentAttendance';
import { StudentTimetable } from '../pages/student/StudentTimetable';
import { StudentResults } from '../pages/student/StudentResults';
import { StudentAssignments } from '../pages/student/StudentAssignments';
import { StudentNoticeBoard } from '../pages/student/StudentNoticeBoard';
import { Unauthorized } from '../pages/Unauthorized';
import { NotFound } from '../pages/NotFound';
import { ROLE_REDIRECTS } from '../utils/constants';

// Generic module placeholder for upcoming phase pages
const ModulePlaceholder = ({ title, subtitle }) => (
  <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-3 glass-panel">
    <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
    <p className="text-xs text-slate-400 max-w-md mx-auto">{subtitle || 'This module will be integrated in upcoming phases.'}</p>
  </div>
);

// Root Index Redirection
const RootRedirect = () => {
  const { isAuthenticated, role, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={ROLE_REDIRECTS[role] || '/login'} replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Access Denied / 404 */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Admin Portal */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="departments" element={<DepartmentsManagement />} />
        <Route path="courses" element={<CoursesManagement />} />
        <Route path="sessions" element={<SessionsManagement />} />
        <Route path="semesters" element={<SemestersSectionsManagement />} />
        <Route path="subjects" element={<SubjectsManagement />} />
        <Route path="students" element={<StudentsManagement />} />
        <Route path="faculty" element={<FacultyManagement />} />
        <Route path="allocations" element={<SubjectAllocationsManagement />} />
        <Route path="attendance" element={<AdminAttendanceOverview />} />
        <Route path="timetable" element={<AdminTimetableManagement />} />
        <Route path="exams" element={<AdminExamsManagement />} />
        <Route path="assignments" element={<AdminAssignmentsOverview />} />
        <Route path="notices" element={<AdminNoticesManagement />} />

        {/* Phase 11+ Modules Placeholders */}
        <Route path="users" element={<ModulePlaceholder title="User Accounts & Security" subtitle="RBAC permissions and account controls" />} />
        <Route path="marks" element={<Navigate to="/admin/exams" replace />} />
        <Route path="fees" element={<ModulePlaceholder title="Fee & Accounts Ledger" subtitle="Student tuition invoicing and payment collection records" />} />
        <Route path="library" element={<ModulePlaceholder title="Library Catalog & Issues" subtitle="Book inventory and circulation management" />} />
        <Route path="reports" element={<ModulePlaceholder title="Analytics & Executive Reports" subtitle="Compliance, attendance, and revenue analytics" />} />
        <Route path="settings" element={<ModulePlaceholder title="System Settings" subtitle="ERP global configurations and parameters" />} />
      </Route>

      {/* Protected Faculty Portal */}
      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/faculty/dashboard" replace />} />
        <Route path="dashboard" element={<FacultyDashboard />} />
        <Route path="attendance" element={<FacultyMarkAttendance />} />
        <Route path="timetable" element={<FacultyTimetable />} />
        <Route path="marks" element={<FacultyMarksEntry />} />
        <Route path="assignments" element={<FacultyAssignmentsManagement />} />
        <Route path="notices" element={<FacultyNoticeBoard />} />
        <Route path="subjects" element={<ModulePlaceholder title="Assigned Subjects" subtitle="Your allocated curriculum subjects and syllabus" />} />
        <Route path="students" element={<ModulePlaceholder title="Student Roster" subtitle="Enrolled students in your assigned sections" />} />
        <Route path="profile" element={<ModulePlaceholder title="Faculty Profile" subtitle="Your employment record and qualifications" />} />
      </Route>

      {/* Protected Student Portal */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="timetable" element={<StudentTimetable />} />
        <Route path="results" element={<StudentResults />} />
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="notices" element={<StudentNoticeBoard />} />
        <Route path="subjects" element={<ModulePlaceholder title="My Enrolled Subjects" subtitle="Current semester course credits and syllabus" />} />
        <Route path="fees" element={<ModulePlaceholder title="My Fee Invoices & Receipts" subtitle="Semester tuition fees and online payment history" />} />
        <Route path="library" element={<ModulePlaceholder title="My Borrowed Books" subtitle="Library circulation records and due dates" />} />
      </Route>

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
