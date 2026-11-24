import React from "react";

const Shimmer = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />
);

export const DashboardSkeleton = () => (
  <div className="p-4 sm:p-6 space-y-6">
    {/* Header */}
    <div className="space-y-2">
      <Shimmer className="h-7 w-64" />
      <Shimmer className="h-4 w-96" />
    </div>

    {/* Top cards row */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-10 w-10 rounded-xl" />
          </div>
          <Shimmer className="h-8 w-20" />
          <Shimmer className="h-3 w-32" />
        </div>
      ))}
    </div>

    {/* Middle row */}
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <Shimmer className="h-5 w-36" />
        {[1,2,3].map(i => (
          <div key={i} className="flex gap-4">
            <Shimmer className="h-12 w-16 shrink-0" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-4 w-48" />
              <Shimmer className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
      <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
        <Shimmer className="h-5 w-32" />
        {[1,2,3].map(i => (
          <div key={i} className="space-y-1.5">
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>

    {/* Quick access grid */}
    <div className="space-y-3">
      <Shimmer className="h-5 w-36" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2">
            <Shimmer className="h-10 w-10 rounded-xl" />
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-3 w-28" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
