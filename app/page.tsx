import { getSubdomainData } from '@/lib/subdomains';
import { notFound } from 'next/navigation';
import { extractSubdomainFromHeaders } from '@/lib/utils';
import { headers } from 'next/headers';
import { RegistryDisplay } from '@/app/components/registry-display';
import { NewRegistryForm } from '@/app/components/new-registry-form';

export default async function HomePage() {
  const subdomain = await extractSubdomainFromHeaders(await headers());
  
  // If we're on a subdomain, show registry details
  if (subdomain) {
    const subdomainData = await getSubdomainData(subdomain);
    if (!subdomainData) {
      notFound();
    }

    return <RegistryDisplay subdomain={subdomain} subdomainData={subdomainData} />;
  }

  // If we're on the root domain, show the form to create a new registry
  return <NewRegistryForm />;
}
