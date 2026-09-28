import React, { useState, useEffect } from 'react';
import { History, Search } from 'lucide-react';
import type { GridEventLog } from '../types';
import { api } from '../api/client';

export const EventHistoryView: React.FC = () => {
  const [events, setEvents] = useState<GridEventLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const fetchEvents = React.useCallback(async () => {
    try {
      const data = await api.getEvents(100);
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 4000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const filtered = events.filter((e) => {
    const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) || e.event_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'ALL' || e.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <span>Grid Event Log & Operator Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Chronological audit trail recording all feeder events, AI anomaly detections, MILP optimizations, and operator decisions.
          </p>
        </div>

        {/* Search & Severity Filter */}
        <div className="flex items-center gap-3 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search event log..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono focus:border-emerald-500 outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* Events Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Event Type</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Event Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-800/30">
                  <td className="p-3 font-bold text-slate-400 whitespace-nowrap">{evt.timestamp}</td>
                  <td className="p-3 font-bold text-white whitespace-nowrap">{evt.event_type}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        evt.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : evt.severity === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {evt.severity}
                    </span>
                  </td>
                  <td className="p-3 text-slate-200">{evt.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
