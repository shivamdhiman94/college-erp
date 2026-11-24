import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { facultyService } from '../../services/faculty.service';
import { timetableService } from '../../services/timetable.service';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import {
  CalendarCheck2,
  BookOpen,
  Users,
  Clock,
  Award,
  Calendar,
  DoorOpen,
} from 'lucide-react';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const FacultyDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFacultyData = async () => {
      try {
        const [profileData, allocsData, schedData] = await Promise.all([
          facultyService.getMyProfile().catch(() => null),
          facultyService.getMyAllocations().catch(() => []),
          timetableService.getMyFacultySchedule().catch(() => null),
        ]);
        setProfile(profileData);
        setAllocations(allocsData || []);
        setSchedule(schedData);
      } catch (err) {
        console.error('Error fetching faculty dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadFacultyData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Spinner size="lg" label="Loading faculty schedule and allocations..." />
      </div>
    );
  }

  const facultyName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : user?.full_name || user?.username;

  const todayName = DAY_NAMES[new Date().getDay()];
  const todaySlots = schedule?.days?.find((d) => d.day === todayName)?.slots || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900/80 via-slate-900 to-brand-950/80 border border-indigo-500/20 p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <Badge variant="primary" size="sm">Faculty Portal</Badge>
              <span className="text-xs text-slate-400">
                Employee Code: <strong className="text-slate-200">{profile?.employee_code || 'FAC-EMP'}</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Welcome, {facultyName}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Department of {profile?.department?.name || 'Academic Studies'} • {profile?.designation || 'Faculty Member'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" icon={Calendar} onClick={() => window.location.href = '/faculty/timetable'}>
              My Timetable
            </Button>
            <Button variant="primary" size="sm" icon={CalendarCheck2} onClick={() => window.location.href = '/faculty/attendance'}>
              Mark Attendance
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Allocated Subjects', value: allocations.length.toString(), subtitle: 'Current Academic Term', icon: BookOpen },
          { title: "Today's Lectures", value: todaySlots.length.toString(), subtitle: `${todayName.charAt(0) + todayName.slice(1).toLowerCase()} Schedule`, icon: Clock },
          { title: 'Qualification', value: profile?.qualification || 'Academician', subtitle: 'Highest Degree', icon: Award },
          { title: 'Department', value: profile?.department?.code || 'CSE', subtitle: 'Academic Branch', icon: Calendar },
        ].map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-lg backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.title}</p>
                <div className="p-2 rounded-xl bg-slate-800 text-indigo-400">
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-white tracking-tight truncate">{item.value}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's Teaching Schedule */}
      <Card
        title={`Today's Teaching Schedule (${todayName.charAt(0) + todayName.slice(1).toLowerCase()})`}
        subtitle={`${todaySlots.length} lecture session(s) on your agenda`}
      >
        {todaySlots.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No teaching sessions scheduled for today.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {todaySlots.map((slot) => (
              <div
                key={slot.timetable_id}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-brand-400">{slot.subject_code}</span>
                  <Badge variant="primary" size="sm">Sec {slot.section_name}</Badge>
                </div>
                <div className="font-bold text-white text-sm truncate">{slot.subject_name}</div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span className="text-emerald-400 font-semibold font-mono">{slot.start_time} - {slot.end_time}</span>
                  <span className="text-indigo-300 font-semibold">{slot.room_number}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Allocated Teaching Subjects Table */}
      <Card title="My Allocated Teaching Loads" subtitle="Subjects and sections assigned to you for the active academic session">
        {allocations.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No active subject allocations assigned yet. Please contact the administrator.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-3">Subject Code</th>
                  <th className="px-4 py-3">Subject Name</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Credits</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Academic Term</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {allocations.map((alloc) => (
                  <tr key={alloc.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-brand-400">
                      {alloc.subject?.code}
                    </td>
                    <td className="px-4 py-3 text-white font-semibold">{alloc.subject?.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="success" size="sm" className="font-mono">
                        Sec {alloc.section?.name}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{alloc.subject?.credits} Cr</td>
                    <td className="px-4 py-3">
                      <Badge variant="primary" size="sm">{alloc.subject?.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{alloc.academic_session?.name}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" icon={CalendarCheck2} onClick={() => window.location.href = '/faculty/attendance'} className="text-xs py-1">
                        Take Attendance
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
