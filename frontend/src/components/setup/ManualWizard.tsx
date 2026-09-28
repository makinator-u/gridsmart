import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '../../api/client';

interface ManualWizardProps {
  onComplete: () => void;
}

export const ManualWizard: React.FC<ManualWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [substationName, setSubstationName] = useState('Rural Central Substation 33/11kV');
  const [capacityMw, setCapacityMw] = useState<number>(24.0);
  const [availableMw, setAvailableMw] = useState<number>(19.0);
  const [voltageKv, setVoltageKv] = useState<number>(33.0);

  const [feeders, setFeeders] = useState([
    {
      feeder_id: 'F01',
      name: 'F01 - North Feeder',
      capacity_mw: 4.0,
      initial_load_mw: 2.8,
      connected_village: 'Village Khed',
      consumer_count: 200,
      groups: [
        { consumer_type: 'Residential', power_mw: 1.2, priority: 3, is_critical: false },
        { consumer_type: 'Agriculture', power_mw: 1.3, priority: 4, is_critical: false },
        { consumer_type: 'Hospital', power_mw: 0.3, priority: 1, is_critical: true },
      ],
    },
    {
      feeder_id: 'F02',
      name: 'F02 - South Feeder',
      capacity_mw: 4.0,
      initial_load_mw: 3.5,
      connected_village: 'Village Shirur',
      consumer_count: 250,
      groups: [
        { consumer_type: 'Agriculture', power_mw: 2.2, priority: 4, is_critical: false },
        { consumer_type: 'Residential', power_mw: 1.0, priority: 3, is_critical: false },
        { consumer_type: 'Water Supply', power_mw: 0.3, priority: 1, is_critical: true },
      ],
    },
  ]);

  const handleCreateGrid = async () => {
    setIsSubmitting(true);
    try {
      await api.createManualGrid({
        substation_name: substationName,
        substation_capacity_mw: capacityMw,
        available_power_mw: availableMw,
        voltage_level_kv: voltageKv,
        feeders: feeders.map((f) => ({
          feeder_id: f.feeder_id,
          name: f.name,
          capacity_mw: f.capacity_mw,
          initial_load_mw: f.initial_load_mw,
          connected_village: f.connected_village,
          consumer_count: f.consumer_count,
          consumer_groups: f.groups,
        })),
      });
      setIsSubmitting(false);
      onComplete();
    } catch (err) {
      console.error('Failed to create manual grid:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Progress Steps Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex justify-between items-center text-xs font-mono mb-2">
          <span className="text-emerald-400 font-bold">Step {currentStep} of 6</span>
          <span className="text-slate-400">
            {currentStep === 1 && 'Substation Specifications'}
            {currentStep === 2 && 'Feeder Line Configurations'}
            {currentStep === 3 && 'Consumer Category Groups'}
            {currentStep === 4 && 'Critical Load Hard Protection'}
            {currentStep === 5 && 'Initial Load Telemetry'}
            {currentStep === 6 && 'Review & Deploy Network'}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Substation */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white">Step 1: 33/11kV Substation Specification</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400">Substation Name</label>
              <input
                type="text"
                value={substationName}
                onChange={(e) => setSubstationName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">Rated Transformer Capacity (MW)</label>
              <input
                type="number"
                value={capacityMw}
                onChange={(e) => setCapacityMw(parseFloat(e.target.value) || 20.0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">Available Upstream Generation (MW)</label>
              <input
                type="number"
                value={availableMw}
                onChange={(e) => setAvailableMw(parseFloat(e.target.value) || 18.0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">Voltage Level (kV)</label>
              <input
                type="number"
                value={voltageKv}
                onChange={(e) => setVoltageKv(parseFloat(e.target.value) || 33.0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2-5: Feeders & Groups */}
      {currentStep >= 2 && currentStep <= 5 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white">Configured Feeder Lines ({feeders.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {feeders.map((f, idx) => (
              <div key={idx} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between font-bold text-white">
                  <span>{f.name}</span>
                  <span className="text-emerald-400 font-mono">{f.capacity_mw} MW</span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>Village: {f.connected_village}</span>
                  <span>Consumers: {f.consumer_count}</span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800/80">
                  {f.groups.map((g, gIdx) => (
                    <span
                      key={gIdx}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        g.is_critical ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {g.consumer_type}: {g.power_mw} MW
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 6: Review & Launch */}
      {currentStep === 6 && (
        <div className="space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white">Step 6: Review Configuration & Build Network</h3>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Substation:</span>
              <span className="text-white font-bold">{substationName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Capacity / Available:</span>
              <span className="text-cyan-400">{capacityMw} MW / {availableMw} MW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Feeders Configured:</span>
              <span className="text-emerald-400 font-bold">{feeders.length} Lines</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center border-t border-slate-800 pt-4">
        <button
          disabled={currentStep === 1}
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs rounded-lg font-medium flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        {currentStep < 6 ? (
          <button
            onClick={() => setCurrentStep((s) => Math.min(6, s + 1))}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleCreateGrid}
            disabled={isSubmitting}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Deploying...' : 'Deploy Custom Grid'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
