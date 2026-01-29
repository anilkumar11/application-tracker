import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { APPLICATION_STATUSES, APPLICATION_SOURCES, WORK_TYPES } from './database.types';
import type { Database } from './database.types';

type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];

export interface ImportRow {
  company_name: string;
  position_title: string;
  status: string;
  application_date: string;
  application_source: string;
  salary_range: string;
  job_url: string;
  location: string;
  work_type: string;
  documents_url: string;
  notes: string;
  ta_contact_name: string;
  ta_contact_phone: string;
  ta_contact_email: string;
  hr_coordinator_name: string;
  hr_coordinator_phone: string;
  hr_coordinator_email: string;
  referral_name: string;
  referral_relationship: string;
  referral_contact_info: string;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidatedRow {
  rowIndex: number;
  data: Partial<ImportRow>;
  errors: ValidationError[];
  isValid: boolean;
}

export interface ColumnMapping {
  [systemField: string]: string | null;
}

export interface ParsedFile {
  headers: string[];
  rows: any[][];
  totalRows: number;
}

export const REQUIRED_FIELDS = ['company_name', 'position_title'] as const;

export const OPTIONAL_FIELDS = [
  'status',
  'application_date',
  'application_source',
  'salary_range',
  'job_url',
  'location',
  'work_type',
  'documents_url',
  'notes',
  'ta_contact_name',
  'ta_contact_phone',
  'ta_contact_email',
  'hr_coordinator_name',
  'hr_coordinator_phone',
  'hr_coordinator_email',
  'referral_name',
  'referral_relationship',
  'referral_contact_info',
] as const;

export const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS] as const;

export const FIELD_LABELS: Record<string, string> = {
  company_name: 'Company Name',
  position_title: 'Position Title',
  status: 'Status',
  application_date: 'Application Date',
  application_source: 'Application Source',
  salary_range: 'Salary Range',
  job_url: 'Job URL',
  location: 'Location',
  work_type: 'Work Type',
  documents_url: 'Documents URL',
  notes: 'Notes',
  ta_contact_name: 'TA Contact Name',
  ta_contact_phone: 'TA Contact Phone',
  ta_contact_email: 'TA Contact Email',
  hr_coordinator_name: 'HR Coordinator Name',
  hr_coordinator_phone: 'HR Coordinator Phone',
  hr_coordinator_email: 'HR Coordinator Email',
  referral_name: 'Referral Name',
  referral_relationship: 'Referral Relationship',
  referral_contact_info: 'Referral Contact Info',
};

export function generateTemplateCSV(): string {
  const headers = [
    'company_name',
    'position_title',
    'status',
    'application_date',
    'application_source',
    'salary_range',
    'job_url',
    'location',
    'work_type',
    'notes',
    'referral_name',
    'referral_relationship',
    'referral_contact_info',
  ];

  const exampleRow = [
    'Tech Corp',
    'Senior Software Engineer',
    'Applied',
    '2024-01-15',
    'LinkedIn',
    '$120,000 - $150,000',
    'https://example.com/job',
    'San Francisco, CA',
    'Hybrid',
    'Great company culture',
    'John Doe',
    'Former Colleague',
    'john.doe@email.com',
  ];

  const commentsRow = [
    'Required',
    'Required',
    'Applied, Interviewing, Offer, Rejected, or Withdrawn',
    'YYYY-MM-DD format',
    'Referral, Direct, Recruiter, Job Board, Company Website, Networking Event, or Other',
    'Optional',
    'Optional',
    'Optional',
    'Remote, Hybrid, or Onsite',
    'Optional',
    'Optional - if referred',
    'Optional - if referred',
    'Optional - if referred',
  ];

  const csv = Papa.unparse({
    fields: headers,
    data: [commentsRow, exampleRow],
  });

  return csv;
}

export function downloadTemplate(): void {
  const csv = generateTemplateCSV();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'job_applications_template.csv');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (fileExtension === 'csv') {
    return parseCSV(file);
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    return parseExcel(file);
  } else {
    throw new Error('Unsupported file format. Please upload a CSV or Excel file.');
  }
}

function parseCSV(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
          return;
        }

        const data = results.data as string[][];
        if (data.length < 2) {
          reject(new Error('File must contain at least a header row and one data row'));
          return;
        }

        const headers = data[0];
        const rows = data.slice(1).filter(row => row.some(cell => cell && cell.trim()));

        resolve({
          headers,
          rows,
          totalRows: rows.length,
        });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}

function parseExcel(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        if (jsonData.length < 2) {
          reject(new Error('File must contain at least a header row and one data row'));
          return;
        }

        const headers = jsonData[0];
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell && String(cell).trim()));

        resolve({
          headers,
          rows,
          totalRows: rows.length,
        });
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsBinaryString(file);
  });
}

export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim().replace(/[_\s-]+/g, '_'));

  ALL_FIELDS.forEach(field => {
    const fieldNormalized = field.toLowerCase();
    const index = normalizedHeaders.findIndex(h => {
      if (h === fieldNormalized) return true;
      if (h.includes(fieldNormalized)) return true;
      if (fieldNormalized.includes(h) && h.length > 3) return true;

      const fieldWords = fieldNormalized.split('_');
      const headerWords = h.split('_');
      if (fieldWords.every(w => headerWords.includes(w))) return true;

      return false;
    });

    mapping[field] = index >= 0 ? headers[index] : null;
  });

  return mapping;
}

export function applyMapping(row: any[], headers: string[], mapping: ColumnMapping): Partial<ImportRow> {
  const mappedRow: any = {};

  Object.entries(mapping).forEach(([systemField, userHeader]) => {
    if (userHeader) {
      const index = headers.indexOf(userHeader);
      if (index >= 0) {
        const value = row[index];
        mappedRow[systemField] = value !== undefined && value !== null ? String(value).trim() : '';
      }
    }
  });

  return mappedRow;
}

function validateDate(dateString: string): { isValid: boolean; normalized?: string; error?: string } {
  if (!dateString || !dateString.trim()) {
    return { isValid: false, error: 'Date is required' };
  }

  const formats = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    /^\d{1,2}-\d{1,2}-\d{4}$/,
  ];

  const trimmed = dateString.trim();

  if (formats[0].test(trimmed)) {
    return { isValid: true, normalized: trimmed };
  }

  if (formats[1].test(trimmed)) {
    const [month, day, year] = trimmed.split('/');
    const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return { isValid: true, normalized };
  }

  if (formats[2].test(trimmed)) {
    const [month, day, year] = trimmed.split('-');
    const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return { isValid: true, normalized };
  }

  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return { isValid: true, normalized: `${year}-${month}-${day}` };
  }

  return { isValid: false, error: 'Invalid date format. Use YYYY-MM-DD, MM/DD/YYYY, or MM-DD-YYYY' };
}

export function validateRow(data: Partial<ImportRow>, rowIndex: number): ValidatedRow {
  const errors: ValidationError[] = [];

  if (!data.company_name || !data.company_name.trim()) {
    errors.push({
      field: 'company_name',
      message: 'Company name is required',
      severity: 'error',
    });
  }

  if (!data.position_title || !data.position_title.trim()) {
    errors.push({
      field: 'position_title',
      message: 'Position title is required',
      severity: 'error',
    });
  }

  if (data.status) {
    const validStatuses = APPLICATION_STATUSES as readonly string[];
    if (!validStatuses.includes(data.status)) {
      errors.push({
        field: 'status',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        severity: 'error',
      });
    }
  }

  if (data.application_source) {
    const validSources = APPLICATION_SOURCES as readonly string[];
    if (!validSources.includes(data.application_source)) {
      errors.push({
        field: 'application_source',
        message: `Invalid source. Must be one of: ${validSources.join(', ')}`,
        severity: 'warning',
      });
    }
  }

  if (data.work_type) {
    const validTypes = WORK_TYPES as readonly string[];
    if (!validTypes.includes(data.work_type)) {
      errors.push({
        field: 'work_type',
        message: `Invalid work type. Must be one of: ${validTypes.join(', ')}`,
        severity: 'warning',
      });
    }
  }

  if (data.application_date) {
    const dateValidation = validateDate(data.application_date);
    if (!dateValidation.isValid) {
      errors.push({
        field: 'application_date',
        message: dateValidation.error || 'Invalid date',
        severity: 'warning',
      });
    } else {
      data.application_date = dateValidation.normalized;
    }
  }

  const hasOnlyErrors = errors.every(e => e.severity === 'error');
  const isValid = errors.filter(e => e.severity === 'error').length === 0;

  return {
    rowIndex,
    data,
    errors,
    isValid,
  };
}

export function prepareApplicationData(validatedRow: ValidatedRow, userId: string): {
  application: Partial<ApplicationInsert>;
  referral?: {
    name: string;
    relationship: string;
    contact_info: string;
  };
} {
  const data = validatedRow.data;

  const application: Partial<ApplicationInsert> = {
    user_id: userId,
    company_name: data.company_name || '',
    position_title: data.position_title || '',
    status: data.status || 'Applied',
    application_date: data.application_date || new Date().toISOString().split('T')[0],
    application_source: data.application_source || 'Direct',
    salary_range: data.salary_range || '',
    job_url: data.job_url || '',
    location: data.location || '',
    work_type: data.work_type || 'Hybrid',
    documents_url: data.documents_url || '',
    notes: data.notes || '',
    ta_contact_name: data.ta_contact_name || '',
    ta_contact_phone: data.ta_contact_phone || '',
    ta_contact_email: data.ta_contact_email || '',
    hr_coordinator_name: data.hr_coordinator_name || '',
    hr_coordinator_phone: data.hr_coordinator_phone || '',
    hr_coordinator_email: data.hr_coordinator_email || '',
  };

  let referral;
  if (data.referral_name && data.referral_name.trim()) {
    referral = {
      name: data.referral_name,
      relationship: data.referral_relationship || '',
      contact_info: data.referral_contact_info || '',
    };
  }

  return { application, referral };
}

export function exportErrorsToCSV(validatedRows: ValidatedRow[]): void {
  const errorRows = validatedRows.filter(row => row.errors.length > 0);

  const data = errorRows.map(row => ({
    'Row Number': row.rowIndex + 1,
    'Company': row.data.company_name || '',
    'Position': row.data.position_title || '',
    'Errors': row.errors.map(e => `${e.field}: ${e.message}`).join('; '),
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'import_errors.csv');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
