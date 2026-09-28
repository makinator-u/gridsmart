import React from 'react';

interface Props {
  substationName: string;
  setSubstationName: (v: string) => void;
  capacityMw: number;
  setCapacityMw: (v: number) => void;
  availableMw: number;
  setAvailableMw: (v: number) => void;
  voltageKv: number;
  setVoltageKv: (v: number) => void;
}

export const WizardStep1: React.FC<Props> = ({
  substationName, setSubstationName,
  capacityMw, setCapacityMw,
  availableMw, setAvailableMw,
  voltageKv, setVoltageKv,
}) => (
  <div className="space-y-4 max-w-xl">
    <h3 className="font-bold text-white text-sm">Step 1: Substation Information</h3>
    <div className="space-y-3 text-xs">
      <div>
        <label className="block text-slate-400 mb-1">Substation Name</label>
        <input
          type="text"
          value={substationName}
          onChange={(e) => setSubstationName(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-400 mb-1">Total Capacity (MW)</label>
          <input
            type="number"
            value={capacityMw}
            onChange={(e) => setCapacityMw(parseFloat(e.target.value) || 20.0)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-slate-400 mb-1">Available Power Generation (MW)</label>
          <input
            type="number"
            value={availableMw}
            onChange={(e) => setAvailableMw(parseFloat(e.target.value) || 18.0)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
          />
        </div>
      </div>
      <div>
        <label className="block text-slate-400 mb-1">Voltage Level (kV)</label>
        <input
          type="number"
          value={voltageKv}
          onChange={(e) => setVoltageKv(parseFloat(e.target.value) || 33.0)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
        />
      </div>
    </div>
  </div>
);
