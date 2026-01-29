import { useState, useRef } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, Loader, FileSpreadsheet, ChevronRight } from 'lucide-react';
import {
  parseFile,
  autoDetectMapping,
  applyMapping,
  validateRow,
  prepareApplicationData,
  downloadTemplate,
  exportErrorsToCSV,
  ALL_FIELDS,
  FIELD_LABELS,
  REQUIRED_FIELDS,
  type ParsedFile,
  type ColumnMapping,
  type ValidatedRow,
} from '../lib/import';
import { applicationApi } from '../lib/api';
import { supabase } from '../lib/supabase';
import { MAX_FILE_SIZE } from '../lib/constants';

interface ImportApplicationsModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'results';

interface ImportResult {
  success: boolean;
  rowIndex: number;
  error?: string;
  applicationId?: string;
}

export default function ImportApplicationsModal({ onClose, onSuccess }: ImportApplicationsModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setError(null);

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size exceeds 5MB limit');
      return;
    }

    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      setError('Invalid file type. Please upload a CSV or Excel file.');
      return;
    }

    try {
      setFile(selectedFile);
      const parsed = await parseFile(selectedFile);
      setParsedData(parsed);
      const detectedMapping = autoDetectMapping(parsed.headers);
      setMapping(detectedMapping);
      setStep('mapping');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setFile(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleMappingChange = (systemField: string, userHeader: string) => {
    setMapping(prev => ({
      ...prev,
      [systemField]: userHeader || null,
    }));
  };

  const handlePreview = () => {
    if (!parsedData) return;

    const validated: ValidatedRow[] = [];
    const { data: user } = supabase.auth.getUser();

    parsedData.rows.forEach((row, index) => {
      const mappedData = applyMapping(row, parsedData.headers, mapping);
      const validatedRow = validateRow(mappedData, index);
      validated.push(validatedRow);
    });

    setValidatedRows(validated);
    setStep('preview');
  };

  const handleImport = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError('Not authenticated');
      return;
    }

    setStep('importing');
    setImporting(true);
    setImportProgress(0);

    const results: ImportResult[] = [];
    const validRows = validatedRows.filter(row => row.isValid);
    const batchSize = 50;

    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (row) => {
          try {
            const { application, referral } = prepareApplicationData(row, userData.user.id);
            const referrals = referral ? [referral] : [];
            const result = await applicationApi.create(application as any, referrals);

            results.push({
              success: true,
              rowIndex: row.rowIndex,
              applicationId: result.id,
            });
          } catch (err) {
            results.push({
              success: false,
              rowIndex: row.rowIndex,
              error: err instanceof Error ? err.message : 'Unknown error',
            });
          }
        })
      );

      setImportProgress(Math.round(((i + batch.length) / validRows.length) * 100));
    }

    setImportResults(results);
    setImporting(false);
    setStep('results');

    if (results.every(r => r.success)) {
      onSuccess();
    }
  };

  const successCount = importResults.filter(r => r.success).length;
  const failureCount = importResults.filter(r => !r.success).length;
  const errorRows = validatedRows.filter(row => !row.isValid);
  const warningRows = validatedRows.filter(row => row.isValid && row.errors.length > 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Import Applications</h2>
            <p className="text-sm text-neutral-600 mt-1">
              {step === 'upload' && 'Upload your CSV or Excel file'}
              {step === 'mapping' && 'Map your columns to system fields'}
              {step === 'preview' && 'Review and validate your data'}
              {step === 'importing' && 'Importing applications...'}
              {step === 'results' && 'Import complete'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 mb-1">Need a template?</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Download our template file with all the correct column headers and example data to get started quickly.
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-neutral-300 bg-neutral-50 hover:border-neutral-400 hover:bg-neutral-100'
                }`}
              >
                <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-neutral-700 mb-2">
                  Drop your file here or click to browse
                </p>
                <p className="text-sm text-neutral-500 mb-4">
                  Supports CSV, XLSX, and XLS files (max 5MB, up to 200 applications)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) handleFileSelect(selectedFile);
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Select File
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 'mapping' && parsedData && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Found {parsedData.totalRows} rows</strong> in your file. Map your file columns to the system fields below.
                  Required fields are marked with an asterisk (*).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ALL_FIELDS.map((field) => {
                  const isRequired = REQUIRED_FIELDS.includes(field as any);
                  return (
                    <div key={field} className="space-y-1">
                      <label className="block text-sm font-medium text-neutral-700">
                        {FIELD_LABELS[field]}
                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <select
                        value={mapping[field] || ''}
                        onChange={(e) => handleMappingChange(field, e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Skip this field --</option>
                        {parsedData.headers.map((header, index) => (
                          <option key={index} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              <div className="bg-neutral-100 rounded-lg p-4">
                <h4 className="font-medium text-neutral-900 mb-3">Preview (First 3 Rows)</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-300">
                        {REQUIRED_FIELDS.map((field) => (
                          <th key={field} className="text-left py-2 px-3 font-medium text-neutral-700">
                            {FIELD_LABELS[field]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.rows.slice(0, 3).map((row, index) => {
                        const mappedData = applyMapping(row, parsedData.headers, mapping);
                        return (
                          <tr key={index} className="border-b border-neutral-200">
                            {REQUIRED_FIELDS.map((field) => (
                              <td key={field} className="py-2 px-3 text-neutral-600">
                                {mappedData[field] || <span className="text-neutral-400 italic">empty</span>}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between gap-3">
                <button
                  onClick={() => {
                    setStep('upload');
                    setFile(null);
                    setParsedData(null);
                  }}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handlePreview}
                  disabled={!mapping.company_name || !mapping.position_title}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Continue to Preview
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-900">{validatedRows.length}</div>
                  <div className="text-sm text-blue-700">Total Rows</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-900">
                    {validatedRows.filter(r => r.isValid && r.errors.length === 0).length}
                  </div>
                  <div className="text-sm text-green-700">Valid</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-900">{warningRows.length}</div>
                  <div className="text-sm text-yellow-700">Warnings</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-900">{errorRows.length}</div>
                  <div className="text-sm text-red-700">Errors</div>
                </div>
              </div>

              {errorRows.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-900 mb-1">
                        {errorRows.length} row{errorRows.length !== 1 ? 's' : ''} with errors
                      </h4>
                      <p className="text-sm text-red-700">
                        These rows will be skipped during import. Fix the errors and try again.
                      </p>
                    </div>
                    <button
                      onClick={() => exportErrorsToCSV(validatedRows)}
                      className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export Errors
                    </button>
                  </div>
                </div>
              )}

              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full text-sm">
                    <thead className="bg-neutral-100 sticky top-0">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-neutral-700">Row</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-700">Company</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-700">Position</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-700">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-700">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-700">Issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validatedRows.map((row) => (
                        <tr
                          key={row.rowIndex}
                          className={`border-b border-neutral-200 ${
                            !row.isValid
                              ? 'bg-red-50'
                              : row.errors.length > 0
                              ? 'bg-yellow-50'
                              : 'bg-white'
                          }`}
                        >
                          <td className="py-3 px-4 text-neutral-600">{row.rowIndex + 1}</td>
                          <td className="py-3 px-4 text-neutral-900">{row.data.company_name || '-'}</td>
                          <td className="py-3 px-4 text-neutral-900">{row.data.position_title || '-'}</td>
                          <td className="py-3 px-4 text-neutral-900">{row.data.status || 'Applied'}</td>
                          <td className="py-3 px-4 text-neutral-900">{row.data.application_date || '-'}</td>
                          <td className="py-3 px-4">
                            {row.errors.length > 0 ? (
                              <div className="space-y-1">
                                {row.errors.map((error, i) => (
                                  <div
                                    key={i}
                                    className={`text-xs ${
                                      error.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                                    }`}
                                  >
                                    {error.message}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Valid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between gap-3">
                <button
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Back to Mapping
                </button>
                <button
                  onClick={handleImport}
                  disabled={validatedRows.filter(r => r.isValid).length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
                >
                  Import {validatedRows.filter(r => r.isValid).length} Application
                  {validatedRows.filter(r => r.isValid).length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="space-y-6 py-12">
              <div className="flex justify-center">
                <Loader className="w-16 h-16 text-blue-600 animate-spin" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Importing Applications...</h3>
                <p className="text-neutral-600">Please wait while we import your data</p>
              </div>
              <div className="max-w-md mx-auto">
                <div className="bg-neutral-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-neutral-600 mt-2">{importProgress}% complete</p>
              </div>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-6">
              <div className="text-center py-6">
                {failureCount === 0 ? (
                  <>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-neutral-900 mb-2">Import Successful!</h3>
                    <p className="text-neutral-600">
                      Successfully imported {successCount} application{successCount !== 1 ? 's' : ''}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-10 h-10 text-yellow-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-neutral-900 mb-2">Import Completed with Issues</h3>
                    <p className="text-neutral-600">
                      Successfully imported {successCount} application{successCount !== 1 ? 's' : ''}, {failureCount}{' '}
                      failed
                    </p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-900">{successCount}</div>
                  <div className="text-sm text-green-700">Successfully Imported</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-3xl font-bold text-red-900">{failureCount}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
              </div>

              {failureCount > 0 && (
                <div className="border border-neutral-200 rounded-lg overflow-hidden">
                  <div className="bg-neutral-100 px-4 py-3 border-b border-neutral-200">
                    <h4 className="font-medium text-neutral-900">Failed Imports</h4>
                  </div>
                  <div className="overflow-x-auto max-h-64">
                    <table className="min-w-full text-sm">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="text-left py-2 px-4 font-medium text-neutral-700">Row</th>
                          <th className="text-left py-2 px-4 font-medium text-neutral-700">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResults
                          .filter((r) => !r.success)
                          .map((result) => (
                            <tr key={result.rowIndex} className="border-b border-neutral-200">
                              <td className="py-2 px-4 text-neutral-600">{result.rowIndex + 1}</td>
                              <td className="py-2 px-4 text-red-700">{result.error}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
