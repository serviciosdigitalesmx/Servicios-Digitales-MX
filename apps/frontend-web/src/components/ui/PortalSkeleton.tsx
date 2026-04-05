import React from 'react';

export const PortalSkeleton = () => {
  return (
    <div className="space-y-6 py-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="w-32 h-6 bg-slate-200 rounded-lg"></div>
        <div className="w-24 h-8 bg-slate-200 rounded-full"></div>
      </div>

      <div className="portal-tech-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-100 rounded-xl border border-slate-50"></div>
          <div className="flex flex-col gap-2">
            <div className="w-20 h-3 bg-slate-100 rounded"></div>
            <div className="w-40 h-8 bg-slate-100 rounded-lg"></div>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <div className="w-20 h-3 bg-slate-100 rounded"></div>
          <div className="w-32 h-6 bg-slate-100 rounded-lg"></div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="portal-tech-card p-6 bg-white border border-slate-100">
            <div className="w-40 h-4 bg-slate-100 rounded mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="w-20 h-3 bg-slate-50 rounded"></div>
                  <div className="w-32 h-5 bg-slate-50 rounded"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="portal-tech-card p-6 bg-white border border-slate-100">
            <div className="w-40 h-4 bg-slate-100 rounded mb-4"></div>
            <div className="w-full h-24 bg-slate-50 rounded-xl"></div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="portal-tech-card p-6 bg-white border border-slate-100">
            <div className="w-full h-12 bg-slate-100 rounded-xl"></div>
          </div>
          <div className="portal-tech-card p-6 bg-white border border-slate-100">
            <div className="w-32 h-4 bg-slate-100 rounded mb-4"></div>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="aspect-square bg-slate-50 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
