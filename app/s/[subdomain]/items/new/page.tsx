import { getSubdomainData, type RegistryComponent } from '@/lib/subdomains';
import { notFound } from 'next/navigation';
import { ComponentDetail } from '../[item]/page-client';

export default async function NewComponentPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
 
  const subdomainData = await getSubdomainData(subdomain);
  if (!subdomainData) {
    notFound();
  }

  // Create an empty component template
  const emptyComponent: RegistryComponent = {
    name: '',
    type: 'registry:component',
    description: '',
    dependencies: [],
    registryDependencies: [],
    files: [],
    cssVars: {
      light: {},
      dark: {}
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-mono">
      <ComponentDetail 
        component={emptyComponent}
        subdomain={subdomain}
        registryData={subdomainData}
        isNew={true}
      />
    </div>
  );
} 