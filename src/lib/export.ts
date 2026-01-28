import type { ApplicationWithRelations } from './database.types';

export function downloadCSV(applications: ApplicationWithRelations[], filename: string = 'applications.csv') {
  const headers = [
    'Company',
    'Position',
    'Status',
    'Application Date',
    'Location',
    'Work Type',
    'Source',
    'Salary Range',
    'Job URL',
    'TA Contact Name',
    'TA Contact Email',
    'TA Contact Phone',
    'HR Coordinator Name',
    'HR Coordinator Email',
    'HR Coordinator Phone',
    'Referrals',
    'Interview Rounds',
    'Notes',
  ];

  const rows = applications.map((app) => {
    const referrals = app.referrals?.map((r) => r.name).join('; ') || '';
    const interviewCount = app.interview_rounds?.length || 0;

    return [
      app.company_name,
      app.position_title,
      app.status,
      new Date(app.application_date).toLocaleDateString(),
      app.location || '',
      app.work_type,
      app.application_source,
      app.salary_range || '',
      app.job_url || '',
      app.ta_contact_name || '',
      app.ta_contact_email || '',
      app.ta_contact_phone || '',
      app.hr_coordinator_name || '',
      app.hr_coordinator_email || '',
      app.hr_coordinator_phone || '',
      referrals,
      interviewCount.toString(),
      app.notes || '',
    ];
  });

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

export function downloadJSON(applications: ApplicationWithRelations[], filename: string = 'applications.json') {
  const json = JSON.stringify(applications, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, filename);
}

export function downloadDetailedReport(applications: ApplicationWithRelations[], filename: string = 'detailed-report.csv') {
  const rows: string[][] = [];

  applications.forEach((app) => {
    rows.push([
      'Application',
      app.company_name,
      app.position_title,
      app.status,
      new Date(app.application_date).toLocaleDateString(),
      app.location || '',
      app.work_type,
      app.application_source,
      app.salary_range || '',
    ]);

    if (app.referrals && app.referrals.length > 0) {
      app.referrals.forEach((referral) => {
        rows.push([
          'Referral',
          referral.name,
          referral.relationship || '',
          referral.contact_info || '',
          '',
          '',
          '',
          '',
          '',
        ]);
      });
    }

    if (app.interview_rounds && app.interview_rounds.length > 0) {
      app.interview_rounds.forEach((round) => {
        rows.push([
          'Interview',
          `Round ${round.round_number}`,
          round.round_type,
          round.status,
          new Date(round.interview_date).toLocaleString(),
          round.interviewer_name,
          round.feedback_sentiment || '',
          '',
          '',
        ]);
      });
    }

    rows.push(['', '', '', '', '', '', '', '', '']);
  });

  const headers = ['Type', 'Field 1', 'Field 2', 'Field 3', 'Field 4', 'Field 5', 'Field 6', 'Field 7', 'Field 8'];
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
