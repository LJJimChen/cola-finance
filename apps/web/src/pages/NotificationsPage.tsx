import React, { useState } from 'react';
import Layout from '../components/Layout';

const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState('All');

  const filters = ['All', 'Alerts', 'Invites', 'System'];

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-gray-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <button className="text-gray-900 dark:text-white flex size-10 shrink-0 items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
              <span className="material-symbols-outlined">arrow_back_ios_new</span>
            </button>
            <h2 className="text-gray-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
              Notifications
              <span className="material-symbols-outlined text-primary text-sm" title="End-to-End Encrypted">lock</span>
            </h2>
          </div>
          <button className="flex items-center justify-end group">
            <p className="text-primary text-sm font-semibold leading-normal tracking-[0.015em] shrink-0 group-hover:underline">Mark all read</p>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-3 sticky top-[60px] z-40 bg-background-light dark:bg-background-dark">
          <div className="flex h-10 w-full items-center justify-center rounded-lg bg-gray-200 dark:bg-[#1A2E22] p-1 gap-0.5">
            {filters.map((f) => (
              <label key={f} className={`flex cursor-pointer h-full flex-1 items-center justify-center overflow-hidden rounded px-1 text-xs font-medium transition-all ${
                filter === f 
                  ? 'bg-white dark:bg-background-dark shadow-sm text-gray-900 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                <span className="truncate">{f}</span>
                <input 
                  type="radio" 
                  name="filter" 
                  value={f} 
                  className="hidden" 
                  checked={filter === f} 
                  onChange={() => setFilter(f)} 
                />
                {f === 'Alerts' && <span className="ml-1 flex h-1.5 w-1.5 rounded-full bg-red-500"></span>}
                {f === 'Invites' && <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-white px-1 text-[9px] font-bold">2</span>}
              </label>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col gap-6 pb-8 px-4">
          {/* Critical Alerts */}
          {(filter === 'All' || filter === 'Alerts') && (
            <div className="flex flex-col gap-3">
              <h3 className="text-gray-900 dark:text-white tracking-tight text-lg font-bold leading-tight text-left">
                Critical Alerts
              </h3>
              
              <div className="group flex flex-col gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 p-4 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                <div className="flex items-start gap-3 pl-2">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                    <span className="material-symbols-outlined text-[20px]">balance</span>
                  </div>
                  <div className="flex flex-col gap-1 pr-1">
                    <p className="text-amber-800 dark:text-amber-200 text-xs font-bold uppercase tracking-wider">Rebalancing Opportunity</p>
                    <p className="text-gray-900 dark:text-white text-sm font-medium leading-tight">
                      Your 'Retirement' portfolio has drifted <span className="text-amber-600 dark:text-amber-400 font-bold">5%</span> from target.
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Recommended action available</p>
                  </div>
                </div>
                <div className="flex gap-3 pl-2 mt-1">
                  <button className="flex items-center justify-center rounded-lg h-8 px-4 bg-primary hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm">
                    Review
                  </button>
                  <button className="flex items-center justify-center rounded-lg h-8 px-4 bg-white hover:bg-gray-50 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-white text-xs font-medium transition-colors border border-gray-200 dark:border-white/10">
                    Dismiss
                  </button>
                </div>
              </div>

              <div className="group flex flex-col gap-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 p-4 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                <div className="flex items-start gap-3 pl-2">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                    <span className="material-symbols-outlined text-[20px]">trending_down</span>
                  </div>
                  <div className="flex flex-col gap-1 pr-1">
                    <p className="text-red-800 dark:text-red-200 text-xs font-bold uppercase tracking-wider">Asset Alert</p>
                    <p className="text-gray-900 dark:text-white text-sm font-medium leading-tight">
                      'Crypto Ledger' value dropped by <span className="text-red-600 dark:text-red-400 font-bold">12%</span> in the last 24h.
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Threshold trigger: -10%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invitations */}
          {(filter === 'All' || filter === 'Invites') && (
            <div className="flex flex-col gap-3">
              <h3 className="text-gray-900 dark:text-white tracking-tight text-lg font-bold leading-tight text-left">
                Invitations
              </h3>
              
              <div className="flex flex-col gap-4 rounded-xl bg-white dark:bg-[#192820] border border-gray-100 dark:border-white/5 p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-4 right-4 size-2 rounded-full bg-primary"></div>
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <div className="size-10 rounded-full bg-gray-200 dark:bg-gray-700 bg-center bg-cover flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-500">person</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-white dark:bg-[#192820] p-0.5">
                      <span className="material-symbols-outlined text-primary text-[16px]">group_add</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5 pr-4">
                    <p className="text-gray-500 dark:text-primary text-xs font-semibold uppercase tracking-wider">Family Vault</p>
                    <p className="text-gray-900 dark:text-white text-sm font-medium leading-tight">
                      <span className="font-bold">Dad</span> invited you to join the <span className="text-gray-900 dark:text-white italic">'Estate Planning'</span> vault.
                    </p>
                    <p className="text-gray-400 text-xs mt-1">2m ago</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-1">
                  <button className="flex flex-1 cursor-pointer items-center justify-center rounded-lg h-9 px-4 bg-primary hover:bg-blue-700 text-white text-sm font-bold transition-colors">
                    Accept
                  </button>
                  <button className="flex flex-1 cursor-pointer items-center justify-center rounded-lg h-9 px-4 bg-white border border-gray-200 dark:bg-white/10 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/20 text-gray-700 dark:text-white text-sm font-medium transition-colors">
                    Decline
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* System Updates */}
          {(filter === 'All' || filter === 'System') && (
            <div className="flex flex-col gap-3">
              <h3 className="text-gray-900 dark:text-white tracking-tight text-lg font-bold leading-tight text-left">
                System Updates
              </h3>
              
              <div className="group flex items-start gap-4 py-3 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors rounded-lg px-2 -mx-2">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  <span className="material-symbols-outlined text-[20px]">system_update</span>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-gray-900 dark:text-white text-sm font-semibold">System Updated</p>
                    <span className="text-gray-400 text-[10px] whitespace-nowrap">5h ago</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-xs leading-normal">
                    Version 2.4 installed successfully. Check out the new privacy features.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NotificationsPage;
