import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/student.service';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';

export const StudentProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await studentService.getMyProfile();
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Spinner size="lg" label="Loading student records..." />
      </div>
    );
  }

  const studentName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : user?.full_name || user?.username;

  return (
    <div className="space-y-6 max-w-4xl">
      <Card title="Student Academic Profile" subtitle="Official registration and enrollment records">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-slate-800">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl border border-white/10">
            {profile?.first_name ? profile.first_name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {studentName}
            </h3>
            <p className="text-xs text-brand-400 font-semibold font-mono">
              Roll No: {profile?.roll_number || 'N/A'} • Enrollment: {profile?.enrollment_number || 'N/A'}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              <Badge variant="success" size="sm">{profile?.status || 'ACTIVE STUDENT'}</Badge>
              <Badge variant="primary" size="sm">{profile?.department?.name || 'Department'}</Badge>
              <Badge variant="default" size="sm">
                {profile?.current_semester?.name || 'Semester 1'}
              </Badge>
              {profile?.current_section && (
                <Badge variant="cyan" size="sm" className="font-mono">
                  Section {profile.current_section.name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Institutional Details</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Degree Program:</span>
                <span className="text-white font-medium">{profile?.course?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Department:</span>
                <span className="text-white font-medium">{profile?.department?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Academic Session:</span>
                <span className="text-white font-medium">{profile?.admission_session?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Admission Date:</span>
                <span className="text-white font-medium">{profile?.admission_date}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal Information</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Primary Phone:</span>
                <span className="text-white font-medium">{profile?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Guardian / Parent:</span>
                <span className="text-white font-medium">{profile?.guardian_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Blood Group:</span>
                <span className="text-white font-medium">{profile?.blood_group || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Account Status:</span>
                <span className="text-emerald-400 font-semibold">{profile?.status || 'ACTIVE'}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
