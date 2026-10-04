import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { exportImportService } from '../../services/exportImportService';
import { Transaction } from '../../types/finance';
import { UploadCloud, FileCheck, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: Partial<Transaction>[]) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [parsedData, setParsedData] = useState<Partial<Transaction>[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const parsed = exportImportService.parseCsv(text);
        if (parsed.length === 0) {
          setError('No valid transactions could be parsed from this CSV file. Please check column headers.');
        } else {
          setParsedData(parsed);
        }
      } catch (err) {
        setError(`Failed to parse CSV: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (parsedData.length > 0) {
      onImport(parsedData);
      setParsedData([]);
      setFileName('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Transactions from CSV"
      subtitle="Upload your bank export or spreadsheet CSV with standard Date, Type, Title, Amount, Category headers."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Upload Dropzone */}
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 cursor-pointer bg-slate-950/60 transition-colors">
          <UploadCloud className="w-10 h-10 text-indigo-400 mb-2" />
          <span className="text-sm font-semibold text-slate-200">
            {fileName ? fileName : 'Click to select or drag & drop CSV file'}
          </span>
          <span className="text-xs text-slate-500 mt-1">Supports standard CSV format with headers</span>
          <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
        </label>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Preview of Parsed Rows */}
        {parsedData.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <FileCheck className="w-4 h-4" /> Ready to import {parsedData.length} records
              </span>
              <span>Showing preview of first 5</span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80">
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Title</th>
                      <th className="p-2">Category</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2 font-mono">{row.date}</td>
                        <td className="p-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              row.type === 'income'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td className="p-2 truncate max-w-[140px]">{row.title}</td>
                        <td className="p-2 text-slate-400 truncate max-w-[120px]">{row.category}</td>
                        <td className="p-2 text-right font-semibold text-white">
                          {formatCurrency(row.amount || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={parsedData.length === 0}
            onClick={handleConfirmImport}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg transition-all"
          >
            Import {parsedData.length > 0 ? `${parsedData.length} Transactions` : ''}
          </button>
        </div>
      </div>
    </Modal>
  );
};
