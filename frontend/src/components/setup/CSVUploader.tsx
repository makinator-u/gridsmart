import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { api } from '../../api/client';

interface CSVUploaderProps {
  onComplete: () => void;
}

export const CSVUploader: React.FC<CSVUploaderProps> = ({ onComplete }) => {
  const [feedersFile, setFeedersFile] = useState<File | null>(null);
  const [consumerFile, setConsumerFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const TEMPLATES = [
    { id: 'feeders', label: 'Feeders Template', sub: 'feeder_id, feeder_name, capacity_mw' },
    { id: 'consumer', label: 'Consumers Template', sub: 'consumer_type, priority, is_critical' },
    { id: 'load', label: 'Telemetry Template', sub: 'hourly load readings' },
    { id: 'outage', label: 'Outages Template', sub: 'historical outage log' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedersFile && !consumerFile) return;
    setIsSubmitting(true);
    try {
      const res = await api.uploadCSV(feedersFile || undefined, consumerFile || undefined);
      setUploadMessage(res.message);
      setIsSubmitting(false);
      onComplete();
    } catch (err) {
      console.error('CSV upload failed:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Download Templates */}
      <div>
        <h4 className="text-xs font-bold text-slate-300 mb-3">Download Sample CSV Templates</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          {TEMPLATES.map((t) => (
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
      </div>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs pt-2 border-t border-slate-800">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
          <label className="block text-slate-300 font-semibold">
            Feeders CSV <span className="text-slate-500 font-normal">(feeder_id, feeder_name, capacity_mw)</span>
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFeedersFile(e.target.files?.[0] || null)}
            className="w-full text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-emerald-400 font-mono cursor-pointer"
          />
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
          <label className="block text-slate-300 font-semibold">
            Consumer Groups CSV{' '}
            <span className="text-slate-500 font-normal">(consumer_type, feeder_id, power_mw, priority, is_critical)</span>
          </label>
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
          <span>{isSubmitting ? 'Uploading & Rebuilding Grid...' : 'UPLOAD & INITIALIZE GRID'}</span>
        </button>
      </form>
    </div>
  );
};
