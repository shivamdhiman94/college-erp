import React, { useState, useEffect } from 'react';
import { examService } from '../../services/exam.service';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import {
  Award,
  CheckCircle2,
  XCircle,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

export const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const data = await examService.getMyResults();
        setResults(data);
      } catch (err) {
        console.error('Failed to load student exam results:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadResults();
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Spinner size="lg" label="Loading published examination results..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
          <Award className="w-6 h-6 text-brand-400" />
          <span>Official Examination Results & Transcripts</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          View official university report cards, SGPA performance scores, and subject-wise grade evaluations.
        </p>
      </div>

      {results.length === 0 ? (
        <Card bodyClassName="p-12 text-center space-y-3">
          <Award className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Published Examination Results</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Your examination papers are currently being evaluated or awaiting official publication by the academic office.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {results.map((report) => (
            <div key={report.exam_id} className="space-y-4">
              {/* Exam Overview Summary Card */}
              <div className="rounded-3xl bg-gradient-to-r from-brand-950/80 via-slate-900 to-indigo-950/80 border border-brand-500/20 p-6 shadow-2xl backdrop-blur-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="primary" size="sm">{report.exam_type}</Badge>
                      <span className="text-xs text-slate-400">{report.session_name} • {report.semester_name}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{report.exam_name}</h3>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge
                      variant={report.result_status === 'PASS' ? 'success' : 'danger'}
                      size="lg"
                      className="font-extrabold text-sm px-4 py-1.5"
                    >
                      {report.result_status === 'PASS' ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                    </Badge>
                  </div>
                </div>

                {/* Score Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Term SGPA</span>
                    <div className="text-2xl font-black text-brand-400 mt-0.5">{report.sgpa.toFixed(2)}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Overall %</span>
                    <div className="text-2xl font-black text-white mt-0.5">{report.overall_percentage}%</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Marks Obtained</span>
                    <div className="text-2xl font-black text-emerald-400 mt-0.5">{report.total_obtained_marks} / {report.total_max_marks}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Subjects</span>
                    <div className="text-2xl font-black text-indigo-400 mt-0.5">{report.subjects.length} Evaluated</div>
                  </div>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <Card title="Subject-wise Marks & Grade Breakdown" subtitle="Official academic transcript details">
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                  <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
                    <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase">
                      <tr>
                        <th className="px-4 py-3">Subject Code</th>
                        <th className="px-4 py-3">Subject Name</th>
                        <th className="px-4 py-3 text-center">Credits</th>
                        <th className="px-4 py-3 text-center">Max Marks</th>
                        <th className="px-4 py-3 text-center">Marks Obtained</th>
                        <th className="px-4 py-3 text-center">Percentage</th>
                        <th className="px-4 py-3 text-center">Grade</th>
                        <th className="px-4 py-3 text-center">Grade Point</th>
                        <th className="px-4 py-3 text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium text-xs">
                      {report.subjects.map((sub) => (
                        <tr key={sub.subject_code} className="hover:bg-slate-900/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-brand-400">
                            {sub.subject_code}
                          </td>
                          <td className="px-4 py-3 text-white font-semibold">{sub.subject_name}</td>
                          <td className="px-4 py-3 text-center text-slate-300">{sub.credits}</td>
                          <td className="px-4 py-3 text-center text-slate-400">{sub.max_marks}</td>
                          <td className="px-4 py-3 text-center font-bold text-white">{sub.marks_obtained}</td>
                          <td className="px-4 py-3 text-center text-slate-300">{sub.percentage}%</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-brand-300 text-sm">
                            {sub.grade}
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-emerald-400 font-bold">
                            {sub.grade_point.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Badge variant={sub.status === 'PASS' ? 'success' : 'danger'} size="sm">
                              {sub.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
