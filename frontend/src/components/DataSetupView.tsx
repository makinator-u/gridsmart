import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { CSVUploader } from './setup/CSVUploader';
import { WizardStep1 } from './setup/WizardStep1';
import { WizardStep2, type FeederDraft } from './setup/WizardStep2';
import { WizardSteps345, WizardStep6 } from './setup/WizardStepsReview';

const TOTAL_STEPS = 6;

const DEFAULT_FEEDERS: FeederDraft[] = [
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
];

interface DataSetupViewProps {
  onGridCreated: () => void;
  onLoadDemo: () => void;
}

export const DataSetupView: React.FC<DataSetupViewProps> = ({ onGridCreated, onLoadDemo }) => {
  const [activeMode, setActiveMode] = useState<'wizard' | 'csv'>('wizard');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Substation
  const [substationName, setSubstationName] = useState('Rural Central Substation 33/11kV');
  const [capacityMw, setCapacityMw] = useState(24.0);
  const [availableMw, setAvailableMw] = useState(19.0);
  const [voltageKv, setVoltageKv] = useState(33.0);

  // Feeders
  const [feeders, setFeeders] = useState<FeederDraft[]>(DEFAULT_FEEDERS);

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
      onGridCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Grid Infrastructure Data Setup</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure substation capacity, feeder parameters, connected consumer groups, and load priorities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['wizard', 'csv'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeMode === mode ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {mode === 'wizard' ? 'Manual Wizard' : 'CSV File Upload'}
            </button>
          ))}
          <button
            onClick={onLoadDemo}
            className="px-3 py-2 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold rounded-xl hover:bg-cyan-600/30 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Load Demo Grid</span>
          </button>
        </div>
      </div>

      {activeMode === 'csv' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="font-bold text-white text-base">CSV Data Import & Template Center</h3>
            <p className="text-xs text-slate-400 mt-1">
              Import custom grid topology or telemetry data using standard CSV spreadsheets.
            </p>
          </div>
          <CSVUploader onComplete={onGridCreated} />
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-8">
          {/* Progress Header */}
          <div className="border-b border-slate-800 pb-4">
            <div className="flex justify-between items-center text-xs font-mono mb-2">
              <span className="text-emerald-400 font-bold">Step {currentStep} of {TOTAL_STEPS}</span>
            </div>
            <div className="flex items-center justify-between">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    onClick={() => setCurrentStep(s)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer transition-all ${
                      currentStep === s
                        ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20'
                        : currentStep > s
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {currentStep > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                  </div>
                  {s < TOTAL_STEPS && (
                    <div className={`h-0.5 w-12 sm:w-20 ${currentStep > s ? 'bg-emerald-500/40' : 'bg-slate-800'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 1 && (
            <WizardStep1
              substationName={substationName}
              setSubstationName={setSubstationName}
              capacityMw={capacityMw}
              setCapacityMw={setCapacityMw}
              availableMw={availableMw}
              setAvailableMw={setAvailableMw}
              voltageKv={voltageKv}
              setVoltageKv={setVoltageKv}
            />
          )}
          {currentStep === 2 && <WizardStep2 feeders={feeders} setFeeders={setFeeders} />}
          {(currentStep === 3 || currentStep === 4 || currentStep === 5) && (
            <WizardSteps345 feeders={feeders} step={currentStep as 3 | 4 | 5} />
          )}
          {currentStep === 6 && (
            <WizardStep6
              substationName={substationName}
              capacityMw={capacityMw}
              availableMw={availableMw}
              feeders={feeders}
              isSubmitting={isSubmitting}
              onConfirm={handleCreateGrid}
            />
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center border-t border-slate-800 pt-4">
            <button
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs rounded-lg font-medium flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              disabled={currentStep === TOTAL_STEPS}
              onClick={() => setCurrentStep((s) => Math.min(TOTAL_STEPS, s + 1))}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
