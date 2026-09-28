import React, { useState } from 'react';
import { Upload, CheckCircle2, ArrowRight, ArrowLeft, RefreshCw, Zap } from 'lucide-react';
import { api } from '../api/client';

interface DataSetupViewProps {
  onGridCreated: () => void;
  onLoadDemo: () => void;
}

export const DataSetupView: React.FC<DataSetupViewProps> = ({ onGridCreated, onLoadDemo }) => {
  const [activeMode, setActiveMode] = useState<'wizard' | 'csv'>('wizard');
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
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

  // CSV State
  const [feedersFile, setFeedersFile] = useState<File | null>(null);
  const [consumerFile, setConsumerFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      onGridCreated();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedersFile && !consumerFile) return;
    setIsSubmitting(true);
    try {
      const res = await api.uploadCSV(feedersFile || undefined, consumerFile || undefined);
      setUploadMessage(res.message);
      setIsSubmitting(false);
      onGridCreated();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Grid Infrastructure Data Setup</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure substation capacity, feeder parameters, connected consumer groups, and load priorities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMode('wizard')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeMode === 'wizard' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Manual Wizard
          </button>
          <button
            onClick={() => setActiveMode('csv')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeMode === 'csv' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300'
            }`}
          >
            CSV File Upload
          </button>
          <button
            onClick={onLoadDemo}
            className="px-3 py-2 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold rounded-xl hover:bg-cyan-600/30 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Load Demo Grid</span>
          </button>
        </div>
      </div>

      {activeMode === 'wizard' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-8">
          {/* Progress Steps Header */}
          <div className="border-b border-slate-800 pb-4">
            <div className="flex justify-between items-center text-xs font-mono mb-2">
              <span className="text-emerald-400 font-bold">Step {currentStep} of 6</span>
              <span className="text-slate-400">
                {currentStep === 1 && '1. Substation Information'}
                {currentStep === 2 && '2. Feeders & Villages'}
                {currentStep === 3 && '3. Consumer Groups'}
                {currentStep === 4 && '4. Priority & Importance'}
                {currentStep === 5 && '5. Initial Feeder Loading'}
                {currentStep === 6 && '6. Review & Build Grid'}
              </span>
            </div>
            {/* Step circles */}
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5, 6].map((s) => (
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
                  {s < 6 && <div className={`h-0.5 w-12 sm:w-20 ${currentStep > s ? 'bg-emerald-500/40' : 'bg-slate-800'}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Substation Info */}
          {currentStep === 1 && (
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
          )}

          {/* Step 2: Feeders */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white text-sm">Step 2: Feeder Network Configuration</h3>
                <button
                  onClick={() =>
                    setFeeders([
                      ...feeders,
                      {
                        feeder_id: `F0${feeders.length + 1}`,
                        name: `Feeder F0${feeders.length + 1}`,
                        capacity_mw: 4.0,
                        initial_load_mw: 2.5,
                        connected_village: `Village ${feeders.length + 1}`,
                        consumer_count: 180,
                        groups: [
                          { consumer_type: 'Residential', power_mw: 1.0, priority: 3, is_critical: false },
                          { consumer_type: 'Agriculture', power_mw: 1.2, priority: 4, is_critical: false },
                        ],
                      },
                    ])
                  }
                  className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold"
                >
                  + Add Feeder
                </button>
              </div>

              <div className="space-y-3">
                {feeders.map((f, idx) => (
                  <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Feeder Code</label>
                        <input
                          type="text"
                          value={f.feeder_id}
                          onChange={(e) => {
                            const copy = [...feeders];
                            copy[idx].feeder_id = e.target.value;
                            setFeeders(copy);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Feeder Name</label>
                        <input
                          type="text"
                          value={f.name}
                          onChange={(e) => {
                            const copy = [...feeders];
                            copy[idx].name = e.target.value;
                            setFeeders(copy);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Capacity (MW)</label>
                        <input
                          type="number"
                          value={f.capacity_mw}
                          onChange={(e) => {
                            const copy = [...feeders];
                            copy[idx].capacity_mw = parseFloat(e.target.value) || 4.0;
                            setFeeders(copy);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Connected Village</label>
                        <input
                          type="text"
                          value={f.connected_village}
                          onChange={(e) => {
                            const copy = [...feeders];
                            copy[idx].connected_village = e.target.value;
                            setFeeders(copy);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Steps 3, 4, 5 Summary / Consumer Groups */}
          {(currentStep === 3 || currentStep === 4 || currentStep === 5) && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-sm">
                {currentStep === 3 && 'Step 3: Consumer Group Categories'}
                {currentStep === 4 && 'Step 4: Load Importance & Priorities'}
                {currentStep === 5 && 'Step 5: Initial Feeder Load Breakdown'}
              </h3>
              <p className="text-xs text-slate-400">
                Priority scale: Priority 1 (Must Stay ON - Hospital/Water Supply), Priority 3 (Residential), Priority 4 (Flexible Agriculture/Commercial).
              </p>

              <div className="space-y-3">
                {feeders.map((f, fIdx) => (
                  <div key={fIdx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                    <div className="font-bold text-emerald-400">Feeder {f.feeder_id} - {f.name}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {f.groups.map((cg, gIdx) => (
                        <div key={gIdx} className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                          <div className="font-semibold text-white">{cg.consumer_type}</div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400">Power: {cg.power_mw} MW</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${cg.priority === 1 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                              Priority {cg.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Review & Finalize */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-sm">Step 6: Review Grid Configuration</h3>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Substation:</span>
                  <span className="font-bold text-white">{substationName}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Substation Capacity:</span>
                  <span className="font-bold text-emerald-400">{capacityMw} MW</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Available Generation:</span>
                  <span className="font-bold text-cyan-400">{availableMw} MW</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Configured Feeders:</span>
                  <span className="font-bold text-white">{feeders.length} Feeders</span>
                </div>
              </div>

              <button
                onClick={handleCreateGrid}
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-cyan-400 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>{isSubmitting ? 'Initializing Grid...' : 'CREATE GRID & START SIMULATION'}</span>
              </button>
            </div>
          )}

          {/* Next / Prev Navigation */}
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
              disabled={currentStep === 6}
              onClick={() => setCurrentStep((s) => Math.min(6, s + 1))}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* CSV Upload Mode */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="font-bold text-white text-base">CSV Data Import & Template Center</h3>
            <p className="text-xs text-slate-400 mt-1">
              Import custom grid topology or telemetry data using standard CSV spreadsheets. Download sample templates below to get started.
            </p>
          </div>

          {/* Download Templates Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            {[
              { id: 'feeders', label: 'Feeders Template', sub: 'feeder_id, capacity_mw' },
              { id: 'consumer', label: 'Consumers Template', sub: 'consumer_type, priority' },
              { id: 'load', label: 'Telemetry Template', sub: 'hourly readings' },
              { id: 'outage', label: 'Outages Template', sub: 'historical outage log' },
            ].map((t) => (
              <a
                key={t.id}
                href={`/api/data/templates/${t.id}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-center space-y-1 block transition-all group"
              >
                <div className="text-emerald-400 font-bold group-hover:text-emerald-300">↓ {t.label}</div>
                <div className="text-[10px] text-slate-500 font-sans">{t.sub}</div>
              </a>
            ))}
          </div>

          <form onSubmit={handleCSVUpload} className="space-y-4 text-xs pt-2 border-t border-slate-800">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <label className="block text-slate-300 font-semibold">Feeders CSV (feeder_id, feeder_name, capacity_mw)</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFeedersFile(e.target.files?.[0] || null)}
                className="w-full text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-emerald-400 font-mono cursor-pointer"
              />
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <label className="block text-slate-300 font-semibold">Consumer Groups CSV (consumer_id, feeder_id, consumer_type, power_mw, priority, flexibility, is_critical)</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setConsumerFile(e.target.files?.[0] || null)}
                className="w-full text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-emerald-400 font-mono cursor-pointer"
              />
            </div>

            {uploadMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl font-mono">
                {uploadMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || (!feedersFile && !consumerFile)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{isSubmitting ? 'Uploading CSV & Rebuilding Grid...' : 'UPLOAD & INITIALIZE GRID'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
