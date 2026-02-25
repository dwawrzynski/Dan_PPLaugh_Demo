
import React from 'react';
import { SessionStats } from '../types';

interface DashboardProps {
  stats: SessionStats;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mx-auto mb-8">
      <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl text-center backdrop-blur-md">
        <h3 className="text-zinc-500 text-sm uppercase tracking-widest mb-1">Total Laughs</h3>
        <p className="theater-font text-5xl text-red-500">{stats.totalLaughs}</p>
      </div>
      <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl text-center backdrop-blur-md relative overflow-hidden">
        <h3 className="text-zinc-500 text-sm uppercase tracking-widest mb-1">Current Bill</h3>
        <div className="flex items-baseline justify-center gap-1">
          <p className="theater-font text-5xl text-white">€{stats.currentBill.toFixed(2)}</p>
        </div>
        {stats.isMaxed && (
          <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] px-2 py-0.5 font-bold rounded-bl-lg animate-pulse uppercase">
            Season Ticket Active
          </div>
        )}
      </div>
    </div>
  );
};
