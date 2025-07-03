import { getSubdomainData, getComponentData } from '@/lib/subdomains';
import { NextRequest, NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{
    style: string;
    item: string;
    subdomain: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { subdomain } = await context.params;
  
  if (!subdomain) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }

  const subdomainData = await getSubdomainData(subdomain);
  if (!subdomainData) {
    return NextResponse.json(
      { error: 'Registry not found' },
      { status: 404 }
    );
  }

  const { style: styleName, item: itemName } = await context.params;
  
  // Try to get the component data directly from KV first
  let component = await getComponentData(subdomain, itemName);
  
  // Fallback: search in the main registry if not found in individual storage
  if (!component) {
    component = subdomainData.registry?.find(
      (comp) => comp.name === itemName
    ) || null;
  }

  if (!component) {
    return NextResponse.json(
      { error: 'Component not found' },
      { status: 404 }
    );
  }

  // For style-specific requests, we could potentially:
  // 1. Filter files by style if the component has style-specific variations
  // 2. Modify the component data based on the style
  // 3. Return style-specific metadata
  
  // For now, we'll include the requested style in the response metadata
  const styledComponent = {
    ...component,
    style: styleName,
    // You could add style-specific transformations here
    meta: {
      requestedStyle: styleName
    }
  };

  return NextResponse.json(styledComponent, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 