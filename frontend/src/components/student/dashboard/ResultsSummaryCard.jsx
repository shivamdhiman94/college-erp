import React from "react";
import { Link } from "react-router-dom";
import { Award, TrendingUp, ChevronRight, CheckCircle, XCircle } from "lucide-react";

export const ResultsSummaryCard = ({ results }) => {
  const latest = Array.isArray(results) && results.length > 0 ? results[0] : null;

  const semNum = latest?.exam?.semester?.semester_number || latest?.semester || "—";
  const sgpa = latest?.sgpa != null ? Number(latest.sgpa).toFixed(2) : null;
  const cgpa = latest?.cgpa != null ? Number(latest.cgpa).toFixed(2) : (sgpa || null);
  const status = latest?.result_status || "—";
  const isPassed = status === "PASS";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Results</h3>
        </div>
        <Link to="/student/results" className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
          View <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {!latest ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <Award className="w-10 h-10 text-slate-200" />
          <p className="text-sm font-semibold text-slate-500">No results yet</p>
          <p className="text-xs text-slate-400">Results will appear after exams</p>
        </div>
      ) : (
        <>
          <div className="bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Latest Result — Semester {semNum}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center bg-white rounded-xl py-3 border border-slate-100">
                <p className="text-2xl font-extrabold text-blue-700">{sgpa || "—"}</p>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">SGPA</p>
              </div>
              <div className="text-center bg-white rounded-xl py-3 border border-slate-100">
                <p className="text-2xl font-extrabold text-indigo-700">{cgpa || "—"}</p>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">CGPA</p>
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${isPassed ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100"}`}>
            {isPassed
              ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
            <p className={`text-xs font-semibold ${isPassed ? "text-emerald-700" : "text-red-600"}`}>
              Result Status: {status}
              {isPassed && sgpa && Number(sgpa) >= 8.5 ? " (Distinction)" : ""}
            </p>
          </div>
        </>
      )}

      <Link
        to="/student/results"
        className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-purple-600 hover:text-purple-700 border border-purple-100 rounded-xl hover:bg-purple-50 transition-colors"
      >
        <TrendingUp className="w-3.5 h-3.5" /> View All Results
      </Link>
    </div>
  );
};
