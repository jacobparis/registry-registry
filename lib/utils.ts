import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';


export const protocol =
  process.env.NODE_ENV === 'production' ? 'https' : 'http';
export const rootDomain =
  process.env.VERCEL_PROJECT_PRODUCTION_URL || 'localhost:3000';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function extractSubdomainFromHeaders(headersList: Headers): Promise<string | null> {
  // TODO: security risk?
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';

  const hostname = host.split(':')[0];
  // Local development environment
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    if (hostname.includes('.localhost')) {
      return hostname.split('.')[0];
    }
    return null;
  }

  // Production environment
  const rootDomainFormatted = rootDomain.split(':')[0];

  // Handle preview deployment URLs (tenant---branch-name.vercel.app)
  if (hostname.includes('---') && hostname.endsWith('.vercel.app')) {
    const parts = hostname.split('---');
    return parts.length > 0 ? parts[0] : null;
  }

  // Regular subdomain detection
  const isSubdomain = hostname !== rootDomainFormatted &&
    hostname !== `www.${rootDomainFormatted}` &&
    hostname.endsWith(`.${rootDomainFormatted}`);

  return isSubdomain ? hostname.replace(`.${rootDomainFormatted}`, '') : null;
}

