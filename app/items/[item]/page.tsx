import { getSubdomainData, getComponentData } from '@/lib/subdomains';
import { notFound } from 'next/navigation';
import { extractSubdomainFromHeaders } from '@/lib/utils';
import { headers } from 'next/headers';
import { ComponentDetail } from '@/app/components/component-detail';

interface ItemPageProps {
  params: Promise<{
    item: string;
  }>;
}

export default async function ItemPage({ params }: ItemPageProps) {
  const subdomain = await extractSubdomainFromHeaders(await headers());
  
  // Must be on a subdomain to show component details
  if (!subdomain) {
    notFound();
  }

  const subdomainData = await getSubdomainData(subdomain);
  if (!subdomainData) {
    notFound();
  }

  const { item: itemName } = await params;
  
  // Try to get the component data directly from KV first
  let component = await getComponentData(subdomain, itemName);
  
  // Fallback: search in the main registry if not found in individual storage
  if (!component) {
    component = subdomainData.registry?.find(
      (comp) => comp.name === itemName
    ) || null;
  }

  if (!component) {
    notFound();
  }

  return (
    <ComponentDetail
      component={component}
      subdomain={subdomain}
      registryData={subdomainData}
    />
  );
}

export async function generateMetadata({ params }: ItemPageProps) {
  const subdomain = await extractSubdomainFromHeaders(await headers());
  
  if (!subdomain) {
    return {
      title: 'Component Not Found',
    };
  }

  const subdomainData = await getSubdomainData(subdomain);
  if (!subdomainData) {
    return {
      title: 'Component Not Found',
    };
  }

  const { item: itemName } = await params;
  
  // Try to get the component data directly from KV first
  let component = await getComponentData(subdomain, itemName);
  
  // Fallback: search in the main registry if not found in individual storage
  if (!component) {
    component = subdomainData.registry?.find(
      (comp) => comp.name === itemName
    ) || null;
  }

  if (!component) {
    return {
      title: 'Component Not Found',
    };
  }

  return {
    title: `${component.name} - ${subdomainData.name || subdomain}`,
    description: component.description || `${component.name} component from ${subdomain} registry`,
  };
} 