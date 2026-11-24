export const USER_ROLES = {
  ADMIN: 'ADMIN',
  FACULTY: 'FACULTY',
  STUDENT: 'STUDENT',
};

export const ROLE_REDIRECTS = {
  ADMIN: '/admin/dashboard',
  FACULTY: '/faculty/dashboard',
  STUDENT: '/student/dashboard',
};

export const ADMIN_NAV_ITEMS = [
  { title: 'Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard' },
  {
    title: 'Academic Core',
    items: [
      { title: 'Departments', path: '/admin/departments', icon: 'Building2' },
      { title: 'Courses', path: '/admin/courses', icon: 'GraduationCap' },
      { title: 'Academic Sessions', path: '/admin/sessions', icon: 'Calendar' },
      { title: 'Semesters & Sections', path: '/admin/semesters', icon: 'Layers' },
      { title: 'Subjects', path: '/admin/subjects', icon: 'BookOpen' },
    ]
  },
  {
    title: 'People Management',
    items: [
      { title: 'Students', path: '/admin/students', icon: 'Users' },
      { title: 'Faculty & Staff', path: '/admin/faculty', icon: 'UserCheck' },
      { title: 'User Accounts', path: '/admin/users', icon: 'ShieldCheck' },
    ]
  },
  {
    title: 'Operations',
    items: [
      { title: 'Attendance', path: '/admin/attendance', icon: 'CalendarCheck2' },
      { title: 'Timetable', path: '/admin/timetable', icon: 'Clock' },
      { title: 'Examinations', path: '/admin/exams', icon: 'Award' },
      { title: 'Marks & Results', path: '/admin/marks', icon: 'FileSpreadsheet' },
      { title: 'Assignments', path: '/admin/assignments', icon: 'FileEdit' },
      { title: 'Notices', path: '/admin/notices', icon: 'Bell' },
      { title: 'Fees & Finance', path: '/admin/fees', icon: 'CreditCard' },
      { title: 'Library', path: '/admin/library', icon: 'BookMarked' },
      { title: 'Reports & Analytics', path: '/admin/reports', icon: 'BarChart3' },
      { title: 'System Settings', path: '/admin/settings', icon: 'Settings' },
    ]
  }
];

export const FACULTY_NAV_ITEMS = [
  { title: 'Dashboard', path: '/faculty/dashboard', icon: 'LayoutDashboard' },
  {
    title: 'Teaching & Classes',
    items: [
      { title: 'Assigned Subjects', path: '/faculty/subjects', icon: 'BookOpen' },
      { title: 'Students List', path: '/faculty/students', icon: 'Users' },
      { title: 'Mark Attendance', path: '/faculty/attendance', icon: 'CalendarCheck2' },
      { title: 'Upload Marks', path: '/faculty/marks', icon: 'Award' },
      { title: 'Assignments', path: '/faculty/assignments', icon: 'FileEdit' },
      { title: 'My Timetable', path: '/faculty/timetable', icon: 'Clock' },
      { title: 'Notice Board', path: '/faculty/notices', icon: 'Bell' },
      { title: 'My Profile', path: '/faculty/profile', icon: 'User' },
    ]
  }
];

export const STUDENT_NAV_ITEMS = [
  {
    title: 'Main',
    items: [
      { title: 'Dashboard', path: '/student/dashboard', icon: 'LayoutDashboard' },
      { title: 'My Profile', path: '/student/profile', icon: 'User' },
      { title: 'Attendance', path: '/student/attendance', icon: 'CalendarCheck2' },
      { title: 'Timetable', path: '/student/timetable', icon: 'Clock' },
      { title: 'Assignments', path: '/student/assignments', icon: 'FileEdit' },
      { title: 'Study Material', path: '/student/subjects', icon: 'BookOpen' },
    ]
  },
  {
    title: 'Academic',
    items: [
      { title: 'Courses', path: '/student/subjects', icon: 'GraduationCap' },
      { title: 'Subjects', path: '/student/subjects', icon: 'Layers' },
      { title: 'Results', path: '/student/results', icon: 'Award' },
      { title: 'Examination', path: '/student/results', icon: 'FileSpreadsheet' },
      { title: 'Academic Calendar', path: '/student/timetable', icon: 'Calendar' },
    ]
  },
  {
    title: 'Campus',
    items: [
      { title: 'Library', path: '/student/library', icon: 'BookMarked' },
      { title: 'Hostel', path: '/student/subjects', icon: 'Home' },
      { title: 'Events', path: '/student/notices', icon: 'CalendarDays' },
      { title: 'Placement', path: '/student/subjects', icon: 'Briefcase' },
      { title: 'Circulars & Notices', path: '/student/notices', icon: 'Bell' },
    ]
  },
  {
    title: 'Finance',
    items: [
      { title: 'Fees', path: '/student/fees', icon: 'CreditCard' },
      { title: 'Fee Receipts', path: '/student/fees', icon: 'Receipt' },
      { title: 'Payment History', path: '/student/fees', icon: 'History' },
    ]
  },
  {
    title: 'Support',
    items: [
      { title: 'Help Desk', path: '/student/subjects', icon: 'HelpCircle' },
      { title: 'Contact University', path: '/student/subjects', icon: 'Phone' },
    ]
  }
];
