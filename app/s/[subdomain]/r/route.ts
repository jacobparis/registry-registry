import { NextRequest, NextResponse } from 'next/server';
import { getSubdomainData } from '@/lib/subdomains';

interface RouteContext {
  params: Promise<{
    subdomain: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { subdomain } = await context.params;

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