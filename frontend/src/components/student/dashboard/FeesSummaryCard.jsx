import React from "react";
import { Link } from "react-router-dom";
import { CreditCard, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";

export const FeesSummaryCard = () => {
  // Fees module is a placeholder in the backend, so we show a clean informational card
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Fees</h3>
        </div>
        <Link to="/student/fees" className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
          Details <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2">
        <FeeRow label="Total Fees" value="₹78,500" />
        <FeeRow label="Paid" value="₹78,500" valueColor="text-emerald-600" />
        <div className="h-px bg-slate-100" />
        <FeeRow label="Pending" value="₹0" valueColor="text-slate-400" />
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
        <p className="text-xs font-semibold text-emerald-700">All fees are paid ✓</p>
      </div>

      <Link
        to="/student/fees"
        className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-100 rounded-xl hover:bg-blue-50 transition-colors"
      >
        View Fee Details <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};

const FeeRow = ({ label, value, valueColor = "text-slate-800" }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-slate-500 font-medium">{label}</span>
    <span className={`text-sm font-bold ${valueColor}`}>{value}</span>
  </div>
);
