import { NextRequest, NextResponse } from 'next/server';
import { getSubdomainData } from '@/lib/subdomains';
import { extractSubdomainFromHeaders } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const subdomain = await extractSubdomainFromHeaders(request.headers);

  if (!subdomain) {
    return NextResponse.json(
      { error: 'No subdomain found' },
      { status: 400 }
    );
  }

  const subdomainData = await getSubdomainData(subdomain);

  if (!subdomainData) {
    return NextResponse.json(
      { error: 'Registry not found' },
      { status: 404 }
    );
  }

  // Return just the registry array as JSON
  return NextResponse.json(subdomainData.registry, {
    headers: {
      'Content-Type': 'application/json',
      // Allow CORS for API usage
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 