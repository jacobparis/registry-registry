import { getSubdomainData } from '@/lib/subdomains';
import { notFound } from 'next/navigation';
import { RegistryDisplay } from '@/components/registry-display';

export default async function HomePage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
 
  const subdomainData = await getSubdomainData(subdomain);
  if (!subdomainData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-mono">
      <RegistryDisplay subdomain={subdomain} subdomainData={subdomainData} />
    </div>
  );
}
