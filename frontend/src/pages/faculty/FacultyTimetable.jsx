import React, { useState, useEffect } from 'react';
import { timetableService } from '../../services/timetable.service';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import {
  Calendar,
  Clock,
  DoorOpen,
  BookOpen,
  Users,
  Sparkles,
} from 'lucide-react';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const FacultyTimetable = () => {
  const [weeklySchedule, setWeeklySchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const data = await timetableService.getMyFacultySchedule();
        setWeeklySchedule(data);
      } catch (err) {
        console.error('Failed to load faculty timetable:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSchedule();
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Spinner size="lg" label="Loading your teaching schedule..." />
      </div>
    );
  }

  const todayName = DAY_NAMES[new Date().getDay()];
  const todaySlots = weeklySchedule?.days?.find((d) => d.day === todayName)?.slots || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
          <Calendar className="w-6 h-6 text-brand-400" />
          <span>Faculty Lecture Timetable & Schedule</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review your weekly assigned lecture timetable, assigned rooms, and daily schedule.
        </p>
      </div>

      {/* Today's Schedule Banner */}
      <Card
        title={`Today's Teaching Schedule (${todayName.charAt(0) + todayName.slice(1).toLowerCase()})`}
        subtitle={`${todaySlots.length} lecture session(s) scheduled for today`}
      >
        {todaySlots.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No teaching sessions scheduled for today.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {todaySlots.map((slot) => (
              <div
                key={slot.timetable_id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-brand-500/40 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-brand-400 text-xs">
                    {slot.subject_code}
                  </span>
                  <Badge variant="primary" size="sm">
                    Sec {slot.section_name}
                  </Badge>
                </div>
                <div className="font-bold text-white text-sm truncate">
                  {slot.subject_name}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center space-x-1 font-mono text-emerald-400 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{slot.start_time} – {slot.end_time}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-indigo-300 font-semibold">
                    <DoorOpen className="w-3.5 h-3.5" />
                    <span>{slot.room_number}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Weekly Schedule Grid */}
      <Card title="Weekly Teaching Schedule Matrix" subtitle="Complete Monday through Saturday timetable">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {weeklySchedule?.days?.map((dayObj) => (
            <div
              key={dayObj.day}
              className={`p-4 rounded-2xl border transition-all ${
                dayObj.day === todayName
                  ? 'bg-brand-950/20 border-brand-500/40 ring-1 ring-brand-500/20'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="font-bold text-sm text-white">
                  {dayObj.day.charAt(0) + dayObj.day.slice(1).toLowerCase()}
                </h4>
                <Badge variant={dayObj.day === todayName ? 'primary' : 'default'} size="sm">
                  {dayObj.slots.length} Classes
                </Badge>
              </div>

              <div className="space-y-2.5 pt-3">
                {dayObj.slots.length === 0 ? (
                  <div className="text-center py-4 text-[11px] text-slate-500">
                    No classes scheduled
                  </div>
                ) : (
                  dayObj.slots.map((s) => (
                    <div
                      key={s.timetable_id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1 text-xs"
                    >
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-white truncate max-w-[150px]">{s.subject_name}</span>
                        <span className="font-mono text-emerald-400 text-[11px] font-semibold">{s.start_time} - {s.end_time}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Sec {s.section_name} • {s.subject_code}</span>
                        <span className="text-indigo-300 font-semibold">{s.room_number}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
