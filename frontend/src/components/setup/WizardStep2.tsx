import React from 'react';

export interface FeederDraft {
  feeder_id: string;
  name: string;
  capacity_mw: number;
  initial_load_mw: number;
  connected_village: string;
  consumer_count: number;
  groups: { consumer_type: string; power_mw: number; priority: number; is_critical: boolean }[];
}

interface Props {
  feeders: FeederDraft[];
  setFeeders: (feeders: FeederDraft[]) => void;
}

const BLANK_FEEDER = (idx: number): FeederDraft => ({
  feeder_id: `F0${idx + 1}`,
  name: `Feeder F0${idx + 1}`,
  capacity_mw: 4.0,
  initial_load_mw: 2.5,
  connected_village: `Village ${idx + 1}`,
  consumer_count: 180,
  groups: [
    { consumer_type: 'Residential', power_mw: 1.0, priority: 3, is_critical: false },
    { consumer_type: 'Agriculture', power_mw: 1.2, priority: 4, is_critical: false },
  ],
});

const updateFeeder = <K extends keyof FeederDraft>(
  feeders: FeederDraft[],
  idx: number,
  key: K,
  val: FeederDraft[K],
): FeederDraft[] => {
  const copy = [...feeders];
  copy[idx] = { ...copy[idx], [key]: val };
  return copy;
};

export const WizardStep2: React.FC<Props> = ({ feeders, setFeeders }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="font-bold text-white text-sm">Step 2: Feeder Network Configuration</h3>
      <button
        onClick={() => setFeeders([...feeders, BLANK_FEEDER(feeders.length)])}
        className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold"
      >
        + Add Feeder
      </button>
    </div>

    <div className="space-y-3">
      {feeders.map((f, idx) => (
        <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {(
              [
                { label: 'Feeder Code', field: 'feeder_id' },
                { label: 'Feeder Name', field: 'name' },
                { label: 'Connected Village', field: 'connected_village' },
              ] as const
            ).map(({ label, field }) => (
              <div key={field}>
                <label className="block text-slate-400 mb-1">{label}</label>
                <input
                  type="text"
                  value={f[field] as string}
                  onChange={(e) => setFeeders(updateFeeder(feeders, idx, field, e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                />
              </div>
            ))}
            <div>
              <label className="block text-slate-400 mb-1">Capacity (MW)</label>
              <input
                type="number"
                value={f.capacity_mw}
                onChange={(e) =>
                  setFeeders(updateFeeder(feeders, idx, 'capacity_mw', parseFloat(e.target.value) || 4.0))
                }
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
