import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { dashboardService } from '../../services/academic.service';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  Plus,
  TrendingUp,
  Layers,
  Calendar,
  BookMarked,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

const ATTENDANCE_TREND_DATA = [
  { month: 'Jan', rate: 92 },
  { month: 'Feb', rate: 88 },
  { month: 'Mar', rate: 94 },
  { month: 'Apr', rate: 91 },
  { month: 'May', rate: 89 },
  { month: 'Jun', rate: 95 },
];

const FEE_COLLECTION_DATA = [
  { month: 'Jan', collected: 450, target: 500 },
  { month: 'Feb', collected: 520, target: 500 },
  { month: 'Mar', collected: 610, target: 600 },
  { month: 'Apr', collected: 480, target: 500 },
  { month: 'May', collected: 590, target: 600 },
  { month: 'Jun', collected: 640, target: 650 },
];

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_students: 0,
    active_students: 0,
    total_faculty: 0,
    active_faculty: 0,
    total_departments: 0,
    total_courses: 0,
    total_subjects: 0,
    total_sessions: 0,
    total_sections: 0,
    total_allocations: 0,
    current_session_name: 'Loading...',
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await dashboardService.getAdminStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      }
    };
    loadStats();
  }, []);

  const kpis = [
    {
      title: 'Total Students',
      value: stats.total_students.toString(),
      change: `${stats.active_students} Active Enrolled`,
      icon: Users,
      variant: 'primary',
    },
    {
      title: 'Faculty Members',
      value: stats.total_faculty.toString(),
      change: `${stats.total_allocations} Active Teaching Allocations`,
      icon: GraduationCap,
      variant: 'success',
    },
    {
      title: 'Departments',
      value: stats.total_departments.toString(),
      change: 'Operational Academic Depts',
      icon: Building2,
      variant: 'cyan',
    },
    {
      title: 'Active Courses',
      value: stats.total_courses.toString(),
      change: 'Degree Programs',
      icon: BookOpen,
      variant: 'purple',
    },
    {
      title: 'Subjects Catalog',
      value: stats.total_subjects.toString(),
      change: 'Curriculum Subjects',
      icon: Layers,
      variant: 'warning',
    },
    {
      title: 'Active Session',
      value: stats.current_session_name,
      change: `${stats.total_sections} Lecture Sections`,
      icon: Calendar,
      variant: 'danger',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-brand-900/80 via-slate-900 to-indigo-950/80 border border-brand-500/20 p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <Badge variant="danger" size="sm">System Administrator</Badge>
              <span className="text-xs text-slate-400">
                Active Session: <strong className="text-brand-300 font-semibold">{stats.current_session_name}</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Welcome, {user?.full_name || user?.username}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Quantum University ERP Control Center. Real-time institutional status from the live database.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="primary" size="sm" icon={Plus} onClick={() => window.location.href = '/admin/students'}>
              Admit Student
            </Button>
          </div>
        </div>
      </div>

      {/* Live Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((stat, idx) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all duration-200 shadow-lg group backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.title}</p>
                <div className="p-2 rounded-xl bg-slate-800 text-brand-400 group-hover:bg-brand-500/10 group-hover:text-brand-300 transition-colors">
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-white tracking-tight">{stat.value}</span>
                <span className="text-[11px] font-medium text-slate-400 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 inline text-brand-400" />
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Attendance Performance Trends" subtitle="Average monthly student attendance across all sections">
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ATTENDANCE_TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" domain={[70, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="Attendance %"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366f1' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Tuition & Fee Collections ($k)" subtitle="Monthly realized revenue vs projected targets">
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FEE_COLLECTION_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="collected" name="Realized ($k)" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="target" name="Target ($k)" fill="#334155" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Relational Hierarchy Live Status */}
      <Card title="Database & Hierarchy Status" subtitle="Relational models connected and live">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <div className="text-xs text-slate-400">Departments</div>
            <div className="text-lg font-bold text-white mt-1">{stats.total_departments}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <div className="text-xs text-slate-400">Courses</div>
            <div className="text-lg font-bold text-white mt-1">{stats.total_courses}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <div className="text-xs text-slate-400">Sessions</div>
            <div className="text-lg font-bold text-white mt-1">{stats.total_sessions}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <div className="text-xs text-slate-400">Subjects</div>
            <div className="text-lg font-bold text-white mt-1">{stats.total_subjects}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <div className="text-xs text-slate-400">Teaching Allocations</div>
            <div className="text-lg font-bold text-brand-400 mt-1">{stats.total_allocations}</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
