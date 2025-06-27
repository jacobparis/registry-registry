import { getSubdomainData } from '@/lib/subdomains';
import { notFound } from 'next/navigation';
import { extractSubdomainFromHeaders } from '@/lib/utils';
import { headers } from 'next/headers';
import { RegistryDisplay } from '@/app/components/registry-display';
import { NewRegistryForm } from '@/app/components/new-registry-form';


export default async function HomePage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
 
    const subdomainData = await getSubdomainData(subdomain);
    if (!subdomainData) {
      notFound();
    }

    return <RegistryDisplay subdomain={subdomain} subdomainData={subdomainData} />;
}
