export interface ParsedJobData {
  company?: string;
  position?: string;
  location?: string;
}

export function parseJobUrl(url: string): ParsedJobData {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    if (hostname.includes('linkedin.com')) {
      return parseLinkedIn(pathname, searchParams);
    } else if (hostname.includes('greenhouse.io')) {
      return parseGreenhouse(pathname);
    } else if (hostname.includes('lever.co')) {
      return parseLever(pathname, hostname);
    } else if (hostname.includes('indeed.com')) {
      return parseIndeed(searchParams);
    } else if (hostname.includes('glassdoor.com')) {
      return parseGlassdoor(pathname);
    }

    return extractFromGenericUrl(hostname, pathname);
  } catch (error) {
    console.error('Error parsing URL:', error);
    return {};
  }
}

function parseLinkedIn(pathname: string, searchParams: URLSearchParams): ParsedJobData {
  const result: ParsedJobData = {};

  const pathParts = pathname.split('/').filter(Boolean);
  if (pathParts.includes('jobs') && pathParts.includes('view')) {
    const titleMatch = pathname.match(/jobs\/([^/]+)/);
    if (titleMatch) {
      result.position = decodeURIComponent(titleMatch[1]).replace(/-/g, ' ');
    }
  }

  return result;
}

function parseGreenhouse(pathname: string): ParsedJobData {
  const result: ParsedJobData = {};

  const companyMatch = pathname.match(/\/([^/]+)\/jobs/);
  if (companyMatch) {
    result.company = formatCompanyName(companyMatch[1]);
  }

  const titleMatch = pathname.match(/jobs\/\d+\?gh_jid=\d+/);
  if (titleMatch) {
    const parts = pathname.split('/');
    const jobPart = parts[parts.length - 1];
    if (jobPart) {
      result.position = formatJobTitle(jobPart.split('?')[0]);
    }
  }

  return result;
}

function parseLever(pathname: string, hostname: string): ParsedJobData {
  const result: ParsedJobData = {};

  const companyMatch = hostname.match(/jobs\.([^.]+)\.com/) || hostname.match(/([^.]+)\.lever\.co/);
  if (companyMatch) {
    result.company = formatCompanyName(companyMatch[1]);
  }

  const pathParts = pathname.split('/').filter(Boolean);
  if (pathParts.length > 0) {
    result.position = formatJobTitle(pathParts[pathParts.length - 1]);
  }

  return result;
}

function parseIndeed(searchParams: URLSearchParams): ParsedJobData {
  const result: ParsedJobData = {};

  const title = searchParams.get('q');
  if (title) {
    result.position = title;
  }

  const location = searchParams.get('l');
  if (location) {
    result.location = location;
  }

  return result;
}

function parseGlassdoor(pathname: string): ParsedJobData {
  const result: ParsedJobData = {};

  const parts = pathname.split('/').filter(Boolean);
  const jobIndex = parts.indexOf('job');

  if (jobIndex !== -1 && jobIndex + 1 < parts.length) {
    result.position = formatJobTitle(parts[jobIndex + 1]);
  }

  return result;
}

function extractFromGenericUrl(hostname: string, pathname: string): ParsedJobData {
  const result: ParsedJobData = {};

  const domainParts = hostname.split('.');
  if (domainParts.length >= 2) {
    const mainDomain = domainParts[domainParts.length - 2];
    if (mainDomain !== 'com' && mainDomain !== 'co' && mainDomain !== 'jobs') {
      result.company = formatCompanyName(mainDomain);
    }
  }

  return result;
}

function formatCompanyName(raw: string): string {
  return raw
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatJobTitle(raw: string): string {
  return raw
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => {
      if (word.toLowerCase() === 'and' || word.toLowerCase() === 'or' || word.toLowerCase() === 'at') {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
